import { Hono } from 'hono'
import { MercadoPagoConfig, Order } from 'mercadopago'

import { db } from '../db/database'
import { getSession } from '../auth/session'
import { processOrderSchema } from '../validation/schemas'

export const apiRouter = new Hono()

// UUID v4 regex used to validate X-Idempotency-Key
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

apiRouter.post('/process_order', async (c) => {
  // ── 1. Authentication ────────────────────────────────────────────────────
  const user = await getSession(c)
  if (!user) {
    return c.json({ error: 'unauthorized' }, 401)
  }

  // ── 2. Idempotency key ───────────────────────────────────────────────────
  const idempotencyKey = c.req.header('X-Idempotency-Key')
  if (!idempotencyKey || !UUID_V4_RE.test(idempotencyKey)) {
    return c.json({ error: 'missing_or_invalid_idempotency_key' }, 400)
  }

  // ── 3. Request body validation ───────────────────────────────────────────
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
  return c.json(
    { error: 'idempotency_key_mismatch' },
    400,
  )
}

  // ── 4. Acquire a dedicated client and BEGIN transaction ──────────────────
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    // ── 5. Advisory lock (prevents double-click race) ──────────────────────
    // pg_try_advisory_xact_lock takes bigint; derive it from the UUID string
    const lockResult = await client.query<{ acquired: boolean }>(
      `SELECT pg_try_advisory_xact_lock(('x' || substr(md5($1), 1, 16))::bit(64)::bigint) AS acquired`,
      [idempotencyKey],
    )
    if (!lockResult.rows[0]?.acquired) {
      await client.query('ROLLBACK')
      client.release()
      return c.json({ error: 'duplicate_request' }, 409)
    }

    // ── 6. Idempotency replay check ────────────────────────────────────────
    const existingPago = await client.query<{ pedido_id: number }>(
      'SELECT pedido_id FROM pago WHERE idempotency_key = $1',
      [idempotencyKey],
    )
    if (existingPago.rows.length > 0) {
      await client.query('COMMIT')
      client.release()
      return c.json({ pedido_id: existingPago.rows[0]!.pedido_id }, 200)
    }

    // ── 7. Re-fetch prices from DB and lock stock rows ─────────────────────
    let total = 0

    const detallesConPrecio: {
      producto_id: number
      cantidad: number
      precio: number
    }[] = []

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
        return c.json({ error: 'producto_not_found', producto_id: item.producto_id }, 422)
      }

      const producto = rows[0]!

      if (item.cantidad > producto.stock) {
        await client.query('ROLLBACK')
        client.release()
        return c.json(
          { error: 'insufficient_stock', producto: producto.nombre },
          422,
        )
      }

      total += Number(producto.precio) * item.cantidad
      detallesConPrecio.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio: Number(producto.precio),
      })
    }

    // ── 8. Call Mercado Pago Orders API (lock is still held) ───────────────
    const mpConfig = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
    const orders = new Order(mpConfig)

    const payment = data.transactions.payments[0]!

    const mpResponse = await orders.create({
      requestOptions: {
        idempotencyKey,
      },
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

    // ── 9. Check payment status ────────────────────────────────────────────
    const mpPayment = mpResponse.transactions?.payments?.[0];

    const mpStatus =
      (mpPayment as any)?.status ??
      mpResponse.status ??
      'unknown';

    const mpStatusDetail =
      (mpPayment as any)?.status_detail ??
      (mpResponse as any)?.status_detail ??
      'unknown';

    const mpPaymentId = String(
      (mpPayment as any)?.id ?? ''
    );

    console.log('[MP] Resultado de la orden:', {
      orderStatus: mpResponse.status,
      paymentStatus: mpStatus,
      statusDetail: mpStatusDetail,
      paymentIdPresent: Boolean(mpPaymentId),
    });

    const paymentApproved =
      mpStatus === 'processed' &&
      mpStatusDetail === 'accredited';

    if (!paymentApproved) {
      await client.query('ROLLBACK');
      client.release();

      return c.json(
        {
          error: 'payment_not_approved',
          mp_status: mpStatus,
          mp_status_detail: mpStatusDetail,
        },
        402,
      );
    }

    // ── 10. Insert pedido ──────────────────────────────────────────────────
    const pedidoResult = await client.query<{ id: number }>(
      `INSERT INTO pedido (fecha, total, status, usuario_id)
       VALUES (NOW(), $1, 'CONFIRMADO', $2)
       RETURNING id`,
      [total, user.id],
    )
    const pedidoId = pedidoResult.rows[0]!.id

    // ── 11. Insert detalle_pedido + deduct stock ───────────────────────────
    for (const detalle of detallesConPrecio) {
      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio)
         VALUES ($1, $2, $3, $4)`,
        [pedidoId, detalle.producto_id, detalle.cantidad, detalle.precio],
      )

      await client.query(
        `UPDATE producto SET stock = stock - $1 WHERE id = $2`,
        [detalle.cantidad, detalle.producto_id],
      )
    }

    // ── 12. Insert pago row ────────────────────────────────────────────────
    await client.query(
      `INSERT INTO pago (pedido_id, mp_payment_id, status, idempotency_key, mp_amount, payer_email)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pedidoId, mpPaymentId, mpStatus, idempotencyKey, total, data.payer.email],
    )

    await client.query('COMMIT')
    client.release()

    return c.json({ pedido_id: pedidoId, mp_payment_id: mpPaymentId }, 201)
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { })
    client.release()
    if (err instanceof Error) {
      const mpError = err as Error & {
        status?: number
        error?: string
        causes?: unknown[]
      }
      console.dir(err, { depth: 10 })
      console.error('[MP] mensaje:', mpError.message)
      console.error('[MP] estado:', mpError.status)
      console.error('[MP] error:', mpError.error)
      console.error('[MP] causas:', JSON.stringify(mpError.causes))
      console.error('[MP] propiedades:', Object.keys(mpError))
    }
    return c.json({ error: 'internal_server_error' }, 500)
  }
})
