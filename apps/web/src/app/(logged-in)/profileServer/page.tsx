import { type JSX } from 'react';
import { getUser } from '@/app/(logged-in)/actions';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { SignOutBtn } from '@/components/login/sign-out-btn';

export default async function Home(): Promise<JSX.Element> {
  const result = await getUser();
  const me = (await urqlClientSdk().me()).me;
  if (!result.success) {
    return <h1>Failed to fetch data</h1>;
  }
  return (
    <div>
      <h1>This is rendered as part of an RSC</h1>
      <ul>
        {Object.entries(me).map(([key, value]) => (
          <li key={key}>{value}</li>
        ))}
      </ul>
      <SignOutBtn />
    </div>
  );
}
