import { useState } from 'react';
import type { Product } from '../types/product';
import { getProducts } from '../services/graphql';

interface Props {
  initialCursor: string | null;
  initialHasMore: boolean;
}

export default function LoadMoreButton({ initialCursor, initialHasMore }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const data = await getProducts(6, nextCursor);

      if (data && data.productos) {
        setProducts((prev) => [...prev, ...data.productos]);
        setNextCursor(data.siguienteCursor);
        setHasMore(data.hayMas);
      }
    } catch (error) {
      console.error('Error al cargar más productos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {products.map((product) => {
        const isOutOfStock = product.stock === 0;

        return (
          <article className="product-card" key={product.id}>
            <a 
              href={isOutOfStock ? '#' : `/product/${product.id}`} 
              className="product-card__image-button"
            >
              <div className="product-card__image-wrapper">
                <img src={product.image} alt={product.name} className="product-card__image" />
                {isOutOfStock && <span className="product-card__sold-out">AGOTADO</span>}
              </div>
            </a>

            <div className="product-card__info">
              <div>
                <h3>{product.name}</h3>
                <p>${product.price.toFixed(2)}</p>
              </div>

              <a
                href={isOutOfStock ? '#' : `/product/${product.id}`}
                className="product-card__button"
                style={isOutOfStock ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                {isOutOfStock ? 'Agotado' : 'Ver producto'}
              </a>
            </div>
          </article>
        );
      })}
      {hasMore && (
        <div className="home__load-more" style={{ gridColumn: '1 / -1', textAlign: 'center', width: '100%', margin: '20px 0' }}>
          <button 
            onClick={handleLoadMore} 
            disabled={isLoading}
            style={{ cursor: 'pointer', padding: '10px 20px' }}
          >
            {isLoading ? 'CARGANDO...' : 'CARGAR MÁS'}
          </button>
        </div>
      )}
    </>
  );
}