import { Facebook, Globe, Instagram, Linkedin } from 'lucide-react';
import { PublisherEnum } from '@/graphql/generated/schema-server';

export default function Publisher({
  publisher,
}: {
  publisher: PublisherEnum | null | undefined;
}): React.ReactElement | null {
  if (!publisher) return null;

  switch (publisher) {
    case PublisherEnum.Facebook:
      return <Facebook />;
    case PublisherEnum.Instagram:
      return <Instagram />;
    case PublisherEnum.Messenger:
      return <FbMessenger />;
    case PublisherEnum.AudienceNetwork:
      return <Globe />;
    case PublisherEnum.LinkedIn:
      return <Linkedin />;
    case PublisherEnum.TikTok:
      return <TikTok />;
    case PublisherEnum.Unknown:
    default:
      return null;
  }
}

function FbMessenger(_props: React.ComponentProps<'svg'>): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="24px" height="24px">
      <path d="M 16 4 C 9.410156 4 4 9.136719 4 15.5 C 4 18.890625 5.570313 21.902344 8 24 L 8 28.625 L 12.4375 26.40625 C 13.566406 26.746094 14.746094 27 16 27 C 22.589844 27 28 21.863281 28 15.5 C 28 9.136719 22.589844 4 16 4 Z M 16 6 C 21.558594 6 26 10.265625 26 15.5 C 26 20.734375 21.558594 25 16 25 C 14.804688 25 13.664063 24.773438 12.59375 24.40625 L 12.1875 24.28125 L 10 25.375 L 10 23.125 L 9.625 22.8125 C 7.40625 21.0625 6 18.441406 6 15.5 C 6 10.265625 10.441406 6 16 6 Z M 14.875 12.34375 L 8.84375 18.71875 L 14.25 15.71875 L 17.125 18.8125 L 23.09375 12.34375 L 17.8125 15.3125 Z" />
    </svg>
  );
}

function TikTok(_props: React.ComponentProps<'svg'>): React.ReactElement {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth="4"
      stroke="#000000"
      fill="none"
    >
      <path
        d="M52.46,26.64c-1.15.25-4.74.65-9.7-2.41a.5.5,0,0,0-.77.42s0,10,0,13.33c0,2.68.15,20.4-17.16,18.42,0,0-13.68-1-13.68-16.33,0,0,.19-13.8,16.42-15a.51.51,0,0,1,.55.5V32.6a.48.48,0,0,1-.42.49c-1.9.27-9.54,1.8-8.69,8.77a7.19,7.19,0,0,0,7.37,6.3s7,.78,7.32-9V7.94a.51.51,0,0,1,.5-.5h6.88a.5.5,0,0,1,.49.41c.36,2,2.42,9.82,10.8,10.31a.5.5,0,0,1,.48.49v7.51A.48.48,0,0,1,52.46,26.64Z"
        strokeLinecap="round"
      />
    </svg>
  );
}
