import { Hono } from 'hono'
import { MercadoPagoConfig, Order } from 'mercadopago'

import { db } from '../db/database'
import { getSession } from '../auth/session'
import { processOrderSchema } from '../validation/schemas'

export const apiRouter = new Hono()

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

apiRouter.post('/process_order', async (c) => {
  const user = await getSession(c)
  if (!user) {
    return c.json({ error: 'unauthorized' }, 401)
  }

  const idempotencyKey = c.req.header('X-Idempotency-Key')
  if (!idempotencyKey || !UUID_V4_RE.test(idempotencyKey)) {
    return c.json({ error: 'missing_or_invalid_idempotency_key' }, 400)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = processOrderSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'validation_error', details: parsed.error.flatten() }, 400)
  }
  const data = parsed.data

  if (data.external_reference !== idempotencyKey) {
    return c.json({ error: 'idempotency_key_mismatch' }, 400)
  }

  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const lockResult = await client.query<{ acquired: boolean }>(
      `SELECT pg_try_advisory_xact_lock(('x' || substr(md5($1), 1, 16))::bit(64)::bigint) AS acquired`,
      [idempotencyKey],
    )
    if (!lockResult.rows[0]?.acquired) {
      await client.query('ROLLBACK')
      client.release()
      return c.json({ error: 'duplicate_request' }, 409)
    }

    const existingPayment = await client.query<{ pedido_id: number }>(
      'SELECT pedido_id FROM pago WHERE idempotency_key = $1',
      [idempotencyKey],
    )
    if (existingPayment.rows.length > 0) {
      await client.query('COMMIT')
      client.release()
      return c.json({ pedido_id: existingPayment.rows[0]!.pedido_id }, 200)
    }

    let total = 0
    const orderLines: { product_id: number; quantity: number; price: number }[] = []

    for (const item of data.items) {
      const { rows } = await client.query<{
        id: number
        nombre: string
        precio: number
        stock: number
      }>(
        `SELECT id, nombre, precio, stock FROM producto WHERE id = $1 FOR UPDATE`,
        [item.producto_id],
      )

      if (rows.length === 0) {
        await client.query('ROLLBACK')
        client.release()
        return c.json({ error: 'product_not_found', product_id: item.producto_id }, 422)
      }

      const product = rows[0]!

      if (item.cantidad > product.stock) {
        await client.query('ROLLBACK')
        client.release()
        return c.json({ error: 'insufficient_stock', product: product.nombre }, 422)
      }

      total += Number(product.precio) * item.cantidad
      orderLines.push({
        product_id: product.id,
        quantity: item.cantidad,
        price: Number(product.precio),
      })
    }

    const mpConfig = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
    const mpOrders = new Order(mpConfig)

    const payment = data.transactions.payments[0]!

    const mpResponse = await mpOrders.create({
      requestOptions: { idempotencyKey },
      body: {
        type: 'online',
        total_amount: String(total),
        external_reference: idempotencyKey,
        processing_mode: 'automatic',
        transactions: {
          payments: [
            {
              amount: String(total),
              payment_method: {
                id: payment.payment_method.id,
                type: payment.payment_method.type ?? 'credit_card',
                token: payment.payment_method.token,
                installments: payment.payment_method.installments,
              },
            },
          ],
        },
        payer: {
          email: data.payer.email,
          ...(data.payer.identification
            ? { identification: data.payer.identification }
            : {}),
        },
      },
    })

    const mpPayment = mpResponse.transactions?.payments?.[0]
    const mpStatus = (mpPayment as any)?.status ?? mpResponse.status ?? 'unknown'
    const mpStatusDetail = (mpPayment as any)?.status_detail ?? (mpResponse as any)?.status_detail ?? 'unknown'
    const mpPaymentId = String((mpPayment as any)?.id ?? '')

    const paymentApproved = mpStatus === 'processed' && mpStatusDetail === 'accredited'

    if (!paymentApproved) {
      await client.query('ROLLBACK')
      client.release()
      return c.json({ error: 'payment_not_approved', mp_status: mpStatus, mp_status_detail: mpStatusDetail }, 402)
    }

    const orderResult = await client.query<{ id: number }>(
      `INSERT INTO pedido (fecha, total, status, usuario_id)
       VALUES (NOW(), $1, 'CONFIRMADO', $2)
       RETURNING id`,
      [total, user.id],
    )
    const orderId = orderResult.rows[0]!.id

    for (const line of orderLines) {
      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio)
         VALUES ($1, $2, $3, $4)`,
        [orderId, line.product_id, line.quantity, line.price],
      )

      await client.query(
        `UPDATE producto SET stock = stock - $1 WHERE id = $2`,
        [line.quantity, line.product_id],
      )
    }

    await client.query(
      `INSERT INTO pago (pedido_id, mp_payment_id, status, idempotency_key, mp_amount, payer_email)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, mpPaymentId, mpStatus, idempotencyKey, total, data.payer.email],
    )

    await client.query('COMMIT')
    client.release()

    return c.json({ pedido_id: orderId, mp_payment_id: mpPaymentId }, 201)
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    client.release()
    console.error('[process_order] unexpected error:', err)
    return c.json({ error: 'internal_server_error' }, 500)
  }
})
