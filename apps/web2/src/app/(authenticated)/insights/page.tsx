import { type ReactNode } from 'react';
import { Flex, Text, Select } from '@mantine/core';
import InsightsGrid from './components/insights-grid';

export default function Insights(): ReactNode {
  return (
    <>
      <h1>Insights</h1>
      <Flex w="100%" mb="lg" align="center">
        {/* Page data info */}
        <Text size="md">Page 1 of 1 (10 results in total)</Text>

        {/* Filters */}
        <Flex ml="auto" align="center" mr="sm">
          {/* Page size filter */}
          <Text size="md" mr="sm">
            Page size:
          </Text>
          <Select
            placeholder="Pick value"
            data={['6', '12', '18', '50', '100']}
            defaultValue="12"
            allowDeselect={false}
            maw={90}
          />
        </Flex>

        {/* Order filter */}
        <Text size="md" mr="sm">
          Order by:
        </Text>
        <Select
          placeholder="Pick value"
          data={['Spent', 'Impressions']}
          defaultValue="Spent"
          allowDeselect={false}
          maw={150}
          mr="sm"
        />
        <Select
          placeholder="Pick value"
          data={['Ascending', 'Descending']}
          defaultValue="Descending"
          allowDeselect={false}
          maw={150}
        />
      </Flex>
      <InsightsGrid />
    </>
  );
}
