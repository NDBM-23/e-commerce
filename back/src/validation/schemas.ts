import { z } from 'zod'

export const createProductSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio'),

  precio: z
    .number()
    .positive('El precio debe ser mayor que 0'),

  imagen: z
    .string()
    .min(1, 'La imagen es obligatoria'),

  stock: z
    .number()
    .int('El stock debe ser un entero')
    .nonnegative('El stock no puede ser negativo'),

  categoria_id: z
    .number()
    .int('El ID de categoría debe ser un entero')
    .positive('El ID de categoría debe ser válido'),
})

export const updateProductSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre no puede estar vacío')
    .optional(),

  precio: z
    .number()
    .positive('El precio debe ser mayor que 0')
    .optional(),

  imagen: z
    .string()
    .min(1, 'La imagen no puede estar vacía')
    .optional(),

  stock: z
    .number()
    .int('El stock debe ser un entero')
    .nonnegative('El stock no puede ser negativo')
    .optional(),

  categoria_id: z
    .number()
    .int('El ID de categoría debe ser un entero')
    .positive('El ID de categoría debe ser válido')
    .optional(),
})

const detallePedidoSchema = z.object({
  producto_id: z
    .coerce
    .number()
    .int('El ID del producto debe ser un entero')
    .positive('El ID del producto debe ser válido'),

  cantidad: z
    .number()
    .int('La cantidad debe ser un entero')
    .positive('La cantidad debe ser mayor que 0'),
})

export const createOrderSchema = z.object({
  usuario_id: z
    .coerce
    .number()
    .int('El ID del usuario debe ser un entero')
    .positive('El ID del usuario debe ser válido'),

  detalles: z
    .array(detallePedidoSchema)
    .min(1, 'El pedido debe tener al menos un producto'),
})