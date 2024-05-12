import { IntegrationType } from '@/graphql/generated/schema-server';

export type UnwrapArray<T> = T extends (infer R)[] ? R : never;

export const integrationTypeMap = new Map<IntegrationType, { image: string; name: string }>([
  [IntegrationType.TIKTOK, { name: 'TikTok', image: '/integrations/tiktok-logo-icon.svg' }],
  [IntegrationType.FACEBOOK, { name: 'Meta', image: '/integrations/meta-logo-icon.svg' }],
  [IntegrationType.LINKEDIN, { name: 'LinkedIn', image: '/integrations/linkedin-logo-icon.svg' }],
]);
