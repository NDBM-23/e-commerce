import { useState } from 'react'
import { API_URL } from '../config'
import { useAuthStore } from '../store/authStore'
import '../styles/Auth.css'

interface Props {
  redirect?: string
}

export default function LoginForm({ redirect = '/' }: Props) {
  const setUser = useAuthStore((s) => s.setUser)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password}),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        setLoading(false)
        return
      }
      setUser(data)
if(res.ok){
if(data.rol=== 'ADMIN'){
  window.location.href = '/admin/dashboard';
}
else{
window.location.href = redirect
}
}
    } catch {
      setError('No se pudo conectar al servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <p className="auth-page__eyebrow">BIENVENIDO</p>
      <h2>Iniciar sesión</h2>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div className="auth-form__field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error && <div className="auth-form__error">{error}</div>}

        <button className="auth-form__submit" type="submit" disabled={loading}>
          {loading ? 'INICIANDO...' : 'INICIAR SESIÓN'}
        </button>
      </form>

      <p className="auth-page__alt">
        ¿No tienes cuenta?{' '}
        <a href="/register">Regístrate aquí</a>
      </p>
    </main>
  )
}
