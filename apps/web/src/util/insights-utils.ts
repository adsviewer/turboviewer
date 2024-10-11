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
  if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.impressions_rel))
    return InsightsColumnsOrderBy.impressions_rel;
  else if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.spend_rel))
    return InsightsColumnsOrderBy.spend_rel;
  else if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.spend_abs))
    return InsightsColumnsOrderBy.spend_abs;
  else if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.cpm_rel))
    return InsightsColumnsOrderBy.cpm_rel;
  else if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.cpm_abs))
    return InsightsColumnsOrderBy.cpm_abs;
  return InsightsColumnsOrderBy.impressions_abs;
};
