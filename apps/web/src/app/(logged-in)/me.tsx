import { type JSX } from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export async function Me(): Promise<JSX.Element> {
  const me = (await urqlClientSdk().me()).me;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2">
      <div className="truncate">
        <div className="capitalize font-semibold text-xl truncate">{`${me.firstName} ${me.lastName}`}</div>
        <div className="font-medium text-sm truncate">{me.email}</div>
      </div>
    </div>
  );
}
