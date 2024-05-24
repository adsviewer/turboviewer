import { type ReactNode, useState } from 'react';
import { UnstyledButton, Menu, Image, Group, MenuTarget, MenuDropdown, MenuItem, Flex } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import React from 'react';
import images from './images';
import classes from './language-picker.module.scss';

const data = [
  { label: 'English', image: images.english },
  { label: 'German', image: images.german },
  { label: 'Italian', image: images.italian },
  { label: 'French', image: images.french },
  { label: 'Polish', image: images.polish },
  { label: 'Greek', image: images.greek },
];

export default function LanguagePicker(): ReactNode {
  const [opened, setOpened] = useState(false);
  const [selected, setSelected] = useState(data[0]);
  const items = data.map((item) => (
    <MenuItem
      leftSection={<Image src={item.image} width={18} height={18} />}
      onClick={() => {
        setSelected(item);
      }}
      key={item.label}
    >
      {item.label}
    </MenuItem>
  ));

  return (
    <Menu
      onOpen={() => {
        setOpened(true);
      }}
      onClose={() => {
        setOpened(false);
      }}
      radius="md"
      width="target"
      withinPortal
    >
      <MenuTarget>
        <UnstyledButton className={classes.control} data-expanded={opened || undefined}>
          <Flex w="100%" justify="flex-start" align="center">
            <Group gap="xs">
              <Image src={selected.image} width={22} height={22} />
              <span className={classes.label}>{selected.label}</span>
            </Group>
            <Flex ml="auto">
              <IconChevronDown size="1rem" className={classes.icon} stroke={1.5} />
            </Flex>
          </Flex>
        </UnstyledButton>
      </MenuTarget>
      <MenuDropdown>{items}</MenuDropdown>
    </Menu>
  );
}
