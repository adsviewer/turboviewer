import { type IntegrationTypeEnum, type LoginProviderEnum } from '@repo/database';
import { camelCase } from 'change-case';

const integrationTypeNameMap = new Map<IntegrationTypeEnum, string>([
  ['META', 'Meta'],
  ['TIKTOK', 'TikTok'],
  ['LINKEDIN', 'LinkedIn'],
]);

export const getIntegrationTypeName = (type: IntegrationTypeEnum): string => {
  return integrationTypeNameMap.get(type) ?? camelCase(type);
};

const loginProviderTypeNameMap = new Map<LoginProviderEnum, string>([['GOOGLE', 'Google']]);

export const getLoginProviderTypeNameMap = (type: LoginProviderEnum): string => {
  return loginProviderTypeNameMap.get(type) ?? camelCase(type);
};
