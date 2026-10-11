import { z } from 'zod'

export const createProductSchema = z.object({
  nombre: z
    .string()
    .min(1, 'Name is required'),

  precio: z
    .number()
    .positive('Price must be greater than 0'),

  imagen: z
    .string()
    .min(1, 'Image is required'),

  stock: z
    .number()
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative'),

  categoria_id: z
    .number()
    .int('Category ID must be an integer')
    .positive('Category ID must be valid'),
})

export const updateProductSchema = z.object({
  nombre: z
    .string()
    .min(1, 'Name cannot be empty')
    .optional(),

  precio: z
    .number()
    .positive('Price must be greater than 0')
    .optional(),

  imagen: z
    .string()
    .min(1, 'Image cannot be empty')
    .optional(),

  stock: z
    .number()
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative')
    .optional(),

  categoria_id: z
    .number()
    .int('Category ID must be an integer')
    .positive('Category ID must be valid')
    .optional(),
})

const orderDetailSchema = z.object({
  producto_id: z
    .coerce
    .number()
    .int('Product ID must be an integer')
    .positive('Product ID must be valid'),

  cantidad: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0'),
})

export const createOrderSchema = z.object({
  usuario_id: z
    .coerce
    .number()
    .int('User ID must be an integer')
    .positive('User ID must be valid'),

  detalles: z
    .array(orderDetailSchema)
    .min(1, 'Order must have at least one product'),
})

const orderItemSchema = z.object({
  producto_id: z
    .number()
    .int('Product ID must be an integer')
    .positive('Product ID must be valid'),

  cantidad: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0'),
})

const positiveMoneyString = z
  .string()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    'Amount must be a valid monetary format',
  )
  .refine((value) => Number(value) > 0, {
    message: 'Amount must be greater than 0',
  })

export const processOrderSchema = z.object({
  type: z.literal('online'),

  total_amount: positiveMoneyString,

  external_reference: z.string().uuid(),

  processing_mode: z.literal('automatic'),

  transactions: z.object({
    payments: z
      .array(
        z.object({
          amount: positiveMoneyString,

          payment_method: z.object({
            id: z.string().min(1, 'Payment method is required'),

            type: z.string().min(1).optional(),

            token: z
              .string()
              .min(1, 'Token cannot be empty'),

            installments: z
              .number()
              .int('Installments must be an integer')
              .positive('Installments must be greater than 0'),
          }),
        }),
      )
      .length(1, 'Exactly one payment must be provided'),
  }),

  payer: z.object({
    email: z.string().email('Payer email is not valid'),

    identification: z
      .object({
        type: z.string().min(1),
        number: z.string().min(1),
      })
      .optional(),
  }),

  items: z
    .array(orderItemSchema)
    .min(1, 'Order must have at least one product'),
})
