'use client';

import {
  ActionIcon,
  Button,
  CloseButton,
  Flex,
  Modal,
  ScrollArea,
  Select,
  TextInput,
  Tooltip,
  em,
  Text,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { logger } from '@repo/logger';
import { IconSearch, IconAdjustmentsAlt, IconPlus } from '@tabler/icons-react';
import _ from 'lodash';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type TransitionStartFunction, useRef, useState, useEffect } from 'react';
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

interface SearchTermType {
  key: number;
  andOrValue: AndOrEnum;
  searchOperator: InsightsSearchOperator;
  searchField: InsightsSearchField;
  searchValue: string;
}

enum AndOrEnum {
  AND = 'AND',
  OR = 'OR',
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

const INITIAL_SEARCH_TERM: SearchTermType = {
  key: 0,
  andOrValue: AndOrEnum.AND,
  searchOperator: InsightsSearchOperator.Contains,
  searchField: InsightsSearchField.AdName,
  searchValue: '',
};

export default function Search(props: PropsType): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const tSearch = useTranslations('insights.search');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const [opened, { open, close }] = useDisclosure(false);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [searchBoxValue, setSearchBoxValue] = useState<string>('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // const [searchData, setSearchData] = useState<InsightsSearchExpression>();
  const [searchTerms, setSearchTerms] = useState<SearchTermType[]>([]);
  const [keys, setKeys] = useState<number[]>([]);

  const AND_OR_DATA = [
    {
      label: tSearch('and'),
      value: AndOrEnum.AND,
    },
    {
      label: tSearch('or'),
      value: AndOrEnum.OR,
    },
  ];

  const SEARCH_OPERATOR_DATA = [
    {
      label: tSearch('contains'),
      value: InsightsSearchOperator.Contains,
    },
    {
      label: tSearch('startsWith'),
      value: InsightsSearchOperator.StartsWith,
    },
    {
      label: tSearch('equals'),
      value: InsightsSearchOperator.Equals,
    },
  ];

  const SEARCH_FIELD_DATA = [
    {
      label: tSearch('adName'),
      value: InsightsSearchField.AdName,
    },
    {
      label: tSearch('adAccountName'),
      value: InsightsSearchField.AccountName,
    },
  ];

  useEffect(() => {
    const parsedSearch = searchParams.get(searchKey)
      ? (JSON.parse(
          Buffer.from(String(searchParams.get(searchKey)), 'base64').toString('utf-8'),
        ) as InsightsSearchExpression)
      : {};

    // Simple search
    if (parsedSearch.term?.value) {
      setSearchBoxValue(parsedSearch.term.value);
    }

    logger.info(parsedSearch);
  }, [searchParams]);

  // The search performs a search in ad names and ad accounts
  const handleSearchBoxValueChanged = (): void => {
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
        // setSearchData(newSearchData);
        const encodedSearchData = btoa(JSON.stringify(newSearchData));

        props.startTransition(() => {
          const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey, encodedSearchData);
          router.replace(newURL);
        });
      }, 1000);

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

  const addSearchTerm = (): void => {
    let newKey = Math.random();
    while (keys.includes(newKey)) {
      newKey = Math.random();
    }
    setKeys([...keys, newKey]);
    const newSearchTerm = { ...INITIAL_SEARCH_TERM };
    newSearchTerm.key = newKey;
    setSearchTerms([...searchTerms, { ...newSearchTerm }]);
  };

  const removeSearchTerm = (keyToRemove: number): void => {
    const newSearchTerms = searchTerms.filter((term) => term.key !== keyToRemove);
    setSearchTerms(newSearchTerms);
  };

  return (
    <Flex align="center" gap="md" wrap="wrap">
      {/* Search */}
      <TextInput
        defaultValue={searchBoxValue}
        ref={searchBoxRef}
        onChange={handleSearchBoxValueChanged}
        disabled={props.isPending}
        leftSectionPointerEvents="none"
        leftSection={<IconSearch />}
        rightSection={<CloseButton disabled={!searchBoxValue || props.isPending} onClick={clearSearchBoxValue} />}
        placeholder={tGeneric('search')}
        autoComplete="false"
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
      <Modal opened={opened} onClose={close} title={tGeneric('advancedSearch')} size="xl">
        <Flex direction="column" mb="sm">
          <ScrollArea.Autosize mah={200} offsetScrollbars type="always">
            {searchTerms.length ? (
              searchTerms.map((term) => {
                return (
                  <Flex align="center" gap="sm" my="sm" wrap={isMobile ? 'wrap' : 'nowrap'} key={term.key}>
                    <Select
                      placeholder="AND/OR Operator"
                      data={AND_OR_DATA}
                      defaultValue={AndOrEnum.AND}
                      allowDeselect={false}
                      comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
                    />
                    <Select
                      placeholder="Search operator"
                      data={SEARCH_OPERATOR_DATA}
                      defaultValue={InsightsSearchOperator.Contains}
                      allowDeselect={false}
                      comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
                    />
                    <Select
                      placeholder="Search field"
                      data={SEARCH_FIELD_DATA}
                      defaultValue={InsightsSearchField.AdName}
                      allowDeselect={false}
                      comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
                    />
                    <TextInput placeholder={tGeneric('search')} />
                    <CloseButton
                      onClick={() => {
                        removeSearchTerm(term.key);
                      }}
                    />
                  </Flex>
                );
              })
            ) : (
              <Text c="dimmed" ta="center" size="sm">
                {tSearch('searchTermsHint')}
              </Text>
            )}
          </ScrollArea.Autosize>
        </Flex>
        <Button
          fullWidth
          variant="transparent"
          leftSection={<IconPlus />}
          onClick={() => {
            addSearchTerm();
          }}
        >
          {tSearch('addSearchTerm')}
        </Button>
      </Modal>
    </Flex>
  );
}
