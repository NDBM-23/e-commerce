import { useState } from 'react'
import { API_URL } from '../config'
import { useAuthStore } from '../store/authStore'
import '../styles/Auth.css'

export default function RegisterForm() {
  const setUser = useAuthStore((s) => s.setUser)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpassword, setcPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (password == cpassword) {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ nombre, email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Error al registrarse')
          return
        }

        setUser(data)
        window.location.href = '/'
      } catch {
        setError('No se pudo conectar al servidor')
      } finally {
        setLoading(false)
      }
    }
    else {
      alert("No coinciden las contraseñas")
    }

  }

  return (
    <main className="auth-page">
      <p className="auth-page__eyebrow">CREAR CUENTA</p>
      <h2>Regístrate</h2>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__field">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            required
          />
        </div>

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
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
        </div>
        <div className="auth-form__field">
          <label htmlFor="passwordconfirm">Confirmar contraseña</label>
          <input
            id="passwordconfirm"
            type="password"
            value={cpassword}
            onChange={(e) => setcPassword(e.target.value)}
            placeholder="Confirmar"
            minLength={6}
            required
          />
        </div>

        {error && <div className="auth-form__error">{error}</div>}

        <button className="auth-form__submit" type="submit" disabled={loading}>
          {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
        </button>
      </form>

      <p className="auth-page__alt">
        ¿Ya tienes cuenta?{' '}
        <a href="/login">Inicia sesión aquí</a>
      </p>
    </main>
  )
}
