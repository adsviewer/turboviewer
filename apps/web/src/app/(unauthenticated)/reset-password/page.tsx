'use client';

import Link from 'next/link';
import { useForm, zodResolver } from '@mantine/form';
import { Paper, Title, Text, Container, Button, Flex, ActionIcon, PasswordInput, TextInput } from '@mantine/core';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResetPasswordSchema, type ResetPasswordSchemaType } from '@/util/schemas/login-schemas';
import { DEFAULT_HOME_PATH } from '@/middleware';

export default function ForgotPasswordForm(): React.JSX.Element {
  const t = useTranslations('authentication');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isPending, setIsPending] = useState<boolean>(false);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: searchParams.get('email'),
      password: '',
      token,
    },
    validate: zodResolver(ResetPasswordSchema),
  });

  const handleSubmit = (values: ResetPasswordSchemaType): void => {
    setIsPending(true);
    fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(values),
    })
      .then((response) => {
        return response.json();
      })
      .then((data: { success: true } | { success: false }) => {
        if (data.success) {
          router.replace(DEFAULT_HOME_PATH);
        }
      })
      .catch((error: unknown) => {
        logger.error(error);
        router.replace('/forgot-password');
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
        <ActionIcon component={Link} href="/sign-in" c="dimmed" variant="transparent">
          <IconArrowLeft />
        </ActionIcon>
        <Flex direction="column" align="center" justify="center" mb="xl">
          <Title ta="center">{t('resetPassword')}</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            {t('resetPasswordHint')}.
          </Text>
        </Flex>

        <form
          onSubmit={form.onSubmit((values) => {
            handleSubmit(values);
          })}
        >
          <TextInput
            label="E-Mail"
            placeholder="you@example.com"
            key={form.key('email')}
            {...form.getInputProps('email')}
            required
            disabled
            mt="md"
          />
          <PasswordInput
            label={t('password')}
            placeholder={t('yourPassword')}
            key={form.key('password')}
            {...form.getInputProps('password')}
            required
            mt="md"
          />
          <Button type="submit" fullWidth mt="xl" loading={isPending}>
            {t('submit')}!
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
