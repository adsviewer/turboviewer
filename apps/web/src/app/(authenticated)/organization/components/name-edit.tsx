'use client';

import { Flex, Text, Button, TextInput } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useForm } from '@mantine/form';
import { type MeQuery, type UpdateOrganizationMutationVariables } from '@/graphql/generated/schema-server';
import { isOrgAdmin } from '@/util/access-utils';
import { updateOrganization } from '../actions';

interface PropsType {
  userDetails: MeQuery['me'];
}

export default function NameEdit({ userDetails }: PropsType): React.ReactNode {
  const t = useTranslations('organization');
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: userDetails.currentOrganization.name,
    },
  });

  const handleSubmit = (values: UpdateOrganizationMutationVariables): void => {
    void updateOrganization(values).then((res) => {
      if (!res.success) {
        form.setFieldError('name', res.error);
      }
    });
  };

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        handleSubmit(values);
      })}
    >
      <Flex align="center" gap="sm" wrap="wrap">
        <Text>{t('organizationName')}:</Text>
        <TextInput
          placeholder={t('title')}
          key={form.key('name')}
          {...form.getInputProps('name')}
          disabled={!isOrgAdmin(userDetails.allRoles)}
        />
        <Button type="submit" variant="outline" disabled={!isOrgAdmin(userDetails.allRoles)}>
          {t('save')}
        </Button>
      </Flex>
    </form>
  );
}
