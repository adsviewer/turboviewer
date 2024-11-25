import { NotificationTypeEnum } from '@repo/database';
import { type NotificationEvent } from '@repo/shared-types';
import { builder } from '../builder';

export const NotificationEventDto = builder.objectRef<NotificationEvent>('NotificationEventPayload').implement({
  fields: (t) => ({
    type: t.expose('type', { type: NotificationTypeEnum, nullable: false }),
    receivingUserId: t.exposeID('receivingUserId', { nullable: false }),
    commentMentionCreativeId: t.exposeString('commentMentionCreativeId', {
      nullable: true,
    }),
  }),
});
