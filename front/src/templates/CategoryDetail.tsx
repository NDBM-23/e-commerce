import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { getCategoryById } from '../services/graphql'
import type { Category } from '../types/category'
import type { Product } from '../types/product'
import './CategoryDetail.css'

type CategoryDetailProps = {
  categoryId: number
  onProductSelect: (product: Product) => void
  onBack: () => void
}

function CategoryDetail({
  categoryId,
  onProductSelect,
  onBack,
}: CategoryDetailProps) {
  const [category, setCategory] =
    useState<Category | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const data =
          await getCategoryById(categoryId)

        if (!data) {
          setError(
            'La categoría no existe.',
          )
          setIsLoading(false)
          return
        }

        setCategory(data)
        setError(null)
        setIsLoading(false)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al cargar la categoría.',
        )

        setIsLoading(false)
      }
    }

    loadCategory()
  }, [categoryId])

  if (isLoading) {
    return (
      <main className="category-detail">
        <div className="category-detail__loading">
          <div className="category-detail__loading-header">
            <div className="skeleton skeleton--category-title" />

            <div className="skeleton skeleton--category-count" />
          </div>

          <div className="category-detail__products">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <article
                  className="skeleton-card"
                  key={index}
                >
                  <div className="skeleton skeleton-card__image" />

                  <div className="skeleton-card__info">
                    <div className="skeleton skeleton-card__name" />

                    <div className="skeleton skeleton-card__price" />
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <button onClick={onBack}>
          Volver al inicio
        </button>

        <h2>Error</h2>

        <p>{error}</p>
      </main>
    )
  }

  if (!category) {
    return null
  }

  return (
    <main className="category-detail">
      <div className="category-detail__header">
        <button
          className="category-detail__back"
          onClick={onBack}
        >
          ← Volver
        </button>

        <p className="category-detail__eyebrow">
          CATEGORÍA
        </p>

        <h2>{category.name}</h2>

        <p className="category-detail__count">
          {category.products.length}{' '}
          {category.products.length === 1
            ? 'producto'
            : 'productos'}
        </p>
      </div>

      {category.products.length === 0 ? (
        <section className="category-detail__empty">
          <p>
            No hay productos en esta categoría.
          </p>
        </section>
      ) : (
        <div className="category-detail__products">
          {category.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onProductSelect}
            />
          ))}
        </div>
      )}
    </main>
  )
}

export default CategoryDetail

