import { FeedbackTypeEnum } from '@repo/database';
import { builder } from '../builder';
import { UserDto } from '../user/user-types';
import { OrganizationDto } from '../organization/org-types';

export const FeedbackType = builder.enumType(FeedbackTypeEnum, {
  name: 'FeedbackTypeEnum',
});

export const FeedbackDto = builder.prismaObject('Feedback', {
  fields: (t) => ({
    type: t.expose('type', {
      type: FeedbackType,
      nullable: false,
    }),
    message: t.exposeString('message', { nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
    userId: t.exposeID('userId', { nullable: false }),
    user: t.relation('user', { nullable: false, type: UserDto }),
    currentOrganizationId: t.exposeID('currentOrganizationId', { nullable: true }),
    currentOrganization: t.relation('currentOrganization', {
      nullable: true,
      type: OrganizationDto,
    }),
  }),
});
