'use client';

import { ActionIcon, CloseButton, Flex, Modal, TextInput, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { logger } from '@repo/logger';
import { IconSearch, IconAdjustmentsAlt } from '@tabler/icons-react';
import _ from 'lodash';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type TransitionStartFunction, useRef, useState } from 'react';
import { addOrReplaceURLParams, searchKey } from '@/util/url-query-utils';
import {
  type InsightsSearchExpression,
  InsightsSearchField,
  InsightsSearchOperator,
} from '@/graphql/generated/schema-server';

interface PropsType {
  isPending: boolean;
  startTransition: TransitionStartFunction;
}

const INITIAL_SEARCH_EXPRESSION: InsightsSearchExpression = {
  and: [],
  or: [],
  term: {
    field: InsightsSearchField.AdName,
    operator: InsightsSearchOperator.Contains,
    value: '',
  },
};

export default function Search(props: PropsType): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [searchBoxValue, setSearchBoxValue] = useState<string>('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchData, setSearchData] = useState<InsightsSearchExpression>();

  // The search performs a search in ad names and ad accounts
  const handleSearchBoxValueChanged = (): void => {
    logger.info(searchData);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const newSearchValue = searchBoxRef.current ? searchBoxRef.current.value : '';
    if (!newSearchValue) {
      props.startTransition(() => {
        const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey);
        router.replace(newURL);
      });
    } else {
      searchTimeoutRef.current = setTimeout(() => {
        const newSearchData = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);
        if (newSearchData.term) {
          newSearchData.term.value = newSearchValue;

          const orQueryData = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);
          if (orQueryData.term) {
            orQueryData.term.field = InsightsSearchField.AccountName;
            orQueryData.term.value = newSearchValue;
          }
          newSearchData.or = [orQueryData];
        }
        setSearchData(newSearchData);
        const encodedSearchData = btoa(JSON.stringify(newSearchData));

        props.startTransition(() => {
          const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey, encodedSearchData);
          router.replace(newURL);
        });
      }, 2000);

      setSearchBoxValue(newSearchValue);
    }
  };

  const clearSearchBoxValue = (): void => {
    if (searchBoxRef.current) {
      searchBoxRef.current.value = '';
      setSearchBoxValue('');
      props.startTransition(() => {
        const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey);
        router.replace(newURL);
      });
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
        disabled={props.isPending}
        leftSectionPointerEvents="none"
        leftSection={<IconSearch />}
        rightSection={<CloseButton disabled={!searchBoxValue || props.isPending} onClick={clearSearchBoxValue} />}
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
