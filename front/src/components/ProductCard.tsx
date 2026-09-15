import type { Product } from '../types/product'
import './ProductCard.css'

type ProductCardProps = {
  product: Product
  onSelect: (product: Product) => void
}

function ProductCard({
  product,
  onSelect,
}: ProductCardProps) {
  const isOutOfStock = product.stock === 0

  return (
    <article className="product-card">
      <button
        className="product-card__image-button"
        onClick={() => onSelect(product)}
        disabled={isOutOfStock}
      >
        <div className="product-card__image-wrapper">
          <img
            src={product.image}
            alt={product.name}
            className="product-card__image"
          />

          {isOutOfStock && (
            <span className="product-card__sold-out">
              AGOTADO
            </span>
          )}
        </div>
      </button>

      <div className="product-card__info">
        <div>
          <h3>{product.name}</h3>

          <p>
            ${product.price.toFixed(2)}
          </p>
        </div>

        <button
          className="product-card__button"
          onClick={() => onSelect(product)}
          disabled={isOutOfStock}
        >
          {isOutOfStock
            ? 'Agotado'
            : 'Ver producto'}
        </button>
      </div>
    </article>
  )
}

export default ProductCard