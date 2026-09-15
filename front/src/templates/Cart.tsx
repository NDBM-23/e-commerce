import { useCartStore } from '../store/cartStore'
import './Cart.css'

type CartProps = {
  onBack: () => void
  onCheckout: () => void
}

function Cart({
  onBack,
  onCheckout,
}: CartProps) {
  const items = useCartStore((state) => state.items)

  const removeFromCart = useCartStore(
    (state) => state.removeFromCart,
  )

  const updateQuantity = useCartStore(
    (state) => state.updateQuantity,
  )

  const clearCart = useCartStore(
    (state) => state.clearCart,
  )

  const total = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0,
  )

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <button
          className="cart-page__back"
          onClick={onBack}
        >
          ← Seguir comprando
        </button>

        <p className="cart-page__eyebrow">
          TU COMPRA
        </p>

        <h2>Carrito</h2>

        <p className="cart-page__count">
          {items.length}{' '}
          {items.length === 1
            ? 'producto'
            : 'productos'}
        </p>
      </header>

      {items.length === 0 ? (
        <section className="cart-page__empty">
          <h3>Tu carrito está vacío.</h3>

          <p>
            Explora nuestro catálogo y agrega
            algunos productos.
          </p>

          <button
            className="cart-page__continue"
            onClick={onBack}
          >
            EXPLORAR PRODUCTOS
          </button>
        </section>
      ) : (
        <div className="cart-page__layout">
          <section className="cart-page__items">
            {items.map((item) => (
              <article
                className="cart-item"
                key={item.id}
              >
                <div className="cart-item__image-wrapper">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item__image"
                  />
                </div>

                <div className="cart-item__content">
                  <div className="cart-item__top">
                    <div>
                      <h3>{item.name}</h3>

                      <p className="cart-item__price">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    <button
                      className="cart-item__remove"
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                    >
                      ELIMINAR
                    </button>
                  </div>

                  <div className="cart-item__bottom">
                    <label>
                      <span>Cantidad</span>

                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(event) =>
                          updateQuantity(
                            item.id,
                            Number(
                              event.target.value,
                            ),
                          )
                        }
                      />
                    </label>

                    <p>
                      Subtotal:{' '}
                      <strong>
                        $
                        {(
                          item.price *
                          item.quantity
                        ).toFixed(2)}
                      </strong>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="cart-page__summary">
            <p className="cart-page__summary-eyebrow">
              RESUMEN
            </p>

            <div className="cart-page__summary-row">
              <span>Productos</span>

              <span>
                {items.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0,
                )}
              </span>
            </div>

            <div className="cart-page__summary-row cart-page__summary-total">
              <span>Total</span>

              <strong>
                ${total.toFixed(2)}
              </strong>
            </div>

            <button
              className="cart-page__checkout"
              onClick={onCheckout}
            >
              CONTINUAR AL CHECKOUT
            </button>

            <button
              className="cart-page__clear"
              onClick={clearCart}
            >
              VACIAR CARRITO
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}

export default Cart