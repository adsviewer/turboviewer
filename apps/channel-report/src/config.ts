import { z } from 'zod';
import { channelSchema, createEnv } from '@repo/utils';
import { IntegrationTypeEnum } from '@repo/database';
import { AD_ACCOUNT_ID, CHANNEL_TYPE, SINCE, TASK_ID, UNTIL } from '@repo/channel';

const schema = z
  .object({
    [AD_ACCOUNT_ID]: z.string().min(1),
    [CHANNEL_TYPE]: z.nativeEnum(IntegrationTypeEnum),
    [SINCE]: z.coerce.date(),
    [UNTIL]: z.coerce.date(),
    [TASK_ID]: z.string().min(1),
  })
  .merge(channelSchema);

export const env = createEnv(schema);
