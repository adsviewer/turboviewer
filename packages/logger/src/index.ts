import { pino } from 'pino';

export interface SlackTransportOptions {
  webhookUrl: string;
}

const options: Partial<SlackTransportOptions> = { webhookUrl: process.env.SLACK_WEBHOOK_URL };

export const logger = pino({
  transport: {
    targets: [
      ...(options.webhookUrl ? [{ level: 'error', target: './slack.mjs', options }] : []),
      { target: 'pino/file', options: { destination: 1 } },
    ],
  },
});
