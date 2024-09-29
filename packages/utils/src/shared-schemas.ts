import { z } from 'zod';

export const messageSchema = z.string().min(24, { message: 'Message must be at least 24 characters' });

export const sendFeedbackSchema = z.object({
  type: z.string(),
  message: messageSchema,
});
