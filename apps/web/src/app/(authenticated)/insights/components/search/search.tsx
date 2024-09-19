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
  useMantineTheme,
  Divider,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconSearch,
  IconAdjustmentsAlt,
  IconCodePlus,
  IconCornerDownRight,
  IconParentheses,
  IconTrash,
  IconCancel,
} from '@tabler/icons-react';
import _ from 'lodash';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { type TransitionStartFunction, useRef, useState, useEffect } from 'react';
import uniqid from 'uniqid';
import { addOrReplaceURLParams, searchKey } from '@/util/url-query-utils';
import {
  InsightsSearchField,
  InsightsSearchOperator,
  type InsightsSearchTerm,
} from '@/graphql/generated/schema-server';
import { AndOrEnum, isAndOrEnum, type SearchExpression, type SearchTermType } from './types-and-utils';

interface PropsType {
  isPending: boolean;
  startTransition: TransitionStartFunction;
}

const INITIAL_SEARCH_EXPRESSION: SearchExpression = {
  and: [],
  or: [],
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

const INITIAL_TERM: InsightsSearchTerm = {
  field: InsightsSearchField.AdName,
  operator: InsightsSearchOperator.Contains,
  value: '',
};

export default function Search(props: PropsType): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const tSearch = useTranslations('insights.search');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [searchBoxValue, setSearchBoxValue] = useState<string>('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchTerms, setSearchTerms] = useState<SearchTermType[]>([]);
  const [loadedSearchData, setLoadedSearchData] = useState<SearchExpression>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
      ? (JSON.parse(Buffer.from(String(searchParams.get(searchKey)), 'base64').toString('utf-8')) as SearchExpression)
      : {};
    setLoadedSearchData(parsedSearchData);
    if (searchParams.get(searchKey)) {
      // Load simple search data
      if (!parsedSearchData.isAdvancedSearch && parsedSearchData.or) {
        if (parsedSearchData.or.length && parsedSearchData.or[0].term?.value)
          setSearchBoxValue(parsedSearchData.or[0].term.value);
      }
      // Load advanced search data
      else if (parsedSearchData.isAdvancedSearch && parsedSearchData.clientSearchTerms) {
        setSearchTerms(parsedSearchData.clientSearchTerms);
      }
    }
  }, [searchParams]);

  const closeModal = (): void => {
    close();
  };

  const scrollToBottom = (): void => {
    setTimeout(() => {
      if (scrollAreaRef.current)
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const addSearchTerm = (andOrValue: AndOrEnum): void => {
    const newSearchTerm = _.cloneDeep(INITIAL_SEARCH_TERM);
    newSearchTerm.isRoot = true;
    newSearchTerm.key = uniqid();
    newSearchTerm.andOrValue = andOrValue;

    // This is fine since we only have one extra level of depth
    let updatedTerms: SearchTermType[] = _.cloneDeep(searchTerms);
    if (searchTerms.length) {
      updatedTerms[0].searchTerms = [...updatedTerms[0].searchTerms, newSearchTerm];
    } else {
      updatedTerms = [newSearchTerm];
    }

    setSearchTerms(updatedTerms);
    scrollToBottom();
  };

  const addSearchSubTerm = (keyToAddTo: string, andOrValue: AndOrEnum): void => {
    const newSearchTerm = _.cloneDeep(INITIAL_SEARCH_TERM);
    newSearchTerm.key = uniqid();
    newSearchTerm.andOrValue = andOrValue;
    const updatedTerms: SearchTermType[] = _.cloneDeep(searchTerms);
    if (searchTerms[0].key === keyToAddTo) {
      const indexToInsertBefore = updatedTerms[0].searchTerms.findIndex((term) => term.isRoot);
      if (indexToInsertBefore !== -1) updatedTerms[0].searchTerms.splice(indexToInsertBefore, 0, newSearchTerm);
      else updatedTerms[0].searchTerms = [...updatedTerms[0].searchTerms, newSearchTerm];
    }

    if (searchTerms[0].searchTerms.length) {
      for (const [index, term] of searchTerms[0].searchTerms.entries()) {
        if (term.key === keyToAddTo) {
          updatedTerms[0].searchTerms[index].searchTerms = [
            ...updatedTerms[0].searchTerms[index].searchTerms,
            newSearchTerm,
          ];
          break;
        }
      }
    }
    setSearchTerms(updatedTerms);
    scrollToBottom();
  };

  const removeSearchTerm = (keyToRemove: string): void => {
    let updatedTerms = _.cloneDeep(searchTerms);
    if (updatedTerms.length) {
      if (updatedTerms[0].key === keyToRemove) updatedTerms = [];
      else if (updatedTerms[0].searchTerms.length) {
        for (const term of updatedTerms[0].searchTerms) {
          if (term.key === keyToRemove) {
            updatedTerms[0].searchTerms = updatedTerms[0].searchTerms.filter(
              (currTerm) => currTerm.key !== keyToRemove,
            );
            break;
          }
        }
      }
      setSearchTerms(updatedTerms);
    }
  };

  const removeSearchSubTerm = (keyToRemove: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    if (updatedTerms.length) {
      for (const [index, term] of updatedTerms[0].searchTerms.entries()) {
        if (term.key === keyToRemove) {
          updatedTerms[0].searchTerms = updatedTerms[0].searchTerms.filter((currTerm) => currTerm.key !== keyToRemove);
          break;
        }
        if (term.searchTerms.length) {
          for (const childTerm of term.searchTerms) {
            if (childTerm.key === keyToRemove) {
              const newTerms = term.searchTerms.filter((currTerm) => currTerm.key !== keyToRemove);
              updatedTerms[0].searchTerms[index].searchTerms = newTerms;
              break;
            }
          }
        }
      }
    }
    setSearchTerms(updatedTerms);
  };

  // The simple search performs a search in ad names and ad accounts by utilizing two OR statements
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
      // The timeout is reset every time a new input is given from the user,
      // so that when they stop typing the search is performed.
      searchTimeoutRef.current = setTimeout(() => {
        const newSearchData = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);
        const adNameSearchData = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);
        const adAccountNameSearchData = _.cloneDeep(INITIAL_SEARCH_EXPRESSION);

        adAccountNameSearchData.term = { ...INITIAL_TERM };
        adNameSearchData.term = { ...INITIAL_TERM };
        adNameSearchData.term.value = newSearchValue;
        adNameSearchData.term.field = InsightsSearchField.AdName;
        adNameSearchData.term.operator = InsightsSearchOperator.Contains;
        adAccountNameSearchData.term.value = newSearchValue;
        adAccountNameSearchData.term.field = InsightsSearchField.AccountName;
        adAccountNameSearchData.term.operator = InsightsSearchOperator.Contains;
        newSearchData.or = [adNameSearchData, adAccountNameSearchData];

        const encodedSearchData = btoa(JSON.stringify(newSearchData));

        props.startTransition(() => {
          const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey, encodedSearchData);
          router.replace(newURL);
        });
      }, 1000);

      setSearchBoxValue(newSearchValue);
    }
    setSearchTerms([]); // empties advanced search modal
  };

  const emptySearchBox = (): void => {
    if (searchBoxRef.current) {
      searchBoxRef.current.value = '';
      setSearchBoxValue('');
    }
  };

  const clearSearchBoxValue = (): void => {
    if (searchBoxRef.current) {
      emptySearchBox();
      props.startTransition(() => {
        const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey);
        router.replace(newURL);
      });
    }
  };

  const changeAndOrOperator = (operator: AndOrEnum, keyToChange: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    if (updatedTerms[0].key === keyToChange) {
      updatedTerms[0].andOrValue = operator;
      for (const [childIndex, childTerm] of updatedTerms[0].searchTerms.entries()) {
        if (childTerm.isRoot) break;
        updatedTerms[0].searchTerms[childIndex].andOrValue = operator;
      }
    } else {
      for (const [index, term] of searchTerms[0].searchTerms.entries()) {
        if (term.isRoot && term.key === keyToChange) {
          updatedTerms[0].searchTerms[index].andOrValue = operator;
          for (const [childIndex, childTerm] of updatedTerms[0].searchTerms[index].searchTerms.entries()) {
            if (childTerm.isRoot) break;
            updatedTerms[0].searchTerms[index].searchTerms[childIndex].andOrValue = operator;
          }
          break;
        }
      }
    }
    setSearchTerms(updatedTerms);
  };

  const changeSearchOperator = (operator: string, keyToChange: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    if (updatedTerms[0].key === keyToChange) {
      updatedTerms[0].searchOperator = operator as InsightsSearchOperator;
    } else {
      for (const [index, term] of searchTerms[0].searchTerms.entries()) {
        if (term.key === keyToChange) {
          updatedTerms[0].searchTerms[index].searchOperator = operator as InsightsSearchOperator;
          break;
        }
        if (term.searchTerms.length) {
          for (const [childIndex, childTerm] of term.searchTerms.entries()) {
            if (childTerm.key === keyToChange) {
              updatedTerms[0].searchTerms[index].searchTerms[childIndex].searchOperator =
                operator as InsightsSearchOperator;
              break;
            }
          }
        }
      }
    }
    setSearchTerms(updatedTerms);
  };

  const changeSearchField = (operator: string, keyToChange: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    if (updatedTerms[0].key === keyToChange) {
      updatedTerms[0].searchField = operator as InsightsSearchField;
    } else {
      for (const [index, term] of searchTerms[0].searchTerms.entries()) {
        if (term.key === keyToChange) {
          updatedTerms[0].searchTerms[index].searchField = operator as InsightsSearchField;
          break;
        }
        if (term.searchTerms.length) {
          for (const [childIndex, childTerm] of term.searchTerms.entries()) {
            if (childTerm.key === keyToChange) {
              updatedTerms[0].searchTerms[index].searchTerms[childIndex].searchField = operator as InsightsSearchField;
              break;
            }
          }
        }
      }
    }
    setSearchTerms(updatedTerms);
  };

  const changeSearchValue = (newValue: string, keyToChange: string): void => {
    const updatedTerms = _.cloneDeep(searchTerms);
    if (updatedTerms[0].key === keyToChange) {
      updatedTerms[0].searchValue = newValue;
    } else {
      for (const [index, term] of searchTerms[0].searchTerms.entries()) {
        if (term.key === keyToChange) {
          updatedTerms[0].searchTerms[index].searchValue = newValue;
          break;
        }
        if (term.searchTerms.length) {
          for (const [childIndex, childTerm] of term.searchTerms.entries()) {
            if (childTerm.key === keyToChange) {
              updatedTerms[0].searchTerms[index].searchTerms[childIndex].searchValue = newValue;
              break;
            }
          }
        }
      }
    }
    setSearchTerms(updatedTerms);
  };

  const handleAdvancedSearch = (): void => {
    emptySearchBox();
    close();

    const rootExpression = { ...INITIAL_SEARCH_EXPRESSION };
    rootExpression.isAdvancedSearch = true;

    // First subterm of first term
    const newExpression = { ...INITIAL_SEARCH_EXPRESSION };
    newExpression.term = {
      field: searchTerms[0].searchField,
      operator: searchTerms[0].searchOperator,
      value: searchTerms[0].searchValue,
    };
    if (searchTerms[0].andOrValue === AndOrEnum.AND && rootExpression.and)
      rootExpression.and = [...rootExpression.and, newExpression];
    else if (searchTerms[0].andOrValue === AndOrEnum.OR && rootExpression.or)
      rootExpression.or = [...rootExpression.or, newExpression];

    if (searchTerms.length) {
      // Rest of the subterms of first term
      let keysToIgnore: string[] = [];
      for (const term of searchTerms[0].searchTerms) {
        if (term.isRoot) break;
        keysToIgnore = [...keysToIgnore, term.key];
        const newExpression2 = { ...INITIAL_SEARCH_EXPRESSION };
        newExpression2.term = {
          field: term.searchField,
          operator: term.searchOperator,
          value: term.searchValue,
        };

        // Finally, add to the correct array of the root expression
        if (term.andOrValue === AndOrEnum.AND && rootExpression.and)
          rootExpression.and = [...rootExpression.and, newExpression2];
        else if (term.andOrValue === AndOrEnum.OR && rootExpression.or)
          rootExpression.or = [...rootExpression.or, newExpression2];
      }

      // Rest of the terms with their subterms
      for (const term of searchTerms[0].searchTerms) {
        if (term.isRoot) {
          const newRootExpression = { ...INITIAL_SEARCH_EXPRESSION };
          const newChildExpression = { ...INITIAL_SEARCH_EXPRESSION };
          newChildExpression.term = {
            field: term.searchField,
            operator: term.searchOperator,
            value: term.searchValue,
          };

          if (term.andOrValue === AndOrEnum.AND && newRootExpression.and)
            newRootExpression.and = [...newRootExpression.and, newChildExpression];
          else if (term.andOrValue === AndOrEnum.OR && newRootExpression.or)
            newRootExpression.or = [...newRootExpression.or, newChildExpression];

          if (term.searchTerms.length) {
            for (const childTerm of term.searchTerms) {
              const newChildExpression2 = { ...INITIAL_SEARCH_EXPRESSION };
              newChildExpression2.term = {
                field: childTerm.searchField,
                operator: childTerm.searchOperator,
                value: childTerm.searchValue,
              };
              if (childTerm.andOrValue === AndOrEnum.AND && newRootExpression.and)
                newRootExpression.and = [...newRootExpression.and, newChildExpression2];
              else if (childTerm.andOrValue === AndOrEnum.OR && newRootExpression.or)
                newRootExpression.or = [...newRootExpression.or, newChildExpression2];
            }
          }

          // Finally, add to the correct array of the root expression
          if (searchTerms[0].andOrValue === AndOrEnum.AND && rootExpression.and)
            rootExpression.and = [...rootExpression.and, newRootExpression];
          else if (searchTerms[0].andOrValue === AndOrEnum.OR && rootExpression.or)
            rootExpression.or = [...rootExpression.or, newRootExpression];
        }
      }
    }

    rootExpression.clientSearchTerms = searchTerms; // is used when loading data in the useEffect!
    const encodedSearchData = btoa(JSON.stringify(rootExpression));

    props.startTransition(() => {
      const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey, encodedSearchData);
      router.replace(newURL);
    });
  };

  const clearSearch = (): void => {
    setSearchTerms([]);
    props.startTransition(() => {
      const newURL = addOrReplaceURLParams(pathname, searchParams, searchKey);
      router.replace(newURL);
    });
    close();
  };

  const renderSearchTermOperatorSetting = (key: string, andOrValue: AndOrEnum): React.ReactNode => {
    return (
      <Flex direction="column">
        {key !== searchTerms[0].key ? <Divider mb="sm" /> : null}
        <Flex align="center" gap="sm" pl={key !== searchTerms[0].key ? 35 : 0}>
          <IconParentheses style={{ opacity: 0.25 }} />
          <Select
            data={AND_OR_DATA}
            defaultValue={andOrValue}
            value={andOrValue}
            allowDeselect={false}
            w={100}
            onChange={(e) => {
              if (e && isAndOrEnum(e)) changeAndOrOperator(e, key);
            }}
            comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
          />
          <Tooltip label={tSearch('addSearchSubTerm')}>
            <ActionIcon
              disabled={props.isPending}
              variant="transparent"
              size={35}
              onClick={() => {
                addSearchSubTerm(key, andOrValue);
              }}
            >
              <IconCodePlus />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={tGeneric('remove')}>
            <ActionIcon
              disabled={props.isPending}
              variant="transparent"
              size={35}
              color={theme.colors.red[7]}
              style={{ opacity: 0.75 }}
              onClick={() => {
                removeSearchTerm(key);
              }}
            >
              <IconTrash />
            </ActionIcon>
          </Tooltip>
        </Flex>
      </Flex>
    );
  };

  const renderSearchTerm = (term: SearchTermType, depth = 1): React.ReactNode => {
    return (
      <Flex
        align="center"
        gap="sm"
        my="sm"
        wrap={isMobile ? 'wrap' : 'nowrap'}
        key={term.key}
        pl={depth > 0 ? depth * 35 : 0}
      >
        <IconCornerDownRight style={{ opacity: 0.25 }} />
        <Select
          data={SEARCH_FIELD_DATA}
          defaultValue={term.searchField}
          value={term.searchField}
          allowDeselect={false}
          onChange={(e) => {
            if (e) changeSearchField(e, term.key);
          }}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
        />
        <Select
          data={SEARCH_OPERATOR_DATA}
          defaultValue={term.searchOperator}
          value={term.searchOperator}
          allowDeselect={false}
          onChange={(e) => {
            if (e) changeSearchOperator(e, term.key);
          }}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
        />

        <TextInput
          placeholder={tGeneric('search')}
          defaultValue={term.searchValue}
          value={term.searchValue}
          onChange={(e) => {
            changeSearchValue(e.target.value, term.key);
          }}
        />

        <Tooltip label={tGeneric('remove')} disabled={term.isRoot}>
          <CloseButton
            disabled={term.isRoot}
            onClick={() => {
              removeSearchSubTerm(term.key);
            }}
          />
        </Tooltip>
      </Flex>
    );
  };

  const renderSearchTerms = (): React.ReactNode => {
    let nodes: React.ReactNode = [];
    if (searchTerms.length) {
      if (searchTerms[0].isRoot)
        nodes = [...nodes, renderSearchTermOperatorSetting(searchTerms[0].key, searchTerms[0].andOrValue)];
      nodes = [...nodes, renderSearchTerm(searchTerms[0])];
      for (const term of searchTerms[0].searchTerms) {
        if (term.isRoot) {
          nodes = [...nodes, renderSearchTermOperatorSetting(term.key, term.andOrValue)];
          nodes = [...nodes, renderSearchTerm(term)];
          for (const childTerm of term.searchTerms) {
            nodes = [...nodes, renderSearchTerm(childTerm, 1)];
          }
        }
        if (!term.isRoot) nodes = [...nodes, renderSearchTerm(term)];
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
          variant={loadedSearchData?.isAdvancedSearch ? 'gradient' : 'default'}
          size={35}
        >
          <IconAdjustmentsAlt />
        </ActionIcon>
      </Tooltip>

      {/* Advanced Search Modal */}
      <Modal
        opened={opened}
        onClose={() => {
          closeModal();
        }}
        title={tGeneric('advancedSearch')}
        size="xl"
      >
        <Flex direction="column" mb="sm">
          <ScrollArea.Autosize mah={500} offsetScrollbars type="always" viewportRef={scrollAreaRef}>
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
          leftSection={<IconParentheses />}
          onClick={() => {
            addSearchTerm(AndOrEnum.AND);
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
            handleAdvancedSearch();
          }}
        >
          {tGeneric('search')}
        </Button>
        <Button
          fullWidth
          leftSection={<IconCancel />}
          mt="sm"
          variant="outline"
          disabled={props.isPending || (!searchParams.get(searchKey) && !searchTerms.length)}
          onClick={() => {
            clearSearch();
          }}
        >
          {tSearch('clearSearch')}
        </Button>
      </Modal>
    </Flex>
  );
}
