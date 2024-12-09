import { builder } from '../../builder';

export const PreferencesDto = builder.prismaObject('Preferences', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    insightsPerRow: t.exposeInt('insightsPerRow', { nullable: false }),
    user: t.relation('user', { nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
    updatedAt: t.expose('updatedAt', { type: 'Date', nullable: false }),
  }),
});
