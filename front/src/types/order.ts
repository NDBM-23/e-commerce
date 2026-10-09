import type { Product } from "./product"

export type Order = {
    id: number
    date: string
    total: number
    products: Product[]
}
