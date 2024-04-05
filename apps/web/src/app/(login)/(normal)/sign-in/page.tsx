import React, { type JSX, Suspense } from 'react';
import Link from 'next/link';
import { Fallback } from '@repo/ui/fallback';
import { SignIn } from '@/components/login/sign-in';

export default function Page(): JSX.Element {
  return (
    <div>
      <div className="text-destructive" />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl text-center">Sign In</h1>
        <Suspense fallback={<Fallback height={256} />}>
          <SignIn />
        </Suspense>
        <Link className="text-center underline" href="/sign-up">
          No account yet? Create one.
        </Link>
      </div>
    </div>
  );
}
