import { pino } from 'pino';

export interface SlackTransportOptions {
  webhookUrl: string;
}

const options: Partial<SlackTransportOptions> = { webhookUrl: process.env.SLACK_WEBHOOK_URL };

const optionsOrStream = {
  transport: {
    targets: [
      ...(options.webhookUrl ? [{ level: 'error', target: './slack.mjs', options }] : []),
      { target: 'pino/file', options: { destination: 1 } },
    ],
  },
};
export const logger = pino(process.env.NEXT_RUNTIME ? {} : optionsOrStream);
