'use client';

import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { logger } from '@repo/logger';

interface ResetEmailBtnProps {
  resendCode: string;
}

export default function ResetEmailBtn({ resendCode }: ResetEmailBtnProps): React.ReactElement {
  const [timer, setTimer] = useState(60);
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (timer === 0) return;
    const intervalId = setTimeout(() => {
      setTimer(timer - 1);
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [timer]);

  const onSubmit = useCallback(() => {
    startTransition(async () => {
      const email = searchParams.get('email');
      if (!email) return;
      const response = await fetch('/api/login/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setTimer(60);
      } else {
        logger.error(response.json(), 'error forgetting password..');
      }
    });
  }, [searchParams]);

  return (
    <div>
      {timer > 0 && (
        <p className="text-center mt-8 text-sm text-gray-600">
          You will be able to resend code in <b>{timer}</b> seconds
        </p>
      )}
      {timer === 0 && (
        <p className="mt-6">
          <button
            type="submit"
            onClick={onSubmit}
            disabled={isPending}
            className="mx-auto flex text-primary-600 font-medium hover:underline disabled:opacity-50"
          >
            {resendCode}
            <ArrowRight className="ml-2" />
          </button>
        </p>
      )}
    </div>
  );
}
