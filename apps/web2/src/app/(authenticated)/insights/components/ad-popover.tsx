import { useDisclosure } from '@mantine/hooks';
import { Popover, PopoverDropdown, PopoverTarget, Flex } from '@mantine/core';
import React from 'react';
import { IconAd } from '@tabler/icons-react';
import { type IFrame } from '@/graphql/generated/schema-server';

interface PropsType {
  iconColor: string;
  iframe: IFrame;
}

export default function AdPopover(props: PropsType): React.ReactNode {
  const [opened, { close, open }] = useDisclosure(false);

  return (
    <Popover width={200} position="bottom" withArrow shadow="md" opened={opened}>
      <PopoverTarget>
        <IconAd color={props.iconColor} accentHeight={2} onMouseEnter={open} onMouseLeave={close} />
      </PopoverTarget>
      <PopoverDropdown w={props.iframe.width} h={480} style={{ pointerEvents: 'none' }} p={12}>
        <Flex justify="center" align="center">
          <iframe
            src={props.iframe.src}
            title="Advertisment"
            width={props.iframe.width}
            height={props.iframe.height}
            scrolling="no"
            frameBorder="0"
          />
        </Flex>
      </PopoverDropdown>
    </Popover>
  );
}
