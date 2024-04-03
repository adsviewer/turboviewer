import { type JSX } from 'react';
import { cookies } from 'next/headers';
import { TOKEN_KEY } from '@/config';
import { AvUrqProvider } from '@/app/(logged-in)/urql-provider';
import { Me } from '@/app/(logged-in)/me';

export default function LoggedInLayout({ children }: React.PropsWithChildren): JSX.Element {
  const token = cookies().get(TOKEN_KEY)?.value;

  return (
    <div>
      <Me />
      <main>
        <AvUrqProvider token={token}>{children}</AvUrqProvider>
      </main>
    </div>
  );
}
