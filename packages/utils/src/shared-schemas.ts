import { z } from 'zod';

export const MIN_FEEDBACK_MESSAGE_CHARACTERS = 24;

export const messageSchema = z.string().min(MIN_FEEDBACK_MESSAGE_CHARACTERS, {
  message: `Message must be at least ${String(MIN_FEEDBACK_MESSAGE_CHARACTERS)} characters long`,
});

export const commentBodySchema = z.string().min(1, {
  message: `Comment must contain at least 1 character`,
});

export const sendFeedbackSchema = z.object({
  type: z.string(),
  message: messageSchema,
});
