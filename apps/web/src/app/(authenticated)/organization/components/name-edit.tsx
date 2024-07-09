'use client';

import { Flex, Text, Button, TextInput } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useForm } from '@mantine/form';
import { useAtom } from 'jotai';
import { type UpdateOrganizationMutationVariables } from '@/graphql/generated/schema-server';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { getUserDetails } from '@/app/(authenticated)/actions';
import { isOrgAdmin } from '@/util/access-utils';
import { updateOrganization } from '../actions';

export default function NameEdit(): React.ReactNode {
  const t = useTranslations('organization');
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: userDetails.currentOrganization?.name ?? '',
    },
  });

  const handleSubmit = (values: UpdateOrganizationMutationVariables): void => {
    void updateOrganization(values).then((res) => {
      if (!res.success) {
        form.setFieldError('name', res.error);
      } else {
        void getUserDetails().then((userRes) => {
          setUserDetails({
            id: userRes.id,
            firstName: userRes.firstName,
            lastName: userRes.lastName,
            email: userRes.email,
            allRoles: userRes.allRoles,
            currentOrganization: userRes.currentOrganization,
            organizations: userRes.organizations,
            photoUrl: userRes.photoUrl,
          });
        });
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
