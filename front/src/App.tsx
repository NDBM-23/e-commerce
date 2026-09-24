import { useState } from 'react'
import TopBar from './components/TopBar'
import Home from './templates/Home'
import CategoryDetail from './templates/CategoryDetail'
import ProductDetail from './templates/ProductDetail'
import Cart from './templates/Cart'
import Checkout from './templates/Checkout'
import type { Category } from './types/category'
import type { Product } from './types/product'
import type { View } from './types/view'

function App() {
  const [view, setView] = useState<View>('home')
  const [selectedProductId, setSelectedProductId] =
    useState<number | null>(null)

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<number | null>(null)

  const handleCartClick = () => {
    setView('cart')
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProductId(product.id)
    setView('product')
  }

  const handleCategorySelect = (category: Category) => {
    setSelectedCategoryId(category.id)
    setView('category')
  }

  return (
    <div>
      <TopBar
        onCartClick={handleCartClick}
        onHomeClick={() => setView('home')}
      />

      {view === 'home' && (
        <Home
          onProductSelect={handleProductSelect}
          onCategorySelect={handleCategorySelect}
        />
      )}

      {view === 'category' &&
        selectedCategoryId !== null && (
          <CategoryDetail
            categoryId={selectedCategoryId}
            onProductSelect={handleProductSelect}
            onBack={() => setView('home')}
          />
        )}

      {view === 'product' &&
        selectedProductId !== null && (
          <ProductDetail
            productId={selectedProductId}
            onBack={() => setView('home')}
            onCartClick={() => setView('cart')}
          />
        )}

      {view === 'cart' && (
        <Cart
          onBack={() => setView('home')}
          onCheckout={() => setView('checkout')}
        />
      )}

      {view === 'checkout' && (
        <Checkout
          onBack={() => setView('cart')}
          onOrderCreated={() => setView('home')}
        />
      )}
    </div>
  )
}

export default App
