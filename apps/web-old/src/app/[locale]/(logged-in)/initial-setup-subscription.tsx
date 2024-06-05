'use client';

import { useRef } from 'react';
import { toast } from 'react-toastify';
import { useChannelInitialSetupProgressSubscription } from '@/graphql/generated/schema-client';
import { IntegrationType } from '@/graphql/generated/schema-server';
import { integrationTypeMap } from '@/util/types';

export default function InitialSetupSubscription(): React.ReactNode {
  const typeMap = new Map<IntegrationType, number>(Object.values(IntegrationType).map((type, index) => [type, index]));
  const toastRefs = useRef<(number | string | null)[]>([]);

  useChannelInitialSetupProgressSubscription<number[]>({}, (prev, data) => {
    const channel = data.channelInitialSetupProgress.channel;
    const progress =
      data.channelInitialSetupProgress.progress === 0 ? 0.01 : data.channelInitialSetupProgress.progress / 100;
    const index = typeMap.get(channel) ?? 0;
    const currentElement = toastRefs.current[index];
    if (!currentElement) {
      toastRefs.current[index] = toast(
        `${integrationTypeMap.get(channel)?.name ?? channel} initial setup in progress`,
        { progress },
      );
    } else if (progress === 1) {
      toast.done(currentElement);
      toastRefs.current[index] = null;
    } else {
      toast.update(currentElement, { progress });
    }
    return [...(prev ?? []), progress];
  });
  return null;
}
