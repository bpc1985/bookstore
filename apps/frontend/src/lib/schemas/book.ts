import { z } from 'zod';

export const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string(),
  isbn: z.string().min(1, 'ISBN is required'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Price must be a valid positive number',
    }),
  stock_quantity: z
    .string()
    .min(1, 'Stock quantity is required')
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: 'Stock quantity must be a valid non-negative integer',
    }),
  cover_image: z.string(),
  category_ids: z.array(z.number()),
});

export type BookInput = z.infer<typeof bookSchema>;
