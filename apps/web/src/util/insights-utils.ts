import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandMessenger,
  IconBrandMeta,
  IconBrandTiktok,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDevices,
  IconHelpOctagon,
} from '@tabler/icons-react';
import { DeviceEnum, PublisherEnum } from '@/graphql/generated/schema-server';

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
  [DeviceEnum.MobileWeb, IconDeviceMobile],
  [DeviceEnum.Unknown, IconDevices],
]);
