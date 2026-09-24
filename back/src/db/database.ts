import { Pool } from 'pg'

export const db = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'p26_app',
    password: 'P26_Ecommerce_2026',
    database: 'p26_ecommerce',
    max: 10,
})
