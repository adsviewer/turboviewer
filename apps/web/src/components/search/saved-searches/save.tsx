'use client';

import { ActionIcon, Flex, Radio, Text, TextInput, Tooltip } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { modals } from '@mantine/modals';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

interface PropsType {
  canUserAlter: boolean;
  selectedSearchID: string | null;
  selectedSearchName: string;
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

  const openModal = (): void => {
    modals.openConfirmModal({
      title: 'Save Search Configuration',
      children: (
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Flex direction="column" gap="sm">
            <TextInput
              description="Configuration Name"
              placeholder="Configuration Name"
              mb="sm"
              key={form.key('name')}
              {...form.getInputProps('name')}
              ref={nameRef}
            />
            <Text size="sm">
              You are about to save this search configuration. Please decide if you want it saved for the entire
              organization or just you.
            </Text>
            <Radio.Group key={form.key('saveType')} {...form.getInputProps('saveType')}>
              <Flex direction="column" gap="sm">
                <Radio
                  disabled={!props.selectedSearchID || !props.canUserAlter}
                  value={SaveTypes.Update}
                  label="Update selected search"
                />
                <Radio value={SaveTypes.SaveAsNew} label="Save as new only for me" />
                <Radio value={SaveTypes.SaveAsNewForOrg} label="Save as new for organization" />
              </Flex>
            </Radio.Group>
          </Flex>
        </form>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { loading: props.isPending },
      onCancel: () => {
        form.reset();
      },
      onConfirm: () => {
        if (!nameRef.current) return;
        const name = nameRef.current.value;
        const values = form.getValues();
        const isOrganization = values.saveType === SaveTypes.SaveAsNewForOrg;
        const idToUpdate = values.saveType === SaveTypes.Update ? props.selectedSearchID : null;
        props.handleSave(name, isOrganization, idToUpdate);
        form.reset();
      },
    });
  };

  return (
    <Tooltip label="Save / Save as">
      <ActionIcon disabled={props.isPending} variant="outline" size={34} onClick={openModal}>
        <IconDeviceFloppy />
      </ActionIcon>
    </Tooltip>
  );
}
