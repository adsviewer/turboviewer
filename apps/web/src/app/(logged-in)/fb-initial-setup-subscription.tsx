'use client';

import { type JSX, useRef } from 'react';
import { toast } from 'react-toastify';
import { useChannelInitialSetupProgressSubscription } from '@/graphql/generated/schema-client';

export default function FbInitialSetupSubscription(): JSX.Element {
  const toastId = useRef<null | number | string>(null);

  useChannelInitialSetupProgressSubscription<number[]>({}, (prev, data) => {
    if (toastId.current === null) {
      toastId.current = toast('Facebook initial setup in progress', { progress: 0 });
    } else if (data.channelInitialSetupProgress === 100) {
      toast.done(toastId.current);
    } else {
      toast.update(toastId.current, { progress: data.channelInitialSetupProgress / 100 });
    }
    return [...(prev ?? []), data.channelInitialSetupProgress];
  });

  // eslint-disable-next-line react/jsx-no-useless-fragment -- required for JSX
  return <></>;
}
