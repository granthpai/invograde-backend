import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
});