import React, { type JSX, Suspense } from 'react';
import Link from 'next/link';
import { Fallback } from '@repo/ui/fallback';
import { SignUp } from '@/components/login/sign-up';

export default function Page(): JSX.Element {
  return (
    <div>
      <div className="text-destructive" />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl text-center">Sign up</h1>
        <Suspense fallback={<Fallback height={364} />}>
          <SignUp />
        </Suspense>
        <Link className="text-center underline" href="/sign-in">
          Already have an account? Log in.
        </Link>
      </div>
    </div>
  );
}
