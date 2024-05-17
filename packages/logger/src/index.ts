import { type LoggerOptions, pino } from 'pino';
import { pinoLambdaDestination } from 'pino-lambda';

export interface SlackTransportOptions {
  webhookUrl: string;
}

const options: Partial<SlackTransportOptions> = { webhookUrl: process.env.SLACK_WEBHOOK_URL };
const destination = pinoLambdaDestination();

const optionsOrStream: LoggerOptions = {
  transport: {
    targets: [
      ...(options.webhookUrl ? [{ level: 'error', target: './slack.mjs', options }] : []),
      { target: 'pino-pretty', options: { destination: 1 } },
    ],
  },
};
export const logger =
  process.env.IS_LAMBDA === 'true' ? pino(destination) : pino(process.env.NEXT_RUNTIME ? {} : optionsOrStream);

export { lambdaRequestTracker } from 'pino-lambda';
