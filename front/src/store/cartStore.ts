import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: number
  name: string
  price: number
  image: string
  stock: number
  quantity: number
}

type CartStore = {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addToCart: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (cartItem) => cartItem.id === item.id,
          )

          if (existingItem) {
            const newQuantity =
              existingItem.quantity + item.quantity

            return {
              items: state.items.map((cartItem) =>
                cartItem.id === item.id
                  ? {
                    ...cartItem,
                    quantity: Math.min(
                      newQuantity,
                      cartItem.stock,
                    ),
                  }
                  : cartItem,
              ),
            }
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: Math.min(
                  item.quantity,
                  item.stock,
                ),
              },
            ],
          }
        }),

      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.id !== id,
          ),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                ...item,
                quantity: Math.min(
                  Math.max(quantity, 1),
                  item.stock,
                ),
              }
              : item,
          ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'p26-cart',
    },
  ),
)