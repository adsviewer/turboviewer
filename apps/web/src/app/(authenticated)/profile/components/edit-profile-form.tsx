'use client';

import { Button, Flex, Group, PasswordInput, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EditProfileSchema } from '@/util/schemas/profile-schemas';
import { type UpdateUserMutationVariables, type MeQuery } from '@/graphql/generated/schema-server';
import { updateUserDetails } from '../actions';

interface PropsType {
  userDetails: MeQuery['me'];
}

export default function EditProfileForm(props: PropsType): React.ReactNode {
  const t = useTranslations('profile');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      firstName: props.userDetails.firstName,
      lastName: props.userDetails.lastName,
      email: props.userDetails.email,
      oldPassword: '',
      newPassword: '',
      repeatPassword: '',
    },
    validate: zodResolver(EditProfileSchema),
  });

  // TODO: Use global state for user info so that we also update the user button on the sidebar!
  const handleSubmit = (values: UpdateUserMutationVariables): void => {
    // Set unused fields as undefined
    const data = { ...values };
    if (!data.newPassword || !data.oldPassword) {
      delete data.oldPassword;
      delete data.newPassword;
    }

    startTransition(() => {
      void updateUserDetails(data).then((res) => {
        if (!res.success) {
          form.setFieldError('oldPassword', res.error);
        } else {
          form.reset();
          router.refresh();
        }
      });
    });
  };

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        handleSubmit(values);
      })}
    >
      <Flex w="50%" direction="column">
        <TextInput
          label={t('firstName')}
          {...form.getInputProps('firstName')}
          placeholder="John"
          key={form.key('firstName')}
          mb="md"
        />
        <TextInput
          label={t('lastName')}
          key={form.key('lastName')}
          {...form.getInputProps('lastName')}
          placeholder="Doe"
          mb="md"
        />
        <TextInput
          label="E-Mail"
          {...form.getInputProps('email')}
          placeholder="you@example.com"
          key={form.key('email')}
          mb="md"
          style={{ display: 'none' }} // Is currently hidden so that browsers' password manager prompts for password update
        />
        <PasswordInput
          label={t('oldPassword')}
          key={form.key('oldPassword')}
          {...form.getInputProps('oldPassword')}
          placeholder={t('oldPassword')}
          type="password"
          mb="md"
        />
        <PasswordInput
          label={t('newPassword')}
          key={form.key('newPassword')}
          {...form.getInputProps('newPassword')}
          placeholder={t('newPassword')}
          type="password"
          mb="md"
        />
        <PasswordInput
          key={form.key('repeatPassword')}
          {...form.getInputProps('repeatPassword')}
          label={t('repeatPassword')}
          placeholder={t('repeatPassword')}
          type="password"
          mb="md"
        />
        <Group mt="md">
          <Button disabled={isPending} type="submit" w={200}>
            {t('submit')}
          </Button>
        </Group>
      </Flex>
    </form>
  );
}
