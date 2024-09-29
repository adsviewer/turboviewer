'use client';

import { useDisclosure } from '@mantine/hooks';
import { ActionIcon, Button, Flex, Group, Modal, Select, Textarea, Tooltip } from '@mantine/core';
import { IconMessageReport } from '@tabler/icons-react';
import React, { useState } from 'react';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, zodResolver } from '@mantine/form';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { sendFeedbackSchema } from '@repo/utils';
import { FeedbackTypeEnum, type SendFeedbackMutationVariables } from '@/graphql/generated/schema-server';
import { sendFeedback } from '@/app/(authenticated)/actions';

export default function FeedbackButton(): ReactNode {
  const t = useTranslations('feedback');
  const tGeneric = useTranslations('generic');
  const [opened, { open, close }] = useDisclosure(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      type: FeedbackTypeEnum.FEATURE_SUGGESTION,
      message: '',
    },
    validate: zodResolver(sendFeedbackSchema),
  });

  const FEEDBACK_TYPE_DATA = [
    {
      label: t('featureSuggestion'),
      value: FeedbackTypeEnum.FEATURE_SUGGESTION,
    },
    {
      label: t('bugReport'),
      value: FeedbackTypeEnum.BUG_REPORT,
    },
    {
      label: t('other'),
      value: FeedbackTypeEnum.OTHER,
    },
  ];

  const handleSubmit = (values: SendFeedbackMutationVariables): void => {
    setIsPending(true);

    void sendFeedback(values)
      .then((res) => {
        if (!res.success) {
          logger.error(res.error);
          return;
        }

        form.reset();
        close();
        notifications.show({
          title: tGeneric('success'),
          message: t('successMessage'),
          color: 'blue',
        });
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <Group justify="center">
      {/* Icon Button */}
      <Tooltip label={t('title')}>
        <ActionIcon onClick={open} variant="default" size={35}>
          <IconMessageReport />
        </ActionIcon>
      </Tooltip>

      {/* Modal */}
      <Modal opened={opened} onClose={close} title={t('title')} size="lg">
        <form
          onSubmit={form.onSubmit((values) => {
            handleSubmit(values);
          })}
        >
          <Flex direction="column" gap="lg">
            <Select
              description={t('category')}
              key={form.key('type')}
              {...form.getInputProps('type')}
              data={FEEDBACK_TYPE_DATA}
              allowDeselect={false}
              comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
            />
            <Textarea
              description={t('message')}
              key={form.key('message')}
              {...form.getInputProps('message')}
              placeholder={t('messageHint')}
              autosize
              minRows={6}
              maxRows={6}
            />
            <Button type="submit" disabled={isPending || !form.isValid()}>
              {tGeneric('submit')}
            </Button>
          </Flex>
        </form>
      </Modal>
    </Group>
  );
}
