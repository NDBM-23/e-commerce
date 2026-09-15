import { useEffect, useState } from 'react'
import { useCartStore } from '../store/cartStore'
import { getProductById } from '../services/graphql'
import type { Product } from '../types/product'
import './ProductDetail.css'

type ProductDetailProps = {
  productId: number
  onBack: () => void
  onCartClick: () => void
}

function ProductDetail({
  productId,
  onBack,
  onCartClick,
}: ProductDetailProps) {
  const [product, setProduct] =
    useState<Product | null>(null)

  const [quantity, setQuantity] =
    useState(1)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const addToCart = useCartStore(
    (state) => state.addToCart,
  )

  const currentCartQuantity = useCartStore(
    (state) => {
      const item = state.items.find(
        (item) => item.id === productId,
      )

      return item?.quantity ?? 0
    },
  )

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data =
          await getProductById(productId)

        if (!data) {
          setError(
            'El producto no existe.',
          )
          setIsLoading(false)
          return
        }

        setProduct(data)
        setError(null)
        setIsLoading(false)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al cargar el producto.',
        )

        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  if (isLoading) {
    return (
      <main className="product-detail">
        <div className="product-detail__loading">
          <div className="product-detail__loading-image skeleton" />

          <div className="product-detail__loading-info">
            <div className="skeleton skeleton--eyebrow" />

            <div className="skeleton skeleton--product-title" />

            <div className="skeleton skeleton--product-price" />

            <div className="product-detail__loading-stock">
              <div className="skeleton skeleton--stock" />
              <div className="skeleton skeleton--stock" />
              <div className="skeleton skeleton--stock" />
            </div>

            <div className="skeleton skeleton--quantity" />

            <div className="skeleton skeleton--button" />
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <button onClick={onBack}>
          Volver
        </button>

        <h2>Error</h2>

        <p>{error}</p>
      </main>
    )
  }

  if (!product) {
    return null
  }

  const availableToAdd =
    product.stock - currentCartQuantity

  const handleQuantityChange = (
    value: number,
  ) => {
    const newQuantity = Math.min(
      Math.max(value, 1),
      Math.max(availableToAdd, 1),
    )

    setQuantity(newQuantity)
  }

  const handleAddToCart = () => {
    if (availableToAdd <= 0) {
      return
    }

    addToCart({
      ...product,
      quantity,
    })

    onCartClick()
  }

  return (
    <main className="product-detail">
      <button
        className="product-detail__back"
        onClick={onBack}
      >
        ← Volver
      </button>

      <section className="product-detail__content">
        <div className="product-detail__image-wrapper">
          <img
            src={product.image}
            alt={product.name}
            className="product-detail__image"
          />
        </div>

        <div className="product-detail__info">
          <p className="product-detail__eyebrow">
            PRODUCTO
          </p>

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
                onChange={(event) =>
                  handleQuantityChange(
                    Number(event.target.value),
                  )
                }
              />
            </label>
          )}

          {availableToAdd <= 0 && (
            <p className="product-detail__unavailable">
              Ya tienes todo el stock disponible
              en el carrito.
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

export default ProductDetail
