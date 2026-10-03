import { useState } from 'react'
import { useCartStore } from '../store/cartStore'
import type { Product } from '../types/product'
import '../styles/ProductDetail.css'

type ProductDetailProps = {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const addToCart = useCartStore((state) => state.addToCart)

  const currentCartQuantity = useCartStore((state) => {
    const item = state.items.find((item) => item.id === product.id)
    return item?.quantity ?? 0
  })

  const availableToAdd = product.stock - currentCartQuantity

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.min(
      Math.max(value, 1),
      Math.max(availableToAdd, 1),
    )
    setQuantity(newQuantity)
  }

  const handleAddToCart = () => {
    if (availableToAdd <= 0) return

    addToCart({
      ...product,
      quantity,
    })

    window.location.href = '/cart'
  }

  return (
    <main className="product-detail">
      <a href="/" className="product-detail__back">
        ← Volver
      </a>

      <section className="product-detail__content">
        <div className="product-detail__image-wrapper">
          <img
            src={product.image}
            alt={product.name}
            className="product-detail__image"
          />
        </div>

        <div className="product-detail__info">
          <p className="product-detail__eyebrow">PRODUCTO</p>

          <h2>{product.name}</h2>

          <p className="product-detail__price">
            ${product.price.toFixed(2)}
          </p>

          <div className="product-detail__stock">
            <span>Stock total</span>
            <strong>{product.stock}</strong>
          </div>

          <div className="product-detail__stock">
            <span>En carrito</span>
            <strong>{currentCartQuantity}</strong>
          </div>

          <div className="product-detail__stock">
            <span>Disponible</span>
            <strong>{availableToAdd}</strong>
          </div>

          {availableToAdd > 0 && (
            <label className="product-detail__quantity">
              <span>Cantidad</span>
              <input
                type="number"
                min="1"
                max={availableToAdd}
                value={quantity}
                onChange={(e) =>
                  handleQuantityChange(Number(e.target.value))
                }
              />
            </label>
          )}

          {availableToAdd <= 0 && (
            <p className="product-detail__unavailable">
              Ya tienes todo el stock disponible en el carrito.
            </p>
          )}

          <button
            className="product-detail__add"
            onClick={handleAddToCart}
            disabled={availableToAdd <= 0}
          >
            {availableToAdd > 0
              ? 'AGREGAR AL CARRITO'
              : 'SIN STOCK DISPONIBLE'}
          </button>
        </div>
      </section>
    </main>
  )
}