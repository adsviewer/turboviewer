import { NotificationTypeEnum } from '@repo/database';
import { builder } from '../builder';

export const NotificationDto = builder.prismaObject('Notification', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    receivingUserId: t.exposeID('receivingUserId', { nullable: false }),
    type: t.expose('type', { type: NotificationTypeEnum, nullable: false }),
    commentMentionCreativeId: t.exposeString('commentMentionCreativeId', {
      nullable: true,
    }),
    user: t.relation('user', { nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
    updatedAt: t.expose('updatedAt', { type: 'Date', nullable: false }),
  }),
});
