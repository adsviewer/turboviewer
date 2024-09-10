import { ActionIcon, CloseButton, Flex, Modal, TextInput, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconAdjustmentsAlt } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

export default function Search(): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const [opened, { open, close }] = useDisclosure(false);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [searchBoxValue, setSearchBoxValue] = useState<string>('');

  const handleSearchBoxValueChanged = (): void => {
    if (searchBoxRef.current) {
      setSearchBoxValue(searchBoxRef.current.value);
    }
  };

  const openAdvancedSearchModal = (): void => {
    open();
  };

  return (
    <Flex align="center" gap="md" wrap="wrap">
      {/* Search */}
      <TextInput
        ref={searchBoxRef}
        onChange={handleSearchBoxValueChanged}
        leftSectionPointerEvents="none"
        leftSection={<IconSearch />}
        rightSection={<CloseButton disabled={!searchBoxValue} />}
        placeholder={tGeneric('search')}
      />

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
