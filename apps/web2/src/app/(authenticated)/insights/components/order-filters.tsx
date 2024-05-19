import { type ReactNode } from 'react';
import { Flex, Text, Select } from '@mantine/core';

export default function OrderFilters(): ReactNode {
  return (
    <Flex w="100%" mb="lg" align="center" wrap="wrap">
      {/* Page data info */}
      <Text size="md" mr="auto">
        Page 1 of 1 (10 results in total)
      </Text>

      {/* Filters */}
      <Flex align="center" mr="sm" my="md">
        {/* Page size filter */}
        <Text size="md" mr="sm">
          Page size:
        </Text>
        <Select
          placeholder="Pick value"
          data={['6', '12', '18', '50', '100']}
          defaultValue="12"
          allowDeselect={false}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          maw={90}
        />
      </Flex>

      <Flex align="center">
        {/* Order filter */}
        <Text size="md" mr="sm">
          Order by:
        </Text>
        <Select
          placeholder="Pick value"
          data={['Spent', 'Impressions']}
          defaultValue="Spent"
          allowDeselect={false}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          maw={150}
          mr="sm"
        />
        <Select
          placeholder="Pick value"
          data={['Ascending', 'Descending']}
          defaultValue="Descending"
          allowDeselect={false}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          maw={150}
        />
      </Flex>
    </Flex>
  );
}
