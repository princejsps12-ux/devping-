import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createMonitorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  url: z.string().url('A valid URL is required (include http:// or https://)'),
  interval: z
    .number()
    .int('Interval must be a whole number of seconds')
    .min(10, 'Interval must be at least 10 seconds')
    .max(86400, 'Interval must be at most 24 hours')
    .optional(),
});

export const updateMonitorSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100).optional(),
    interval: z
      .number()
      .int('Interval must be a whole number of seconds')
      .min(10, 'Interval must be at least 10 seconds')
      .max(86400, 'Interval must be at most 24 hours')
      .optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
