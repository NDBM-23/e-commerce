import { useCartStore } from '../store/cartStore'
import './TopBar.css'

type TopBarProps = {
  onCartClick: () => void
  onHomeClick: () => void
}

function TopBar({
  onCartClick,
  onHomeClick,
}: TopBarProps) {
  const items = useCartStore(
    (state) => state.items,
  )

  const cartItems = items.reduce(
    (total, item) =>
      total + item.quantity,
    0,
  )

  return (
    <header className="topbar">
      <div className="topbar__content">
        <button
          className="topbar__logo"
          onClick={onHomeClick}
        >
          MI E-COMMERCE
        </button>

        <nav className="topbar__nav">
          <button>
            TIENDA
          </button>

          <button>
            CATEGORÍAS
          </button>
        </nav>

        <button
          className="topbar__cart"
          onClick={onCartClick}
        >
          CARRITO
          <span>
            ({cartItems})
          </span>
        </button>
      </div>
    </header>
  )
}

export default TopBar