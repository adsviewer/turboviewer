import { type JSX, Suspense } from 'react';
import { UserProfile } from '@/components/user-profile';
import { SignOutBtn } from '@/components/login/sign-out-btn';

export default function Page(): JSX.Element {
  return (
    <div>
      <h1>Profile</h1>
      <p>Profile page content</p>
      <Suspense>
        <UserProfile />
      </Suspense>
      <SignOutBtn />
    </div>
  );
}
