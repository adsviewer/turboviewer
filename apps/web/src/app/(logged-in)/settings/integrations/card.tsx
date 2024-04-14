'use client';

import Image from 'next/image';
import { Badge } from '@repo/ui/badge';
import { ImageOff } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { type JSX, useCallback, useEffect, useState, useTransition } from 'react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as changeCase from 'change-case';
import { type IntegrationsQuery, IntegrationStatus } from '@/graphql/generated/schema-server';
import { integrationTypeMap, type UnwrapArray } from '@/util/types';
import { deAuthIntegration } from '@/app/(logged-in)/settings/integrations/actions';

const statusMap = new Map<IntegrationStatus, string>([
  [IntegrationStatus.ComingSoon, 'Coming soon'],
  [IntegrationStatus.NotConnected, 'Connect'],
  [IntegrationStatus.Revoked, 'Reconnect'],
  [IntegrationStatus.Expired, 'Renew'],
  [IntegrationStatus.Connected, 'Revoke'],
]);

export default function Card({
  status,
  type,
  authUrl,
}: UnwrapArray<IntegrationsQuery['integrations']>): React.ReactElement | null {
  const [cardStatus, setCardStatus] = useState<IntegrationStatus>(status);
  const [redirectUrl, setRedirectUrl] = useState<string | null | undefined>(authUrl);
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('type') === type && searchParams.get('status') === 'success') {
      setCardStatus(IntegrationStatus.Connected);
      router.replace('/settings/integrations', undefined);
    }
  }, [router, searchParams, type]);

  const handleRevoke = useCallback(() => {
    startTransition(async () => {
      const resp = await deAuthIntegration(type);
      switch (resp.__typename) {
        case 'MutationDeAuthIntegrationSuccess':
          setCardStatus(IntegrationStatus.Revoked);
          setRedirectUrl(resp.data);
          break;
        case 'BaseError':
        case 'FacebookError':
          toast.error(resp.message);
          break;
        default:
          break;
      }
    });
  }, [type]);

  const makeButton = (onClick: () => void): JSX.Element => (
    <Button
      variant={IntegrationStatus.Connected === cardStatus ? 'destructive' : 'default'}
      className="w-full"
      disabled={cardStatus === IntegrationStatus.ComingSoon}
      onClick={onClick}
      isLoading={isPending}
    >
      {statusMap.get(cardStatus) ?? cardStatus}
    </Button>
  );

  return (
    <div className="flex flex-col rounded-[12px] border border-gray-600">
      <div className="flex grow gap-2 border-b border-gray-400 p-6">
        <div className="flex grow items-center gap-3">
          <div className="h-12 w-12 rounded-[8px] border border-gray-400 p-1 flex items-center justify-center dark:bg-menu-bg">
            {integrationTypeMap.has(type) ? (
              <Image
                width={40}
                height={40}
                src={integrationTypeMap.get(type)?.image ?? ''}
                alt={type}
                className="rounded-[8px]"
              />
            ) : (
              <ImageOff size={40} />
            )}
          </div>
          <div className="grow text-md font-semibold">{integrationTypeMap.get(type)?.name ?? type}</div>
        </div>
        {cardStatus !== IntegrationStatus.ComingSoon && (
          <Badge
            className="self-start capitalize"
            type="badge-modern"
            color={cardStatus === IntegrationStatus.Connected ? 'success' : 'inactive'}
            hasDot={cardStatus === IntegrationStatus.Connected ? 'outline' : true}
            text={changeCase.noCase(cardStatus)}
          />
        )}
      </div>

      <div className="px-6 py-4 flex gap-2">
        {cardStatus === IntegrationStatus.Connected || !redirectUrl ? (
          makeButton(handleRevoke)
        ) : (
          <Link className="w-full" href={redirectUrl}>
            {makeButton(() => undefined)}
          </Link>
        )}
      </div>
    </div>
  );
}
