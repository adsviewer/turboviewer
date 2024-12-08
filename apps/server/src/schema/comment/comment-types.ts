import { builder } from '../builder';

export const CommentDto = builder.prismaObject('Comment', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    creativeId: t.exposeID('creativeId', { nullable: false }),
    userId: t.exposeID('userId', { nullable: false }),
    body: t.exposeString('body', { nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
    updatedAt: t.expose('updatedAt', { type: 'Date', nullable: false }),
    taggedUsers: t.relation('taggedUsers', { nullable: false }),
    creative: t.relation('creative', { nullable: false }),
    user: t.relation('user', { nullable: false }),
  }),
});
