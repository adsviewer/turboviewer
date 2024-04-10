import { IntegrationTypeEnum } from '@repo/database';
import { builder } from '../builder';

export enum IntegrationStatus {
  ComingSoon = 'ComingSoon',
  NotConnected = 'NotConnected',
  Expired = 'Expired',
  Connected = 'Connected',
  Listable = 'Listable',
}

export const ShouldConnectIntegrationStatuses = [IntegrationStatus.NotConnected, IntegrationStatus.Expired];

export const IntegrationStatusDto = builder.enumType(IntegrationStatus, {
  name: 'IntegrationStatus',
});

export const IntegrationTypeDto = builder.enumType(IntegrationTypeEnum, {
  name: 'IntegrationType',
});

export const IntegrationListItemDto = builder.simpleObject('IntegrationListItem', {
  fields: (t) => ({
    type: t.field({ type: IntegrationTypeDto }),
    status: t.field({ type: IntegrationStatusDto }),
    authUrl: t.string({ nullable: true }),
  }),
});

export const IntegrationDto = builder.prismaObject('Integration', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),

    type: t.expose('type', { type: IntegrationTypeDto }),
    externalId: t.exposeString('externalId', { nullable: true }),

    accessToken: t.exposeString('accessToken'),
    refreshToken: t.exposeString('refreshToken', { nullable: true }),
    accessTokenExpiresAt: t.expose('accessTokenExpiresAt', { type: 'Date', nullable: true }),
    refreshTokenExpiresAt: t.expose('refreshTokenExpiresAt', { type: 'Date', nullable: true }),

    organization: t.relation('organization'),
  }),
});
