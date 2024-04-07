import { type JSX } from 'react';
import { Me } from '@/app/(logged-in)/me';
import { Aside } from '@/app/(logged-in)/aside';

export default function LoggedInLayout({ children }: React.PropsWithChildren): JSX.Element {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[280px_1fr] lg:grid-rows-1">
      <Aside>
        <Me />
      </Aside>
      <main>{children}</main>
    </div>
  );
}
