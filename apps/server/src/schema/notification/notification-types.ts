import { NotificationTypeEnum } from '@repo/database';
import { type NotificationEvent } from '@repo/shared-types';
import { builder } from '../builder';

export const NotificationDto = builder.prismaObject('Notification', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    type: t.expose('type', { type: NotificationTypeEnum, nullable: false }),
    receivingUserId: t.exposeID('receivingUserId', { nullable: false }),
    extraData: t.expose('extraData', { type: 'JSON', nullable: true }),
    isRead: t.expose('isRead', { type: 'Boolean', nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
  }),
});

export const NotificationEventDto = builder.objectRef<NotificationEvent>('NotificationEventPayload').implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    type: t.expose('type', { type: NotificationTypeEnum, nullable: false }),
    receivingUserId: t.exposeID('receivingUserId', { nullable: false }),
    extraData: t.expose('extraData', { type: 'JSON', nullable: true }),
    isRead: t.expose('isRead', { type: 'Boolean', nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
  }),
});
