import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';
import { type AdAccount, type IntegrationTypeEnum } from '@repo/database';
import { MODE } from '@repo/mode';
import _ from 'lodash';
import { z } from 'zod';
import { env } from './config';

const sqsClient = new SQSClient({ region: env.AWS_REGION });

const queueUrl = (channel: IntegrationTypeEnum, queueName: string, isFifo: boolean): string =>
  `https://sqs.eu-central-1.amazonaws.com/${env.AWS_ACCOUNT_ID}/${MODE}-${env.AWS_USERNAME ? `${env.AWS_USERNAME}-` : ''}${queueName}-${channel.toLowerCase()}${isFifo ? '.fifo' : ''}`;

export const channelReportQueueUrl = (channel: IntegrationTypeEnum): string =>
  queueUrl(channel, 'report-requests', false);

export const runAdInsightReportReq = z.object({
  initial: z.boolean(),
  adAccountId: z.string(),
});
type RunAdInsightReportReq = z.infer<typeof runAdInsightReportReq>;

export interface ProcessReportReq extends RunAdInsightReportReq {
  taskId: string;
  status: JobStatusEnum;
}

export enum JobStatusEnum {
  QUEUING = 'QUEUING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export const sendReportRequestsMessage = async (
  adAccounts: AdAccount[],
  channel: IntegrationTypeEnum,
  initial: boolean,
): Promise<void> => {
  const chunkedAccounts = _.chunk(adAccounts, 10);
  await Promise.all(
    chunkedAccounts.map((accounts) =>
      sqsClient.send(
        new SendMessageBatchCommand({
          QueueUrl: channelReportQueueUrl(channel),
          Entries: accounts.map((account) => ({
            Id: account.id,
            MessageBody: JSON.stringify({
              initial,
              adAccountId: account.id,
            } satisfies RunAdInsightReportReq),
          })),
        }),
      ),
    ),
  );
};
