import type { Product } from './product'

export type Category = {
  id: number
  name: string
  products: Product[]
}