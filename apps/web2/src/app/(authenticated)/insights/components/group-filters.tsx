import { Checkbox, Flex, MultiSelect, ScrollArea, Text } from '@mantine/core';
import { type ReactNode } from 'react';

export default function GroupFilters(): ReactNode {
  return (
    <ScrollArea offsetScrollbars>
      <Flex direction="column">
        <Text size="xl">Filters</Text>
        <Text size="sm" mt="xs">
          Accounts
        </Text>
        <MultiSelect
          placeholder="Select accounts..."
          data={['Some Dude 1', 'Some Dude 2', 'Some Dude 3', 'Some Dude 4']}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          Positions
        </Text>
        <MultiSelect
          placeholder="Select positions..."
          data={['Facebook Reels', 'Facebook Stories', 'Instagram Reels', 'Instagram Stories']}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          Devices
        </Text>
        <MultiSelect
          placeholder="Select devices..."
          data={['Mobile (Web)', 'Mobile (App)', 'Desktop', 'Unknown']}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          Publishers
        </Text>
        <MultiSelect
          placeholder="Select publishers..."
          data={['Facebook', 'Instagram', 'Messenger', 'Audience Network', 'LinkedIn', 'TikTok', 'Unknown']}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="lg">
          Group By
        </Text>
        <Checkbox label="Account" my={4} />
        <Checkbox label="Ad ID" my={4} />
        <Checkbox label="Device" my={4} />
        <Checkbox label="Date" my={4} />
        <Checkbox label="Publisher" my={4} />
        <Checkbox label="Position" my={4} />
      </Flex>
    </ScrollArea>
  );
}
