import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandMessenger,
  IconBrandMeta,
  IconBrandTiktok,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceMobileCode,
  IconDevices,
  IconHelpOctagon,
} from '@tabler/icons-react';
import { type ReadonlyURLSearchParams } from 'next/navigation';
import { DeviceEnum, InsightsColumnsOrderBy, PublisherEnum } from '@/graphql/generated/schema-server';
import { isParamInSearchParams, urlKeys } from './url-query-utils';
import { type MultiSelectDataType } from './types';

export const publisherToIconMap = new Map<PublisherEnum, React.FC>([
  [PublisherEnum.Facebook, IconBrandFacebook],
  [PublisherEnum.Instagram, IconBrandInstagram],
  [PublisherEnum.LinkedIn, IconBrandLinkedin],
  [PublisherEnum.Messenger, IconBrandMessenger],
  [PublisherEnum.AudienceNetwork, IconBrandMeta],
  [PublisherEnum.TikTok, IconBrandTiktok],
  [PublisherEnum.GlobalAppBundle, IconHelpOctagon],
  [PublisherEnum.Pangle, IconHelpOctagon],
  [PublisherEnum.Unknown, IconHelpOctagon],
]);

export const deviceToIconMap = new Map<DeviceEnum, React.FC>([
  [DeviceEnum.Desktop, IconDeviceDesktop],
  [DeviceEnum.MobileApp, IconDeviceMobile],
  [DeviceEnum.MobileWeb, IconDeviceMobileCode],
  [DeviceEnum.Unknown, IconDevices],
]);

export const getOrderByValue = (searchParams: ReadonlyURLSearchParams): string => {
  const orderByValue = searchParams.get(urlKeys.orderBy)
    ? (searchParams.get(urlKeys.orderBy) as InsightsColumnsOrderBy)
    : InsightsColumnsOrderBy.impressions_abs;
  return orderByValue;
};

export const populatePublisherAvailableValues = (): MultiSelectDataType[] => {
  let data: MultiSelectDataType[] = [];
  for (const key of Object.keys(PublisherEnum)) {
    const enumValue = PublisherEnum[key as keyof typeof PublisherEnum];
    data = [...data, { value: enumValue, label: enumValue }];
  }
  return data;
};

export const getPublisherCurrentValues = (searchParams: ReadonlyURLSearchParams): string[] => {
  let values: string[] = [];
  for (const key of Object.keys(PublisherEnum)) {
    const enumValue = PublisherEnum[key as keyof typeof PublisherEnum];
    if (isParamInSearchParams(searchParams, urlKeys.publisher, enumValue)) {
      values = [...values, enumValue];
    }
  }
  return values;
};

export const populateAccountsAvailableValues = (accounts: MultiSelectDataType[]): MultiSelectDataType[] =>
  accounts.map((account) => ({ value: account.value, label: account.label }));

export const getAccountCurrentValues = (searchParams: ReadonlyURLSearchParams, accounts: MultiSelectDataType[]): string[] =>
  accounts
    .filter((a) => isParamInSearchParams(searchParams, urlKeys.adAccount, a.value))
    .map((account) => account.value);
