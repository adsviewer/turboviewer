'use client';

import { Flex, Button, TextInput } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useForm } from '@mantine/form';
import { useAtom } from 'jotai';
import { type Dispatch } from 'react';
import { notifications } from '@mantine/notifications';
import { type UpdateOrganizationMutationVariables } from '@/graphql/generated/schema-server';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { getUserDetails } from '@/app/(authenticated)/actions';
import { isOperator, isOrgAdmin } from '@/util/access-utils';
import { updateOrganization } from '../actions';

export interface PropsType {
  isPending: boolean;
  setIsPending: Dispatch<React.SetStateAction<boolean>>;
}

export default function NameEdit(props: PropsType): React.ReactNode {
  const t = useTranslations('organization');
  const tGeneric = useTranslations('generic');
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: userDetails.currentOrganization?.name ?? '',
    },
  });

  const handleSubmit = (values: UpdateOrganizationMutationVariables): void => {
    props.setIsPending(true);
    void updateOrganization(values).then((res) => {
      if (!res.success) {
        form.setFieldError('name', res.error);
        notifications.show({
          title: tGeneric('error'),
          message: res.error,
          color: 'red',
        });
        return res.error;
      }
      void getUserDetails().then((userRes) => {
        setUserDetails(userRes);
        notifications.show({
          title: tGeneric('success'),
          message: t('updateOrganizationSuccess'),
          color: 'blue',
        });
        props.setIsPending(false);
      });
    });
  };

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        handleSubmit(values);
      })}
    >
      <Flex align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          label={t('organizationName')}
          placeholder={t('title')}
          key={form.key('name')}
          {...form.getInputProps('name')}
          disabled={(!isOrgAdmin(userDetails.allRoles) && !isOperator(userDetails.allRoles)) || props.isPending}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!isOrgAdmin(userDetails.allRoles) && !isOperator(userDetails.allRoles)}
          loading={props.isPending}
        >
          {t('save')}
        </Button>
      </Flex>
    </form>
  );
}
