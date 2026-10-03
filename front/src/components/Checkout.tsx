import { useState, useTransition } from 'react'
import { useCartStore } from '../store/cartStore'
import { createOrder } from '../services/graphql'
import '../styles/Checkout.css'

export default function Checkout() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    const input = {
      usuario_id: 1,
      detalles: items.map((item) => ({
        producto_id: item.id,
        cantidad: item.quantity,
      })),
    }

    try {
      const order = await createOrder(input)

      clearCart()

      startTransition(() => {
        setOrderId(order.id)
        setIsSuccess(true)
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No se pudo crear el pedido.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <main className="checkout-page">
        <section className="checkout-success">
          <p className="checkout-success__eyebrow">
            PEDIDO CONFIRMADO
          </p>

          <h2>¡Gracias por tu compra!</h2>

          <p className="checkout-success__text">
            Tu pedido fue creado correctamente.
          </p>

          <div className="checkout-success__order">
            <span>Número de pedido</span>
            <strong>#{orderId}</strong>
          </div>

          <a
            href="/"
            className="checkout-success__button"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            VOLVER AL INICIO
          </a>

          {isPending && <p>Preparando...</p>}
        </section>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <p className="checkout-page__eyebrow">CHECKOUT</p>

          <h2>No hay productos.</h2>

          <p>Agrega productos al carrito antes de continuar.</p>

          <a
            href="/cart"
            className="checkout__back-button"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            VOLVER AL CARRITO
          </a>
        </section>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <header className="checkout-page__header">
        <a href="/cart" className="checkout-page__back">
          ← Volver al carrito
        </a>

        <p className="checkout-page__eyebrow">FINALIZAR COMPRA</p>

        <h2>Checkout</h2>
      </header>

      <div className="checkout-page__layout">
        <section className="checkout-form-section">
          <p className="checkout-section__eyebrow">INFORMACIÓN</p>

          <h3>Datos del cliente</h3>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-form__field">
              <label htmlFor="name">Nombre</label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="checkout-form__field">
              <label htmlFor="email">Correo electrónico</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            {submitError && (
              <div className="checkout-form__error">
                <strong>No se pudo crear el pedido</strong>
                <p>{submitError}</p>
              </div>
            )}

            <button
              className="checkout-form__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'CREANDO PEDIDO...' : 'CONFIRMAR PEDIDO'}
            </button>
          </form>
        </section>

        <aside className="checkout-summary">
          <p className="checkout-section__eyebrow">RESUMEN</p>

          <h3>Tu pedido</h3>

          <div className="checkout-summary__items">
            {items.map((item) => (
              <article className="checkout-summary__item" key={item.id}>
                <div>
                  <p>{item.name}</p>
                  <span>Cantidad: {item.quantity}</span>
                </div>

                <strong>
                  ${(item.price * item.quantity).toFixed(2)}
                </strong>
              </article>
            ))}
          </div>

          <div className="checkout-summary__total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </aside>
      </div>
    </main>
  )
}