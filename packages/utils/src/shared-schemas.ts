import { z } from 'zod';

export const MIN_FEEDBACK_MESSAGE_CHARACTERS = 24;

export const messageSchema = z.string().min(MIN_FEEDBACK_MESSAGE_CHARACTERS, {
  message: `Message must be at least ${String(MIN_FEEDBACK_MESSAGE_CHARACTERS)} characters long`,
});

export const sendFeedbackSchema = z.object({
  type: z.string(),
  message: messageSchema,
});

export const commentSchema = z.object({
  comment: z.string().min(1),
});
