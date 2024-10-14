import { builder } from '../builder';

export const SearchQueryDto = builder.prismaObject('SearchQueryString', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    parentId: t.exposeString('parentId', { nullable: false }),
    name: t.exposeString('name', { nullable: false }),
    queryString: t.exposeString('queryString', { nullable: false }),
    isOrganization: t.exposeBoolean('isOrganization', { nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
    updatedAt: t.expose('updatedAt', { type: 'Date', nullable: false }),
  }),
});
