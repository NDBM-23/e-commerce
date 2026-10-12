import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/database'

export const productosRouter = new Hono()

const productoSchema = z.object({
  nombre: z.string().min(1),
  precio: z.number().positive(),
  stock: z.number().int().nonnegative(),
  imagen: z.string().url().optional().or(z.literal('')),
  categoria_id: z.number().int().optional(),
})

productosRouter.get('/', async (c) => {
  try {
    const result = await db.query('SELECT id, nombre, precio, imagen, stock, categoria_id FROM producto ORDER BY id ASC')
    return c.json(result.rows)
  } catch (error) {
    return c.json({ error: 'error_fetching_products' }, 500)
  }
})

productosRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = productoSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  }

  const { nombre, precio, stock, imagen, categoria_id } = parsed.data

  try {
    const result = await db.query(
      `INSERT INTO producto (nombre, precio, stock, imagen, categoria_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, precio, imagen, stock, categoria_id`,
      [nombre, precio, stock, imagen || null, categoria_id || 1]
    )
    return c.json(result.rows[0], 201)
  } catch (error) {
    return c.json({ error: 'error_creating_product' }, 500)
  }
})

productosRouter.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = productoSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  }

  const { nombre, precio, stock, imagen, categoria_id } = parsed.data

  try {
    const result = await db.query(
      `UPDATE producto 
       SET nombre = $1, precio = $2, stock = $3, imagen = $4, categoria_id = $5
       WHERE id = $6
       RETURNING id, nombre, precio, imagen, stock, categoria_id`,
      [nombre, precio, stock, imagen || null, categoria_id || 1, id]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'product_not_found' }, 404)
    }

    return c.json(result.rows[0])
  } catch (error) {
    return c.json({ error: 'error_updating_product' }, 500)
  }
})

productosRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const result = await db.query('DELETE FROM producto WHERE id = $1 RETURNING id', [id])
    if (result.rows.length === 0) {
      return c.json({ error: 'product_not_found' }, 404)
    }
    return c.json({ ok: true })
  } catch (error) {
    return c.json({ error: 'error_deleting_product' }, 500)
  }
})