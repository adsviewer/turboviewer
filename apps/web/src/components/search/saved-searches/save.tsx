'use client';

import { ActionIcon, Flex, Radio, Text, TextInput, Tooltip } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { modals } from '@mantine/modals';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

interface PropsType {
  canUserAlter: boolean;
  canSaveAsOrg: boolean;
  selectedSearchID: string | null;
  selectedSearchName: string;
  isSelectedSearchOrganization: boolean;
  isPending: boolean;
  handleSave: (name: string, isOrganization: boolean, id: string | null) => void;
}

enum SaveTypes {
  Update = 'Update',
  SaveAsNew = 'SaveAsNew',
  SaveAsNewForOrg = 'SaveAsNewForOrg',
}

const ValidationSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
});

export default function Save(props: PropsType): React.ReactNode {
  const tSearch = useTranslations('insights.search');
  const nameRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      saveType: SaveTypes.SaveAsNew,
    },
    validate: zodResolver(ValidationSchema),
  });

  // Synchronize form name with selectedSearchName whenever props.selectedSearchName changes
  useEffect(() => {
    form.setFieldValue('name', props.selectedSearchName);
  }, [form, props.selectedSearchName]);

  const getFormNameValue = (): string => {
    if (!nameRef.current) return '';
    return nameRef.current.value;
  };

  const openModal = (): void => {
    modals.openConfirmModal({
      title: tSearch('saveSearchPresetTitle'),
      children: (
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Flex direction="column" gap="sm">
            <TextInput
              description={tSearch('presetName')}
              placeholder={tSearch('presetName')}
              mb="sm"
              key={form.key('name')}
              {...form.getInputProps('name')}
              ref={nameRef}
            />
            <Text size="sm">{tSearch('saveDescription')}</Text>
            <Radio.Group key={form.key('saveType')} {...form.getInputProps('saveType')}>
              <Flex direction="column" gap="sm">
                <Radio
                  disabled={!props.selectedSearchID || !props.canUserAlter}
                  value={SaveTypes.Update}
                  label={tSearch('updateSelectedSearch')}
                />
                <Radio value={SaveTypes.SaveAsNew} label={tSearch('saveAsNewUser')} />
                <Radio
                  value={SaveTypes.SaveAsNewForOrg}
                  label={tSearch('saveAsNewOrg')}
                  disabled={!props.canSaveAsOrg}
                />
              </Flex>
            </Radio.Group>
          </Flex>
        </form>
      ),
      labels: { confirm: tSearch('save'), cancel: tSearch('cancel') },
      confirmProps: { loading: props.isPending },
      onCancel: () => {
        form.reset();
      },
      onConfirm: () => {
        const name = getFormNameValue();
        const values = form.getValues();
        let isOrganization = values.saveType === SaveTypes.SaveAsNewForOrg;
        if (values.saveType === SaveTypes.Update) isOrganization = props.isSelectedSearchOrganization;
        const idToUpdate = values.saveType === SaveTypes.Update ? props.selectedSearchID : null;
        props.handleSave(name, isOrganization, idToUpdate);
        form.reset();
      },
    });
  };

  return (
    <Tooltip label={tSearch('saveTooltip')}>
      <ActionIcon disabled={props.isPending} variant="outline" size={34} onClick={openModal}>
        <IconDeviceFloppy />
      </ActionIcon>
    </Tooltip>
  );
}
