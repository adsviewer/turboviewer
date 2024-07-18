import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandMessenger,
  IconBrandMeta,
  IconBrandTiktok,
  IconHelpOctagon,
} from '@tabler/icons-react';
import { PublisherEnum } from '@/graphql/generated/schema-server';

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
