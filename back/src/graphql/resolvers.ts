import { db } from '../db/database'
import {
    createProductSchema,
    updateProductSchema,
    createOrderSchema,
} from '../validation/schemas'

export const resolvers = {
    Query: {
        categorias: async () => {
            const [rows] = await db.query(
                'SELECT id, nombre FROM categoria',
            )

            return rows
        },

        categoria: async (
            _: unknown,
            args: { id: string },
        ) => {
            const [rows] = await db.query(
                'SELECT id, nombre FROM categoria WHERE id = ?',
                [Number(args.id)],
            )

            const categorias = rows as {
                id: number
                nombre: string
            }[]

            return categorias[0] ?? null
        },

        productos: async (
            _: unknown,
            args: {
                limite: number
                cursor?: string | null
            },
        ) => {
            const limite = Math.min(
                Math.max(args.limite, 1),
                50,
            )

            const cursor = args.cursor
                ? Number(args.cursor)
                : 0

            if (!Number.isInteger(cursor) || cursor < 0) {
                throw new Error(
                    'El cursor debe ser un ID válido.',
                )
            }

            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    precio,
                    imagen,
                    stock,
                    categoria_id
                FROM producto
                WHERE id > ?
                ORDER BY id ASC
                LIMIT ?
                `,
                [cursor, limite + 1],
            )

            const productos = rows as {
                id: number
                nombre: string
                precio: number
                imagen: string
                stock: number
                categoria_id: number
            }[]

            const hayMas =
                productos.length > limite

            if (hayMas) {
                productos.pop()
            }

            const ultimoProducto =
                productos[productos.length - 1]

            const siguienteCursor =
                hayMas && ultimoProducto
                    ? String(ultimoProducto.id)
                    : null

            return {
                productos,
                siguienteCursor,
                hayMas,
            }
        },

        producto: async (
            _: unknown,
            args: { id: string },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    precio,
                    imagen,
                    stock,
                    categoria_id
                FROM producto
                WHERE id = ?
                `,
                [Number(args.id)],
            )

            const productos = rows as {
                id: number
                nombre: string
                precio: number
                imagen: string
                stock: number
                categoria_id: number
            }[]

            return productos[0] ?? null
        },

        pedidos: async () => {
            const [rows] = await db.query(`
                SELECT
                id,
                DATE_FORMAT(
                    fecha,
                    '%Y-%m-%d %H:%i:%s'
                ) AS fecha,
                total,
                status,
                usuario_id
            FROM pedido
                ORDER BY fecha DESC
            `)

            return rows
        },

        pedido: async (
            _: unknown,
            args: { id: string },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    DATE_FORMAT(
                        fecha,
                        '%Y-%m-%d %H:%i:%s'
                    ) AS fecha,
                    total,
                    status,
                    usuario_id
                FROM pedido
                WHERE id = ?
                `,
                [Number(args.id)],
            )

            const pedidos = rows as {
                id: number
                fecha: string
                total: number
                status: string
                usuario_id: number
            }[]

            return pedidos[0] ?? null
        },

        usuarios: async () => {
            const [rows] = await db.query(`
                SELECT
                    id,
                    nombre,
                    email,
                    rol
                FROM usuario
            `)

            return rows
        },

        usuario: async (
            _: unknown,
            args: { id: string },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    email,
                    rol
                FROM usuario
                WHERE id = ?
                `,
                [Number(args.id)],
            )

            const usuarios = rows as {
                id: number
                nombre: string
                email: string
                rol: string
            }[]

            return usuarios[0] ?? null
        },
    },

    Categoria: {
        productos: async (
            categoria: { id: number },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    precio,
                    imagen,
                    stock,
                    categoria_id
                FROM producto
                WHERE categoria_id = ?
                `,
                [categoria.id],
            )

            return rows
        },
    },

    Producto: {
        categoria: async (
            producto: { categoria_id: number },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre
                FROM categoria
                WHERE id = ?
                `,
                [producto.categoria_id],
            )

            const categorias = rows as {
                id: number
                nombre: string
            }[]

            return categorias[0] ?? null
        },
    },

    Usuario: {
        pedidos: async (
            usuario: { id: number },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    DATE_FORMAT(
                        fecha,
                        '%Y-%m-%d %H:%i:%s'
                    ) AS fecha,
                    total,
                    status,
                    usuario_id
                FROM pedido
                WHERE usuario_id = ?
                ORDER BY fecha DESC
                `,
                [usuario.id],
            )

            return rows
        },
    },

    Pedido: {
        usuario: async (
            pedido: { usuario_id: number },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    email,
                    rol
                FROM usuario
                WHERE id = ?
                `,
                [pedido.usuario_id],
            )

            const usuarios = rows as {
                id: number
                nombre: string
                email: string
                rol: string
            }[]

            return usuarios[0] ?? null
        },

        detalles: async (
            pedido: { id: number },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    pedido_id,
                    producto_id,
                    cantidad,
                    precio
                FROM detalle_pedido
                WHERE pedido_id = ?
                `,
                [pedido.id],
            )

            return rows
        },
    },

    DetallePedido: {
        pedido: async (
            detalle: { pedido_id: number },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    DATE_FORMAT(
                        fecha,
                        '%Y-%m-%d %H:%i:%s'
                    ) AS fecha,
                    total,
                    status,
                    usuario_id
                FROM pedido
                WHERE id = ?
                `,
                [detalle.pedido_id],
            )

            const pedidos = rows as {
                id: number
                fecha: string
                total: number
                status: string
                usuario_id: number
            }[]

            return pedidos[0] ?? null
        },

        producto: async (
            detalle: { producto_id: number },
        ) => {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    precio,
                    imagen,
                    stock,
                    categoria_id
                FROM producto
                WHERE id = ?
                `,
                [detalle.producto_id],
            )

            const productos = rows as {
                id: number
                nombre: string
                precio: number
                imagen: string
                stock: number
                categoria_id: number
            }[]

            return productos[0] ?? null
        },
    },

    Mutation: {
        crearProducto: async (
            _: unknown,
            args: {
                input: {
                    nombre: string
                    precio: number
                    imagen: string
                    stock: number
                    categoria_id: string
                }
            },
        ) => {
            const input = createProductSchema.parse({
                ...args.input,
                categoria_id: Number(
                    args.input.categoria_id,
                ),
            })

            const [categoriaRows] =
                await db.query(
                    'SELECT id FROM categoria WHERE id = ?',
                    [input.categoria_id],
                )

            const categorias = categoriaRows as {
                id: number
            }[]

            if (categorias.length === 0) {
                throw new Error(
                    'La categoría no existe',
                )
            }

            const [result] = await db.execute(
                `
                INSERT INTO producto
                    (
                        nombre,
                        precio,
                        imagen,
                        stock,
                        categoria_id
                    )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    input.nombre,
                    input.precio,
                    input.imagen,
                    input.stock,
                    input.categoria_id,
                ],
            )

            const insertResult = result as {
                insertId: number
            }

            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    precio,
                    imagen,
                    stock,
                    categoria_id
                FROM producto
                WHERE id = ?
                `,
                [insertResult.insertId],
            )

            const productos = rows as {
                id: number
                nombre: string
                precio: number
                imagen: string
                stock: number
                categoria_id: number
            }[]

            return productos[0]
        },

        actualizarProducto: async (
            _: unknown,
            args: {
                id: string
                input: {
                    nombre?: string
                    precio?: number
                    imagen?: string
                    stock?: number
                    categoria_id?: string
                }
            },
        ) => {
            const input = updateProductSchema.parse({
                ...args.input,
                ...(args.input.categoria_id !==
                    undefined && {
                    categoria_id: Number(
                        args.input.categoria_id,
                    ),
                }),
            })

            const id = Number(args.id)

            const [existingRows] =
                await db.query(
                    'SELECT id FROM producto WHERE id = ?',
                    [id],
                )

            const existingProducts =
                existingRows as { id: number }[]

            if (existingProducts.length === 0) {
                return null
            }

            if (
                input.categoria_id !==
                undefined
            ) {
                const [categoriaRows] =
                    await db.query(
                        'SELECT id FROM categoria WHERE id = ?',
                        [input.categoria_id],
                    )

                const categorias =
                    categoriaRows as {
                        id: number
                    }[]

                if (categorias.length === 0) {
                    throw new Error(
                        'La categoría no existe',
                    )
                }
            }

            const fields: string[] = []
            const values: (
                string | number
            )[] = []

            if (input.nombre !== undefined) {
                fields.push('nombre = ?')
                values.push(input.nombre)
            }

            if (input.precio !== undefined) {
                fields.push('precio = ?')
                values.push(input.precio)
            }

            if (input.imagen !== undefined) {
                fields.push('imagen = ?')
                values.push(input.imagen)
            }

            if (input.stock !== undefined) {
                fields.push('stock = ?')
                values.push(input.stock)
            }

            if (
                input.categoria_id !==
                undefined
            ) {
                fields.push(
                    'categoria_id = ?',
                )
                values.push(
                    input.categoria_id,
                )
            }

            if (fields.length > 0) {
                values.push(id)

                await db.execute(
                    `
                    UPDATE producto
                    SET ${fields.join(', ')}
                    WHERE id = ?
                    `,
                    values,
                )
            }

            const [rows] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    precio,
                    imagen,
                    stock,
                    categoria_id
                FROM producto
                WHERE id = ?
                `,
                [id],
            )

            const productos = rows as {
                id: number
                nombre: string
                precio: number
                imagen: string
                stock: number
                categoria_id: number
            }[]

            return productos[0] ?? null
        },

        eliminarProducto: async (
            _: unknown,
            args: { id: string },
        ) => {
            const [result] =
                await db.execute(
                    'DELETE FROM producto WHERE id = ?',
                    [Number(args.id)],
                )

            const deleteResult = result as {
                affectedRows: number
            }

            return deleteResult.affectedRows > 0
        },

        crearPedido: async (
            _: unknown,
            args: {
                input: {
                    usuario_id: string
                    detalles: {
                        producto_id: string
                        cantidad: number
                    }[]
                }
            },
        ) => {
            const input =
                createOrderSchema.parse(
                    args.input,
                )

            const connection =
                await db.getConnection()

            try {
                await connection.beginTransaction()

                const usuarioId = Number(
                    input.usuario_id,
                )

                const [
                    usuarioRows,
                ] = await connection.query(
                    `
                    SELECT id
                    FROM usuario
                    WHERE id = ?
                    `,
                    [usuarioId],
                )

                const usuarios =
                    usuarioRows as {
                        id: number
                    }[]

                if (usuarios.length === 0) {
                    throw new Error(
                        'El usuario no existe',
                    )
                }

                let total = 0

                const detallesConPrecio: {
                    producto_id: number
                    cantidad: number
                    precio: number
                }[] = []

                for (const detalle of input.detalles) {
                    const productoId =
                        Number(
                            detalle.producto_id,
                        )

                    const [
                        productoRows,
                    ] =
                        await connection.query(
                            `
                            SELECT
                                id,
                                nombre,
                                precio,
                                stock
                            FROM producto
                            WHERE id = ?
                            FOR UPDATE
                            `,
                            [productoId],
                        )

                    const productos =
                        productoRows as {
                            id: number
                            nombre: string
                            precio: number
                            stock: number
                        }[]

                    const producto =
                        productos[0]

                    if (!producto) {
                        throw new Error(
                            `El producto ${productoId} no existe`,
                        )
                    }

                    if (
                        detalle.cantidad >
                        producto.stock
                    ) {
                        throw new Error(
                            `No hay suficiente stock de ${producto.nombre}`,
                        )
                    }

                    total +=
                        producto.precio *
                        detalle.cantidad

                    detallesConPrecio.push({
                        producto_id:
                            producto.id,
                        cantidad:
                            detalle.cantidad,
                        precio:
                            producto.precio,
                    })
                }

                const [
                    pedidoResult,
                ] =
                    await connection.execute(
                        `
                        INSERT INTO pedido
                            (
                                fecha,
                                total,
                                status,
                                usuario_id
                            )
                        VALUES
                            (
                                NOW(),
                                ?,
                                'CONFIRMADO',
                                ?
                            )
                        `,
                        [total, usuarioId],
                    )

                const pedidoInsert =
                    pedidoResult as {
                        insertId: number
                    }

                const pedidoId =
                    pedidoInsert.insertId

                for (
                    const detalle of
                    detallesConPrecio
                ) {
                    await connection.execute(
                        `
                        INSERT INTO detalle_pedido
                            (
                                pedido_id,
                                producto_id,
                                cantidad,
                                precio
                            )
                        VALUES (?, ?, ?, ?)
                        `,
                        [
                            pedidoId,
                            detalle.producto_id,
                            detalle.cantidad,
                            detalle.precio,
                        ],
                    )

                    await connection.execute(
                        `
                        UPDATE producto
                        SET stock = stock - ?
                        WHERE id = ?
                        `,
                        [
                            detalle.cantidad,
                            detalle.producto_id,
                        ],
                    )
                }

                await connection.commit()

                const [rows] =
                    await connection.query(
                        `
                        SELECT
                            id,
                            DATE_FORMAT(
                                fecha,
                                '%Y-%m-%d %H:%i:%s'
                            ) AS fecha,
                            total,
                            status,
                            usuario_id
                        FROM pedido
                    WHERE id = ?
                    `,
                        [pedidoId],
                    )

                const pedidos =
                    rows as {
                        id: number
                        fecha: Date
                        total: number
                        status: string
                        usuario_id: number
                    }[]

                return pedidos[0]
            } catch (error) {
                await connection.rollback()
                throw error
            } finally {
                connection.release()
            }
        },
    },
}