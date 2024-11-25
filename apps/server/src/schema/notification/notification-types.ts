import { NotificationTypeEnum } from '@repo/database';
import { type NotificationEvent } from '@repo/shared-types';
import { builder } from '../builder';

export const NotificationEventDto = builder.objectRef<NotificationEvent>('NotificationEventPayload').implement({
  fields: (t) => ({
    type: t.expose('type', { type: NotificationTypeEnum, nullable: false }),
    receivingUserId: t.expose('receivingUserId', { type: 'ID', nullable: false }),
    extraData: t.expose('extraData', { type: 'JSON', nullable: true }),
    isRead: t.expose('isRead', { type: 'Boolean', nullable: false }),
  }),
});
