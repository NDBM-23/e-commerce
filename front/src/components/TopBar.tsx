import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { API_URL } from '../config'
import './TopBar.css'

export default function TopBar() {
  const items = useCartStore((state) => state.items)
  const user = useAuthStore((state) => state.user)
  const clearUser = useAuthStore((state) => state.clearUser)

  const cartItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    clearUser()
    window.location.href = '/'
  }

  return (
    <header className="topbar">
      <div className="topbar__content">
        <a href="/" className="topbar__logo">
          Ceti-Verso
        </a>

        <nav className="topbar__nav">
          <img src="https://i.pinimg.com/originals/ca/59/c7/ca59c7300ea299fc9f429da8e7924e5c.gif" style={{ width: '100%', maxWidth: '100px' }} />
          <img src="https://i.pinimg.com/originals/9d/d1/a0/9dd1a0c90caa865e3718947e2b91d35e.gif" style={{ width: '100%', maxWidth: '100px' }} />
          <img src="https://i.pinimg.com/originals/18/c7/60/18c76007a39d80d2329023124cd45c9a.gif" style={{ height: '99px', maxHeight: '100%', width: '100%', maxWidth: '100px' }} />
          <img src="https://i.pinimg.com/originals/e6/10/9e/e6109e32a9ac1a8f2496d7fba78e9c84.gif" style={{ width: '100%', maxWidth: '100px' }} />
          <img src="https://media.tenor.com/uUNcnHwYJQEAAAAj/running-pikachu-transparent-snivee.gif" style={{ width: '100%', maxWidth: '100px' }} />
        </nav>

        <div className="topbar__actions">
          {user ? (
            <>
              <span className="topbar__user">Hola, {user.nombre}</span>
              <button className="topbar__logout" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <a href="/login" className="topbar__login">
              Iniciar sesión
            </a>
          )}
          <a href="/cart" className="topbar__cart">
            CARRITO
            <span>({cartItems})</span>
          </a>
        </div>
      </div>
    </header>
  )
}