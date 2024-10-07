import { type Feedback } from '@repo/database';
import { AError } from '@repo/utils';

export async function postFeedbackToSlack(feedback: Feedback): Promise<AError | undefined> {
  const slackMessage = {
    text: `New Feedback Received: \n*Type:* ${feedback.type} \n*Message:* ${feedback.message}`,
  };

  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL_PUBLIC_FEEDBACK ?? '';

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      body: JSON.stringify(slackMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (_err) {
    return new AError('Something went wrong while sending message to slack');
  }
}
