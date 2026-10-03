import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { db } from '../db/database'

const COOKIE_NAME = 'sid'
const SESSION_TTL_DAYS = 7

export interface SessionUser {
  id: number
  nombre: string
  email: string
}

export async function createSession(c: Context, user: SessionUser): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)

  const result = await db.query<{ id: string }>(
    'INSERT INTO sesion (usuario_id, expires_at) VALUES ($1, $2) RETURNING id',
    [user.id, expiresAt],
  )

  const sessionId = result.rows[0].id

  setCookie(c, COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
    path: '/',
    expires: expiresAt,
  })
}

export async function getSession(c: Context): Promise<SessionUser | null> {
  const sessionId = getCookie(c, COOKIE_NAME)
  if (!sessionId) return null

  const result = await db.query<SessionUser & { expires_at: Date }>(
    `SELECT u.id, u.nombre, u.email, s.expires_at
     FROM sesion s
     JOIN usuario u ON u.id = s.usuario_id
     WHERE s.id = $1`,
    [sessionId],
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]

  if (new Date(row.expires_at) < new Date()) {
    await db.query('DELETE FROM sesion WHERE id = $1', [sessionId])
    return null
  }

  return { id: row.id, nombre: row.nombre, email: row.email }
}

export async function destroySession(c: Context): Promise<void> {
  const sessionId = getCookie(c, COOKIE_NAME)
  if (sessionId) {
    await db.query('DELETE FROM sesion WHERE id = $1', [sessionId])
  }
  deleteCookie(c, COOKIE_NAME, { path: '/' })
}
