import { z } from 'zod';

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
