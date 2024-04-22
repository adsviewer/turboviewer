import { builder } from '../builder';

export const OrganizationDto = builder.prismaObject('Organization', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    updatedAt: t.expose('updatedAt', { type: 'Date' }),
    users: t.relation('users'),
    integrations: t.relation('integrations'),
  }),
});
