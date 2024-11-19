'use client';

import Link from 'next/link';
import { useForm, zodResolver } from '@mantine/form';
import { TextInput, Paper, Title, Text, Container, Button, Flex, ActionIcon } from '@mantine/core';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { IconArrowLeft } from '@tabler/icons-react';
import { ForgotPasswordSchema, type ForgotPasswordSchemaType } from '@/util/schemas/login-schemas';
import LottieAnimation from '@/components/misc/lottie-animation';
import thinkingPersonAnimation from '../../../../public/lotties/thinking-person.json';
import mailboxAnimation from '../../../../public/lotties/mailbox.json';

export default function ForgotPasswordForm(): React.JSX.Element {
  const t = useTranslations('authentication');
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },
    validate: zodResolver(ForgotPasswordSchema),
  });

  const handleSubmit = (values: ForgotPasswordSchemaType): void => {
    setIsPending(true);
    fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(values),
    })
      .then((response) => {
        return response.json();
      })
      .then((data: { success: true } | { success: false }) => {
        if (data.success) {
          setSuccess(true);
        }
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <Container size={420} my={40}>
      {!success ? (
        <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
          <LottieAnimation
            animationData={thinkingPersonAnimation}
            speed={0.5}
            loop
            playAnimation
            customStyles={{
              position: 'absolute',
              top: 320,
              left: 250,
              zIndex: -9999,
              width: '35rem',
              transform: 'rotate(-7deg)',
              opacity: 0.5,
            }}
          />

          <ActionIcon component={Link} href="/sign-in" c="dimmed" variant="transparent">
            <IconArrowLeft />
          </ActionIcon>
          <Flex direction="column" align="center" justify="center" mb="xl">
            <Title ta="center">{t('resetPassword')}</Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
              {t('forgotPasswordHint')}.
            </Text>
          </Flex>

          <form
            onSubmit={form.onSubmit((values) => {
              handleSubmit(values);
            })}
          >
            <TextInput
              label="Email"
              placeholder="you@example.com"
              key={form.key('email')}
              {...form.getInputProps('email')}
              required
              autoComplete="email"
            />
            <Button type="submit" fullWidth mt="xl" loading={isPending}>
              {t('sendResetLink')}!
            </Button>
          </form>
        </Paper>
      ) : (
        <>
          <Text ta="center">{t('resetLinkSent')}!</Text>
          <Flex mt="lg" justify="center" align="center">
            <LottieAnimation animationData={mailboxAnimation} speed={0.75} loop playAnimation allowOnMobile />
          </Flex>
        </>
      )}
    </Container>
  );
}
