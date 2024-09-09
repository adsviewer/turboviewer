import { ActionIcon, Flex, Modal, TextInput, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconAdjustmentsAlt } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export default function Search(): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const [opened, { open, close }] = useDisclosure(false);

  const openAdvancedSearchModal = (): void => {
    open();
  };

  return (
    <Flex align="center" gap="md" wrap="wrap">
      {/* Search */}
      <TextInput leftSectionPointerEvents="none" leftSection={<IconSearch />} placeholder={tGeneric('search')} />

      {/* Advanced Search Button */}
      <Tooltip label={tGeneric('advancedSearch')}>
        <ActionIcon
          onClick={() => {
            openAdvancedSearchModal();
          }}
          variant="default"
          size={35}
          aria-label="Create Organization"
        >
          <IconAdjustmentsAlt />
        </ActionIcon>
      </Tooltip>

      {/* Advanced Search Modal */}
      <Modal opened={opened} onClose={close} title={tGeneric('advancedSearch')}>
        test
      </Modal>
    </Flex>
  );
}
