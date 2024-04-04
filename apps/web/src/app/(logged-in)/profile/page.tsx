import { type JSX, Suspense } from 'react';
import Link from 'next/link';
import { UserProfile } from '@/components/user-profile';

export default function Page(): JSX.Element {
  return (
    <div>
      <h1>Profile</h1>
      <p>Profile page content</p>
      <Suspense>
        <UserProfile />
      </Suspense>
      <Link href="/sign-out" prefetch={false}>
        Sign out
      </Link>
    </div>
  );
}
