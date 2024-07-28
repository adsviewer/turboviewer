import { z } from 'zod';
import { type AdAccount, type Integration, type IntegrationTypeEnum } from '@repo/database';
import { env } from './config';

export const channelIngressInput = z.object({
  initial: z.boolean(),
  integrationIds: z.array(z.string()).optional(),
});

export const channelIngressOutput = z.object({
  statusCode: z.number().int(),
  body: z.string(),
});

const queueUrl = (channel: IntegrationTypeEnum, queueName: string): string =>
  `https://sqs.eu-central-1.amazonaws.com/${env.AWS_ACCOUNT_ID}/${env.AWS_USERNAME ? `${env.AWS_USERNAME}-` : ''}${queueName}-${channel}`;

export const reportRequestsQueueUrl = (channel: IntegrationTypeEnum): string => queueUrl(channel, 'report-requests');

export const completedReportsQueueUrl = (channel: IntegrationTypeEnum): string =>
  queueUrl(channel, 'completed-reports');

export interface ReportRequestInput {
  initial: boolean;
  integration: Integration;
  adAccount: AdAccount;
}
export interface RedisReportRequest extends ReportRequestInput {
  taskId: string;
}

export enum JobStatusEnum {
  QUEUING = 'QUEUING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}
