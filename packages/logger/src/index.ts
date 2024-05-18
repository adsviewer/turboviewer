import { type LoggerOptions, pino } from 'pino';
import { type LogData, pinoLambdaDestination, PinoLogFormatter } from 'pino-lambda';

export interface SlackTransportOptions {
  webhookUrl: string;
}

const options: Partial<SlackTransportOptions> = { webhookUrl: process.env.SLACK_WEBHOOK_URL };
const optionsOrStream: LoggerOptions = {
  base: undefined,
  transport: {
    targets: [
      ...(options.webhookUrl ? [{ level: 'error', target: './slack.mjs', options }] : []),
      { target: process.env.MODE ? 'pino/file' : 'pino-pretty', options: { destination: 1 } },
    ],
  },
};

class CustomLogFormatter extends PinoLogFormatter {
  format(data: LogData & { pid?: string; hostname?: string }): string {
    delete data.pid;
    delete data.hostname;
    return super.format(data);
  }
}

export const logger =
  process.env.IS_LAMBDA === 'true'
    ? pino(
        pinoLambdaDestination({
          formatter: new CustomLogFormatter(),
        }),
      )
    : pino(process.env.NEXT_RUNTIME ? {} : optionsOrStream);

export { lambdaRequestTracker } from 'pino-lambda';
