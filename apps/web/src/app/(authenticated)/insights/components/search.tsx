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
import uniqid from 'uniqid';
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
  key: string;
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
  key: '',
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

    if (searchParams.get(searchKey)) {
      // Simple search data
      if (parsedSearch.term?.value) {
        setSearchBoxValue(parsedSearch.term.value);
      }
      // Advanced search data
      else {
        let updatedSearchTerms: SearchTermType[] = [];
        if (parsedSearch.and?.length) {
          for (const currTerm of parsedSearch.and) {
            if (currTerm.term) {
              const newTerm = _.cloneDeep(INITIAL_SEARCH_TERM);
              newTerm.key = uniqid();
              newTerm.andOrValue = AndOrEnum.AND;
              newTerm.searchField = currTerm.term.field;
              newTerm.searchOperator = currTerm.term.operator;
              newTerm.searchValue = currTerm.term.value;
              updatedSearchTerms = [...updatedSearchTerms, newTerm];
            }
          }
        }
        if (parsedSearch.or?.length) {
          for (const currTerm of parsedSearch.or) {
            if (currTerm.term) {
              const newTerm = _.cloneDeep(INITIAL_SEARCH_TERM);
              newTerm.key = uniqid();
              newTerm.andOrValue = AndOrEnum.OR;
              newTerm.searchField = currTerm.term.field;
              newTerm.searchOperator = currTerm.term.operator;
              newTerm.searchValue = currTerm.term.value;
              updatedSearchTerms = [...updatedSearchTerms, newTerm];
            }
          }
        }
        setSearchTerms(updatedSearchTerms);
        logger.info(updatedSearchTerms);
      }
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
    const newSearchTerm = { ...INITIAL_SEARCH_TERM };
    newSearchTerm.key = uniqid();
    setSearchTerms([...searchTerms, { ...newSearchTerm }]);
  };

  const removeSearchTerm = (keyToRemove: string): void => {
    const newSearchTerms = searchTerms.filter((term) => term.key !== keyToRemove);
    setSearchTerms(newSearchTerms);
  };

  const changeAndOrOperator = (operator: string, changeIndex: number): void => {
    const updatedTerms = searchTerms.map((term, index) =>
      changeIndex === index ? { ...term, andOrValue: operator as AndOrEnum } : term,
    );
    setSearchTerms(updatedTerms);
  };

  const changeSearchOperator = (operator: string, changeIndex: number): void => {
    const updatedTerms = searchTerms.map((term, index) =>
      changeIndex === index ? { ...term, searchOperator: operator as InsightsSearchOperator } : term,
    );
    setSearchTerms(updatedTerms);
  };

  const changeSearchField = (operator: string, changeIndex: number): void => {
    const updatedTerms = searchTerms.map((term, index) =>
      changeIndex === index ? { ...term, searchField: operator as InsightsSearchField } : term,
    );
    setSearchTerms(updatedTerms);
  };

  const changeSearchValue = (searchText: string, changeIndex: number): void => {
    const updatedTerms = searchTerms.map((term, index) =>
      changeIndex === index ? { ...term, searchValue: searchText } : term,
    );
    setSearchTerms(updatedTerms);
  };

  const handleSearch = (): void => {
    close();
    const newSearchData = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);

    for (const term of searchTerms) {
      const newData = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);
      if (newData.term) {
        newData.term.operator = term.searchOperator;
        newData.term.field = term.searchField;
        newData.term.value = term.searchValue;
      }

      if (term.andOrValue === AndOrEnum.AND && newSearchData.and) {
        newSearchData.and = [...newSearchData.and, newData];
      } else if (term.andOrValue === AndOrEnum.OR && newSearchData.or) {
        newSearchData.or = [...newSearchData.or, newData];
      }
    }
    const encodedSearchData = btoa(JSON.stringify(newSearchData));
    logger.info(newSearchData);

    props.startTransition(() => {
      const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey, encodedSearchData);
      router.replace(newURL);
    });
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
          disabled={props.isPending}
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
              searchTerms.map((term, index) => {
                return (
                  <Flex align="center" gap="sm" my="sm" wrap={isMobile ? 'wrap' : 'nowrap'} key={term.key}>
                    <Select
                      placeholder="AND/OR Operator"
                      data={AND_OR_DATA}
                      defaultValue={term.andOrValue}
                      allowDeselect={false}
                      onChange={(e) => {
                        if (e) changeAndOrOperator(e, index);
                      }}
                      comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
                    />
                    <Select
                      placeholder="Search operator"
                      data={SEARCH_OPERATOR_DATA}
                      defaultValue={term.searchOperator}
                      allowDeselect={false}
                      onChange={(e) => {
                        if (e) changeSearchOperator(e, index);
                      }}
                      comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
                    />
                    <Select
                      placeholder="Search field"
                      data={SEARCH_FIELD_DATA}
                      defaultValue={term.searchField}
                      allowDeselect={false}
                      onChange={(e) => {
                        if (e) changeSearchField(e, index);
                      }}
                      comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
                    />
                    <TextInput
                      placeholder={tGeneric('search')}
                      defaultValue={term.searchValue}
                      onChange={(e) => {
                        changeSearchValue(e.target.value, index);
                      }}
                    />
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
        <Button
          fullWidth
          leftSection={<IconSearch />}
          mt="sm"
          disabled={props.isPending || !searchTerms.length}
          onClick={() => {
            handleSearch();
          }}
        >
          {tGeneric('search')}
        </Button>
      </Modal>
    </Flex>
  );
}
