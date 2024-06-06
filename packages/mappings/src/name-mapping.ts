import { IntegrationTypeEnum, LoginProviderEnum } from '@repo/database';
import { camelCase } from 'change-case';

const integrationTypeNameMap = new Map<IntegrationTypeEnum, string>([
  [IntegrationTypeEnum.META, 'Meta'],
  [IntegrationTypeEnum.TIKTOK, 'TikTok'],
  [IntegrationTypeEnum.LINKEDIN, 'LinkedIn'],
]);

export const getIntegrationTypeName = (type: IntegrationTypeEnum): string => {
  return integrationTypeNameMap.get(type) ?? camelCase(type);
};

const loginProviderTypeNameMap = new Map<LoginProviderEnum, string>([[LoginProviderEnum.GOOGLE, 'Google']]);

export const getLoginProviderTypeNameMap = (type: LoginProviderEnum): string => {
  return loginProviderTypeNameMap.get(type) ?? camelCase(type);
};
