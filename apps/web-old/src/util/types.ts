import { IntegrationType } from '@/graphql/generated/schema-server';

export type UnwrapArray<T> = T extends (infer R)[] ? R : never;

export const integrationTypeMap = new Map<IntegrationType, { image: string }>([
  [IntegrationType.TIKTOK, { image: '/integrations/tiktok-logo-icon.svg' }],
  [IntegrationType.META, { image: '/integrations/meta-logo-icon.svg' }],
  [IntegrationType.LINKEDIN, { image: '/integrations/linkedin-logo-icon.svg' }],
]);
