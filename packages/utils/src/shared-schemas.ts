import { z } from 'zod';

export const SendFeedbackSchema = z.object({
  type: z.string(),
  message: z.string().min(24, { message: 'Message must be at least 24 characters' }),
});

export const MessageSchema = z.string().min(24, { message: 'Message must be at least 24 characters' });
