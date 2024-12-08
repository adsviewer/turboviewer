import { type NotificationEvent } from '@repo/shared-types';
import { NotificationTypeEnum } from '@repo/database';
import { builder } from '../builder';

export const NotificationType = builder.enumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
});

export const NotificationDto = builder.prismaObject('Notification', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    type: t.expose('type', { type: NotificationType, nullable: false }),
    receivingUserId: t.exposeID('receivingUserId', { nullable: false }),
    receivingUser: t.relation('user', { nullable: false }),
    extraData: t.expose('extraData', { type: 'JSON', nullable: true }),
    isRead: t.expose('isRead', { type: 'Boolean', nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
  }),
});

export const NotificationEventDto = builder.objectRef<NotificationEvent>('NotificationEventPayload').implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    type: t.expose('type', { type: NotificationType, nullable: false }),
    receivingUserId: t.exposeID('receivingUserId', { nullable: false }),
    extraData: t.expose('extraData', { type: 'JSON', nullable: true }),
    isRead: t.expose('isRead', { type: 'Boolean', nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
  }),
});
