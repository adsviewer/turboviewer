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
import { IconSearch, IconAdjustmentsAlt, IconPlus, IconCodePlus, IconCornerDownRight } from '@tabler/icons-react';
import _ from 'lodash';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { type TransitionStartFunction, useRef, useState, useEffect } from 'react';
import uniqid from 'uniqid';
import { logger } from '@repo/logger';
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
  searchTerms: SearchTermType[];
  depth: number;
}

enum AndOrEnum {
  AND = 'AND',
  OR = 'OR',
}

const INITIAL_SEARCH_EXPRESSION: InsightsSearchExpression & {
  isAdvancedSearch?: boolean;
} = {
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
  searchTerms: [],
  depth: 0,
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
    const parsedSearchData = searchParams.get(searchKey)
      ? (JSON.parse(
          Buffer.from(String(searchParams.get(searchKey)), 'base64').toString('utf-8'),
        ) as InsightsSearchExpression & {
          isAdvancedSearch?: boolean;
        })
      : {};

    if (searchParams.get(searchKey)) {
      // Load simple search data
      if (!parsedSearchData.isAdvancedSearch && parsedSearchData.term) {
        setSearchBoxValue(parsedSearchData.term.value);
      }
      // Load advanced search data (currently works for max depth of 2)
      else if (parsedSearchData.isAdvancedSearch && parsedSearchData.and) {
        let fetchedSearchTerms: SearchTermType[] = [];
        logger.info(parsedSearchData);

        // Depth 0
        for (const data of parsedSearchData.and) {
          if (data.term) {
            const newSearchTerm = { ...INITIAL_SEARCH_TERM };
            newSearchTerm.key = uniqid();
            newSearchTerm.searchField = data.term.field;
            newSearchTerm.searchOperator = data.term.operator;
            newSearchTerm.searchValue = data.term.value;

            // Depth 1
            if (data.and) {
              if (data.and.length) {
                const depth1Data: SearchTermType[] = data.and.map((term) => {
                  return {
                    key: uniqid(),
                    andOrValue: AndOrEnum.AND,
                    searchField: term.term?.field ?? InsightsSearchField.AdName,
                    searchOperator: term.term?.operator ?? InsightsSearchOperator.Contains,
                    searchValue: term.term?.value ?? '',
                    searchTerms: [],
                    depth: 1,
                  };
                });

                newSearchTerm.searchTerms = [...newSearchTerm.searchTerms, ...depth1Data];
              }
            }
            if (data.or) {
              if (data.or.length) {
                const depth1Data: SearchTermType[] = data.or.map((term) => {
                  return {
                    key: uniqid(),
                    andOrValue: AndOrEnum.OR,
                    searchField: term.term?.field ?? InsightsSearchField.AdName,
                    searchOperator: term.term?.operator ?? InsightsSearchOperator.Contains,
                    searchValue: term.term?.value ?? '',
                    searchTerms: [],
                    depth: 1,
                  };
                });

                newSearchTerm.searchTerms = [...newSearchTerm.searchTerms, ...depth1Data];
              }
            }

            fetchedSearchTerms = [...fetchedSearchTerms, newSearchTerm];
          }
        }

        setSearchTerms(fetchedSearchTerms);
      }
    }
  }, [searchParams]);

  const addSubSearchTerm = (index: number, depth: number): void => {
    const newSearchTerm = { ...INITIAL_SEARCH_TERM };
    newSearchTerm.key = uniqid();
    newSearchTerm.depth = depth;
    const updatedSearchTerms = _.cloneDeep(searchTerms);
    updatedSearchTerms[index].searchTerms = [...updatedSearchTerms[index].searchTerms, newSearchTerm];
    setSearchTerms(updatedSearchTerms);
  };

  // The simple search performs a search in ad names AND ad accounts
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

  const addSearchTerm = (): void => {
    const newSearchTerm = { ...INITIAL_SEARCH_TERM };
    newSearchTerm.key = uniqid();
    setSearchTerms([...searchTerms, { ...newSearchTerm }]);
  };

  const removeSearchTerm = (keyToRemove: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);

    const removeTermInPlace = (terms: SearchTermType[]): SearchTermType[] => {
      return terms.filter((term) => {
        if (term.key === keyToRemove) return false;
        if (term.searchTerms.length) term.searchTerms = removeTermInPlace(term.searchTerms);
        return true;
      });
    };

    const finalTerms = removeTermInPlace(updatedTerms);
    setSearchTerms(finalTerms);
  };

  const changeAndOrOperator = (operator: string, keyToChange: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    const updateTermInPlace = (terms: SearchTermType[]): boolean => {
      for (const term of terms) {
        if (term.key === keyToChange) {
          term.andOrValue = operator as AndOrEnum;
          return true;
        } else if (term.searchTerms.length) {
          const found = updateTermInPlace(term.searchTerms);
          if (found) return true;
        }
      }
      return false;
    };
    updateTermInPlace(updatedTerms);
    setSearchTerms(updatedTerms);
  };

  const changeSearchOperator = (operator: string, keyToChange: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    const updateTermInPlace = (terms: SearchTermType[]): boolean => {
      for (const term of terms) {
        if (term.key === keyToChange) {
          term.searchOperator = operator as InsightsSearchOperator;
          return true;
        } else if (term.searchTerms.length) {
          const found = updateTermInPlace(term.searchTerms);
          if (found) return true;
        }
      }
      return false;
    };
    updateTermInPlace(updatedTerms);
    setSearchTerms(updatedTerms);
  };

  const changeSearchField = (operator: string, keyToChange: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    const updateTermInPlace = (terms: SearchTermType[]): boolean => {
      for (const term of terms) {
        if (term.key === keyToChange) {
          term.searchField = operator as InsightsSearchField;
          return true;
        } else if (term.searchTerms.length) {
          const found = updateTermInPlace(term.searchTerms);
          if (found) return true;
        }
      }
      return false;
    };
    updateTermInPlace(updatedTerms);
    setSearchTerms(updatedTerms);
  };

  const changeSearchValue = (operator: string, keyToChange: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    const updateTermInPlace = (terms: SearchTermType[]): boolean => {
      for (const term of terms) {
        if (term.key === keyToChange) {
          term.searchValue = operator;
          return true;
        } else if (term.searchTerms.length) {
          const found = updateTermInPlace(term.searchTerms);
          if (found) return true;
        }
      }
      return false;
    };
    updateTermInPlace(updatedTerms);
    setSearchTerms(updatedTerms);
  };

  const handleSearch = (): void => {
    close();
    const newData = { ...INITIAL_SEARCH_EXPRESSION };
    newData.isAdvancedSearch = true;
    logger.info(searchTerms, 'search terms');
    // Depth 0
    for (const term of searchTerms) {
      const newExpression = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);
      if (newExpression.term && newExpression.and && newExpression.or && newData.and) {
        newExpression.term.field = term.searchField;
        newExpression.term.operator = term.searchOperator;
        newExpression.term.value = term.searchValue;

        // Depth 1
        if (term.searchTerms.length) {
          for (const term1 of term.searchTerms) {
            const expr = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);

            if (expr.term) {
              expr.term.field = term1.searchField;
              expr.term.operator = term1.searchOperator;
              expr.term.value = term1.searchValue;
              if (term1.andOrValue === AndOrEnum.AND) newExpression.and = [...newExpression.and, expr];
              else newExpression.or = [...newExpression.or, expr];
            }
          }
        }

        // Depth 0 expressions are always added inside AND
        newData.and = [...newData.and, newExpression];
      }
    }

    logger.info(newData, 'handle search data');
    const encodedSearchData = btoa(JSON.stringify(newData));

    props.startTransition(() => {
      const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey, encodedSearchData);
      router.replace(newURL);
    });
  };

  const renderSearchTerm = (term: SearchTermType, index: number, depth: number): React.ReactNode => {
    return (
      <Flex align="center" gap="sm" my="sm" wrap={isMobile ? 'wrap' : 'nowrap'} key={term.key}>
        {depth > 0 ? <IconCornerDownRight /> : null}
        {depth > 0 ? (
          <Select
            data={AND_OR_DATA}
            defaultValue={term.andOrValue}
            allowDeselect={false}
            onChange={(e) => {
              if (e) changeAndOrOperator(e, term.key);
            }}
            comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
          />
        ) : null}

        <Select
          data={SEARCH_OPERATOR_DATA}
          defaultValue={term.searchOperator}
          allowDeselect={false}
          onChange={(e) => {
            if (e) changeSearchOperator(e, term.key);
          }}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
        />
        <Select
          data={SEARCH_FIELD_DATA}
          defaultValue={term.searchField}
          allowDeselect={false}
          onChange={(e) => {
            if (e) changeSearchField(e, term.key);
          }}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
        />
        <TextInput
          placeholder={tGeneric('search')}
          defaultValue={term.searchValue}
          onChange={(e) => {
            changeSearchValue(e.target.value, term.key);
          }}
        />
        {depth === 0 ? (
          <Tooltip label={tSearch('addSearchSubTerm')}>
            <ActionIcon
              disabled={props.isPending}
              variant="transparent"
              size={35}
              onClick={() => {
                addSubSearchTerm(index, 1);
              }}
            >
              <IconCodePlus />
            </ActionIcon>
          </Tooltip>
        ) : null}

        <Tooltip label={tGeneric('remove')}>
          <CloseButton
            onClick={() => {
              removeSearchTerm(term.key);
            }}
          />
        </Tooltip>
      </Flex>
    );
  };

  const renderSearchTerms = (): React.ReactNode => {
    const nodes = [];
    // Depth 0
    for (const [index0, term0] of searchTerms.entries()) {
      nodes.push(renderSearchTerm(term0, index0, term0.depth));

      if (term0.searchTerms.length) {
        // Depth 1
        for (const [index1, term1] of term0.searchTerms.entries()) {
          nodes.push(renderSearchTerm(term1, index1, term1.depth));
        }
      }
    }
    return nodes;
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
            open();
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
          <ScrollArea.Autosize mah={350} offsetScrollbars type="always">
            {searchTerms.length ? (
              renderSearchTerms()
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
