'use client';

import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  SimpleGrid,
  Flex,
} from '@mantine/core';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { type SignUpSchemaType } from '@/util/schemas/login-schemas';

export default function SignUp(): React.JSX.Element {
  const t = useTranslations('authentication');
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email.'),
      password: (value) => (value.length > 5 ? null : 'Password must be at least 5 characters long.'),
    },
  });
  const router = useRouter();
  const handleSubmit = (values: SignUpSchemaType): void => {
    fetch('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(values),
    })
      .then((response) => {
        return response.json();
      })
      .then((data: { success: true } | { success: false }) => {
        if (data.success) {
          router.push('/insights');
        }
      })
      .catch((error: unknown) => {
        logger.error(error);
      });
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Flex direction="column" align="center" justify="center" mb="xl">
          <Title ta="center">{t('signUp')}</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            {t('alreadyHaveAccount')}{' '}
            <Anchor
              size="sm"
              component="button"
              onClick={() => {
                router.push('/sign-in');
              }}
            >
              {t('signInNow')}!
            </Anchor>
          </Text>
        </Flex>

        <form
          onSubmit={form.onSubmit((values) => {
            handleSubmit(values);
          })}
        >
          <SimpleGrid cols={2}>
            <TextInput
              label={t('firstName')}
              placeholder="John"
              key={form.key('firstName')}
              {...form.getInputProps('firstName')}
              required
            />
            <TextInput
              label={t('lastName')}
              placeholder="Doe"
              key={form.key('lastName')}
              {...form.getInputProps('lastName')}
              required
            />
          </SimpleGrid>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            key={form.key('email')}
            {...form.getInputProps('email')}
            required
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
          <Group justify="space-between" mt="lg">
            <Checkbox
              label={
                <>
                  {t('agree')}{' '}
                  <Anchor size="sm" href="https://adsviewer.io/terms" target="_blank">
                    {t('termsAndConditions')}
                  </Anchor>
                </>
              }
              required
            />
          </Group>
          <Button type="submit" fullWidth mt="xl">
            {t('signUp')}!
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
