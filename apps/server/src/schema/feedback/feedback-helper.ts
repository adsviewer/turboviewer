import { type Feedback } from '@repo/database';
import { logger } from '@repo/logger';
import { Environment, MODE } from '@repo/mode';
import { AError } from '@repo/utils';
import { env } from '../../config';

export const postFeedbackToSlack = async (feedback: Feedback): Promise<AError | undefined> => {
  const slackMessage = {
    text: `New ${MODE !== Environment.Production ? 'Test ' : ''} Feedback Received: \n*Type:* ${feedback.type} \n*Message:* ${feedback.message}`,
  };

  const slackWebhookUrl = env.SLACK_WEBHOOK_URL_PUBLIC_FEEDBACK;

  if (!slackWebhookUrl) return;
  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      body: JSON.stringify(slackMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    logger.error(err);
    return new AError('Something went wrong while sending message to slack');
  }
};
