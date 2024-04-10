import Image from 'next/image';
import { Badge } from '@repo/ui/badge';
import { ImageOff } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { type IntegrationsQuery, IntegrationStatus, IntegrationType } from '@/graphql/generated/schema-server';
import { type UnwrapArray } from '@/util/types';

const typeMap = new Map<IntegrationType, { image: string; name: string }>([
  [IntegrationType.TIKTOK, { name: 'TikTok', image: '/integrations/tiktok-logo-icon.svg' }],
  [IntegrationType.FACEBOOK, { name: 'Facebook', image: '/integrations/facebook-logo-icon.svg' }],
  [IntegrationType.LINKEDIN, { name: 'LinkedIn', image: '/integrations/linkedin-logo-icon.svg' }],
]);

const statusMap = new Map<IntegrationStatus, string>([
  [IntegrationStatus.ComingSoon, 'Coming soon'],
  [IntegrationStatus.NotConnected, 'Integrate'],
  [IntegrationStatus.Revoked, 'Integrate'],
  [IntegrationStatus.Expired, 'Renew'],
  [IntegrationStatus.Connected, 'Revoke'],
  [IntegrationStatus.Listable, 'Revoke'],
]);

export function Card({ status, type }: UnwrapArray<IntegrationsQuery['integrations']>): React.ReactElement | null {
  const comingSoon = IntegrationStatus.ComingSoon;
  return (
    <div className="flex flex-col rounded-[12px] border border-gray-600">
      <div className="flex grow gap-2 border-b border-gray-400 p-6">
        <div className="flex grow items-center gap-3">
          <div className="h-12 w-12 rounded-[8px] border border-gray-400 p-1 flex items-center justify-center dark:bg-menu-bg">
            {typeMap.has(type) ? (
              <Image width={40} height={40} src={typeMap.get(type)?.image ?? ''} alt={type} className="rounded-[8px]" />
            ) : (
              <ImageOff size={40} />
            )}
          </div>
          <div className="grow text-md font-semibold">{typeMap.get(type)?.name ?? type}</div>
        </div>
        {status !== comingSoon && (
          <Badge
            className="self-start capitalize"
            type="badge-modern"
            color={
              status === IntegrationStatus.Connected || status === IntegrationStatus.Listable ? 'success' : 'inactive'
            }
            hasDot={status === IntegrationStatus.Connected || status === IntegrationStatus.Listable ? 'outline' : true}
            text={status}
          />
        )}
      </div>

      <div className="px-6 py-4 flex gap-2">
        <Button
          color={status === IntegrationStatus.NotConnected ? 'secondary-color' : 'secondary'}
          className={
            status === IntegrationStatus.Expired ||
            status === IntegrationStatus.Connected ||
            status === IntegrationStatus.Listable
              ? 'basis-1/2'
              : 'w-full'
          }
          disabled={status === IntegrationStatus.ComingSoon}
        >
          {statusMap.get(status) ?? status}
        </Button>
      </div>
    </div>
  );
}
