import { ActionIcon, Flex, Radio, Text, TextInput, Tooltip } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { modals } from '@mantine/modals';
import { logger } from '@repo/logger';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { z } from 'zod';

interface PropsType {
  isPending: boolean;
  handleSave: (name: string, isOrganization: boolean, id?: string) => void;
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
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      saveType: SaveTypes.SaveAsNew,
    },
    validate: zodResolver(ValidationSchema),
  });

  const openModal = (): void => {
    modals.openConfirmModal({
      title: 'Save Search Configuration',
      children: (
        <form
          onSubmit={form.onSubmit((values) => {
            logger.info(values);
          })}
        >
          <Flex direction="column" gap="sm">
            <TextInput
              description="Configuration Name"
              placeholder="Configuration Name"
              mb="sm"
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <Text size="sm">
              You are about to save this search configuration. Please decide if you want it saved for your current
              organization or just you.
            </Text>
            <Radio.Group key={form.key('saveType')} {...form.getInputProps('saveType')}>
              <Flex direction="column" gap="sm">
                <Radio value={SaveTypes.Update} label="Update selected search" />
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
        const values = form.getValues();
        logger.info(values);
        const isOrganization = values.saveType === SaveTypes.SaveAsNewForOrg;
        props.handleSave(values.name, isOrganization);
        form.reset();
      },
    });
  };

  return (
    <Tooltip label="Save">
      <ActionIcon disabled={props.isPending} variant="outline" size={34} onClick={openModal}>
        <IconDeviceFloppy />
      </ActionIcon>
    </Tooltip>
  );
}