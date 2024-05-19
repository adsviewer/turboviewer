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
} from '@mantine/core';
import { logger } from '@repo/logger';

export default function SignUp(): React.JSX.Element {
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
  const handleSubmit = (values: { email: string; password: string }): void => {
    logger.info(values);
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Sign Up</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Already have an account?{' '}
        <Anchor
          size="sm"
          component="button"
          onClick={() => {
            router.push('/sign-in');
          }}
        >
          Sign in now!
        </Anchor>
      </Text>

      <form
        onSubmit={form.onSubmit((values) => {
          handleSubmit(values);
        })}
      >
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <SimpleGrid cols={2}>
            <TextInput
              label="First Name"
              placeholder="John"
              key={form.key('firstName')}
              {...form.getInputProps('firstName')}
              required
            />
            <TextInput
              label="Last Name"
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
            label="Password"
            placeholder="Your password"
            key={form.key('password')}
            {...form.getInputProps('password')}
            required
            mt="md"
          />
          <Group justify="space-between" mt="lg">
            <Checkbox label="Agree to the Terms and Conditions" required />
          </Group>
          <Button type="submit" fullWidth mt="xl">
            Sign Up!
          </Button>
        </Paper>
      </form>
    </Container>
  );
}
