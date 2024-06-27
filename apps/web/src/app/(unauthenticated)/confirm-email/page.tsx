'use client';

import { useEffect, useState } from 'react';
import { Button, Flex, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { resendEmailConfirmation } from '@/app/(unauthenticated)/confirm-email/actions';
import { signOut } from '../actions';

export default function ConfirmEmail(): React.ReactNode {
  const t = useTranslations('authentication');
  const resendEmailTimeInitialValue = 59; // seconds
  const [resendEmailTime, setResendEmailTime] = useState<number>(resendEmailTimeInitialValue);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);

  const sendEmail = (): void => {
    void resendEmailConfirmation();
  };

  useEffect(() => {
    if (isTimerActive) {
      const timer = setInterval(() => {
        setResendEmailTime((time) => {
          if (time === 0) {
            setIsTimerActive(false);
            clearInterval(timer);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    }
  }, [isTimerActive]);

  const handleResend = (): void => {
    setResendEmailTime(resendEmailTimeInitialValue);
    setIsTimerActive(true);
    sendEmail();
  };

  return (
    <Flex direction="column" align="center">
      <Text ta="center" mb="xl">
        {t('signUpEmailConfirm')}
      </Text>
      <Button variant="outline" disabled={resendEmailTime > 1} onClick={handleResend}>
        {t('resendConfirmEmail')}
        {isTimerActive
          ? ` (${String(Math.floor(resendEmailTime / 60))}:${String(resendEmailTime % 60).padStart(2, '0')})`
          : null}
      </Button>
      <Text
        onClick={() => {
          signOut();
        }}
        td="underline"
        size="xs"
        c="dimmed"
        my="md"
        style={{ cursor: 'pointer' }}
      >
        {t('returnToSignIn')}
      </Text>
    </Flex>
  );
}
