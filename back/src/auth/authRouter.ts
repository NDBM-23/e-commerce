import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '../db/database'
import { createSession, getSession, destroySession } from './session'

export const authRouter = new Hono()

const registerSchema = z.object({
  nombre: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

// POST /auth/register
authRouter.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Datos inválidos' }, 400)
  }

  const { nombre, email, password } = parsed.data

  const existing = await db.query('SELECT id FROM usuario WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    return c.json({ error: 'El correo ya está registrado' }, 409)
  }

  const password_hash = await bcrypt.hash(password, 10)

  const result = await db.query<{ id: number; nombre: string; email: string }>(
    `INSERT INTO usuario (nombre, email, rol, password_hash)
     VALUES ($1, $2, 'USER', $3)
     RETURNING id, nombre, email`,
    [nombre, email, password_hash],
  )

  const user = result.rows[0]
  await createSession(c, user)
  return c.json(user, 201)
})

// POST /auth/login
authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Datos inválidos' }, 400)
  }

  const { email, password } = parsed.data

  const result = await db.query<{
    id: number
    nombre: string
    email: string
    password_hash: string | null
  }>('SELECT id, nombre, email, password_hash FROM usuario WHERE email = $1', [email])

  if (result.rows.length === 0) {
    return c.json({ error: 'Credenciales incorrectas' }, 401)
  }

  const row = result.rows[0]

  if (!row.password_hash) {
    return c.json({ error: 'Credenciales incorrectas' }, 401)
  }

  const valid = await bcrypt.compare(password, row.password_hash)
  if (!valid) {
    return c.json({ error: 'Credenciales incorrectas' }, 401)
  }

  const user = { id: row.id, nombre: row.nombre, email: row.email }
  await createSession(c, user)
  return c.json(user)
})

// POST /auth/logout
authRouter.post('/logout', async (c) => {
  await destroySession(c)
  return c.json({ ok: true })
})

// GET /auth/me
authRouter.get('/me', async (c) => {
  const user = await getSession(c)
  if (!user) {
    return c.json({ error: 'No autenticado' }, 401)
  }
  return c.json(user)
})
