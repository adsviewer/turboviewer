'use client';

import { type JSX, useRef } from 'react';
import { toast } from 'react-toastify';
import { useChannelInitialSetupProgressSubscription } from '@/graphql/generated/schema-client';
import { IntegrationType } from '@/graphql/generated/schema-server';
import { integrationTypeMap } from '@/util/types';

export default function InitialSetupSubscription(): JSX.Element {
  const typeMap = new Map<IntegrationType, number>(Object.values(IntegrationType).map((type, index) => [type, index]));
  const toastRefs = useRef<(number | string | null)[]>([]);

  useChannelInitialSetupProgressSubscription<number[]>({}, (prev, data) => {
    const channel = data.channelInitialSetupProgress.channel;
    const progress = data.channelInitialSetupProgress.progress / 100;
    const index = typeMap.get(channel) ?? 0;
    const currentElement = toastRefs.current[index];
    if (currentElement === null || progress === 0) {
      toastRefs.current[index] = toast(
        `${integrationTypeMap.get(channel)?.name ?? channel} initial setup in progress`,
        {
          progress: 0,
        },
      );
    } else if (progress === 100) {
      toast.done(currentElement);
    } else {
      toast.update(currentElement, { progress });
    }
    return [...(prev ?? []), progress];
  });

  // eslint-disable-next-line react/jsx-no-useless-fragment -- required for JSX
  return <></>;
}
