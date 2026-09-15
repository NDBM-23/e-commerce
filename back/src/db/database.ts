import mysql from 'mysql2/promise'

export const db = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'p26_app',
    password: 'P26_Ecommerce_2026',
    database: 'p26_ecommerce',
    waitForConnections: true,
    connectionLimit: 10,
})