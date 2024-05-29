'use client';

import { useForm } from '@mantine/form';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextInput, PasswordInput, Anchor, Paper, Title, Text, Container, Button, Flex } from '@mantine/core';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { type SignInSchemaType } from '@/util/schemas/login-schemas';

export default function SignIn(): React.JSX.Element {
  const t = useTranslations('authentication');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email.'),
      password: (value) => (value.length > 5 ? null : 'Password must be at least 5 characters long.'),
    },
  });

  const handleSubmit = (values: SignInSchemaType): void => {
    startTransition(() => {
      fetch('/api/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(values),
      })
        .then((response) => {
          return response.json();
        })
        .then((data: { success: true } | { success: false }) => {
          if (data.success) {
            const redirect = searchParams.get('redirect');
            router.push(redirect ?? '/insights');
          }
        })
        .catch((error: unknown) => {
          logger.error(error);
        });
    });
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Flex direction="column" align="center" justify="center" mb="xl">
          <Title ta="center">{t('signIn')}</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            {t('noAccount')}{' '}
            <Anchor
              size="sm"
              component="button"
              onClick={() => {
                router.push('/sign-up');
              }}
            >
              {t('signUp')}!
            </Anchor>
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
          />
          <PasswordInput
            label={t('password')}
            placeholder={t('yourPassword')}
            key={form.key('password')}
            {...form.getInputProps('password')}
            required
            mt="md"
          />
          <Button type="submit" fullWidth mt="xl" disabled={isPending}>
            {t('signIn')}!
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
