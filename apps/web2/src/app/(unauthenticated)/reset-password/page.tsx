'use client';

import Link from 'next/link';
import { useForm, zodResolver } from '@mantine/form';
import { Paper, Title, Text, Container, Button, Flex, ActionIcon, PasswordInput } from '@mantine/core';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResetPasswordSchema, type ResetPasswordSchemaType } from '@/util/schemas/login-schemas';

export default function ForgotPasswordForm(): React.JSX.Element {
  const t = useTranslations('authentication');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      password: '',
      token,
    },
    validate: zodResolver(ResetPasswordSchema),
  });

  const handleSubmit = (values: ResetPasswordSchemaType): void => {
    startTransition(() => {
      fetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(values),
      })
        .then((response) => {
          return response.json();
        })
        .then((data: { success: true } | { success: false }) => {
          if (data.success) {
            router.replace('/insights');
          }
        })
        .catch((error: unknown) => {
          logger.error(error);
          router.replace('/forgot-password');
        });
    });
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
        <ActionIcon component={Link} href="/sign-in" c="dimmed" variant="transparent" aria-label="Back">
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
          <PasswordInput
            label={t('password')}
            placeholder={t('yourPassword')}
            key={form.key('password')}
            {...form.getInputProps('password')}
            required
            mt="md"
          />
          <Button type="submit" fullWidth mt="xl" disabled={isPending}>
            {t('submit')}!
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
