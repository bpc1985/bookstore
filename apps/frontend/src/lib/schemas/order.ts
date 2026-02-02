import { z } from 'zod';

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'completed', 'cancelled'], {
    required_error: 'Please select a status',
  }),
  note: z.string(),
});

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
