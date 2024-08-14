import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';
import { type AdAccount, type Integration, type IntegrationTypeEnum } from '@repo/database';
import { type Optional } from '@repo/utils';
import { MODE } from '@repo/mode';
import _ from 'lodash';
import { env } from './config';

const sqsClient = new SQSClient({ region: env.AWS_REGION });

const queueUrl = (channel: IntegrationTypeEnum, queueName: string, isFifo: boolean): string =>
  `https://sqs.eu-central-1.amazonaws.com/${env.AWS_ACCOUNT_ID}/${MODE}-${env.AWS_USERNAME ? `${env.AWS_USERNAME}-` : ''}${queueName}-${channel.toLowerCase()}${isFifo ? '.fifo' : ''}`;

export const channelReportQueueUrl = (channel: IntegrationTypeEnum): string =>
  queueUrl(channel, 'report-requests', false);

export interface RunAdInsightReportReq {
  initial: boolean;
  integration: ReportIntegration;
  adAccount: ReportAdAccount;
}
export interface ProcessReportReq extends RunAdInsightReportReq {
  taskId: string;
  hasStarted: boolean;
}

export enum JobStatusEnum {
  QUEUING = 'QUEUING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export type ReportAdAccount = Optional<AdAccount, 'updatedAt'>;
export type ReportIntegration = Optional<Integration, 'lastSyncedAt' | 'updatedAt'>;

export const sendReportRequestsMessage = async (
  adAccounts: ReportAdAccount[],
  integration: ReportIntegration,
  channel: IntegrationTypeEnum,
  initial: boolean,
): Promise<void> => {
  delete integration.lastSyncedAt;
  delete integration.updatedAt;
  adAccounts.forEach((account) => {
    delete account.updatedAt;
  });
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
              integration,
              adAccount: account,
            } satisfies RunAdInsightReportReq),
          })),
        }),
      ),
    ),
  );
};
