import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ProductCard from '../components/ProductCard'
import Hero from '../components/Hero'
import Footer from '../components/Footer'
import { getCategories, getProducts, } from '../services/graphql'
import type { Product } from '../types/product'
import type { Category } from '../types/category'
import './Home.css'

type HomeProps = {
  onProductSelect: (product: Product) => void
  onCategorySelect: (category: Category) => void
}

function Home({
  onProductSelect,
  onCategorySelect,
}: HomeProps) {
  const [categories, setCategories] =
    useState<Category[]>([])

  const [products, setProducts] =
    useState<Product[]>([])

  const [nextCursor, setNextCursor] =
    useState<string | null>(null)

  const [hasMore, setHasMore] =
    useState(true)

  const [isLoadingMore, setIsLoadingMore] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const handleRetry = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al cargar los datos.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (
      isLoadingMore ||
      !hasMore
    ) {
      return
    }

    setIsLoadingMore(true)

    try {
      const data = await getProducts(
        6,
        nextCursor,
      )

      setProducts((currentProducts) => [
        ...currentProducts,
        ...data.productos,
      ])

      setNextCursor(
        data.siguienteCursor,
      )

      setHasMore(data.hayMas)
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [categoriesData, productsData] =
          await Promise.all([
            getCategories(),
            getProducts(6),
          ])

        setCategories(categoriesData)
        setProducts(productsData.productos)
        setNextCursor(
          productsData.siguienteCursor,
        )
        setHasMore(productsData.hayMas)

        setError(null)
        setIsLoading(false)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al cargar los datos.',
        )

        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  return (
    <main>
      <Hero />

      {isLoading && (
        <section className="home__loading">
          <div className="home__loading-header">
            <div className="skeleton skeleton--title" />
          </div>

          <div className="home__products">
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
        </section>
      )}

      {error && (
        <section>
          <h2>Error al cargar el catálogo</h2>

          <p>{error}</p>

          <button onClick={handleRetry}>
            Reintentar
          </button>
        </section>
      )}

      {!isLoading && !error && (
        <>
          <div className="home__catalog">
            <Sidebar
              categories={categories}
              onCategorySelect={onCategorySelect}
            />

            <section className="home__main">
              <h2 style={{color:'#0062ff'}}>Productos</h2>

              {products.length === 0 ? (
                <p>
                  No hay productos disponibles.
                </p>
              ) : (
                <>
                  <div className="home__products">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={onProductSelect}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="home__load-more">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore
                          ? 'CARGANDO...'
                          : 'CARGAR MÁS'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          <section style={{marginLeft:'10px'}} >
            <h2 style={{color:'#F47F26'}}>Context</h2>
            <p style={{color:'#fdfdfd'}}>
              Explora las diferentes categorías y
              selecciona un producto para consultar
              sus detalles.
            </p>
          </section>
        </>
      )}
      <Footer />
    </main>
  )
}

export default Home