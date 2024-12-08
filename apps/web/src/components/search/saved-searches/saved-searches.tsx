'use client';

import { Flex, Select } from '@mantine/core';
import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useAtom, useAtomValue } from 'jotai';
import _ from 'lodash';
import { deleteSearchQueryString, upsertSearchQueryString } from '@/app/(authenticated)/actions';
import { type DropdownGroupsValueType } from '@/util/types';
import { type SearchQueryStringsQuery } from '@/graphql/generated/schema-server';
import { searchesAtom } from '@/app/atoms/searches-atoms';
import { isOperator, isOrgAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { type SearchTermType } from '../types-and-utils';
import Save from './save';
import Delete from './delete';

interface PropsType {
  searchTerms: SearchTermType[];
  getEncodedSearchData: () => string;
  handleSavedSearchChange: (queryString: string) => void;
}

export default function SavedSearches(props: PropsType): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const tSearch = useTranslations('insights.search');
  const userDetails = useAtomValue(userDetailsAtom);
  const [searches, setSearches] = useAtom(searchesAtom);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [savedSearches, setSavedSearches] = useState<DropdownGroupsValueType[]>([]);
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);

  enum SearchGroups {
    User = 'User',
    Organization = 'Organization',
  }

  const updateSavedSearches = useCallback(
    (searchesData: SearchQueryStringsQuery['searchQueryStrings']): DropdownGroupsValueType[] => {
      const [organizationSearches, userSearches] = _.partition(searchesData, 'isOrganization');
      return [
        {
          group: SearchGroups.User,
          items: userSearches.map((data) => ({
            value: data.id,
            label: data.name,
          })),
        },
        {
          group: SearchGroups.Organization,
          items: organizationSearches.map((data) => ({
            value: data.id,
            label: data.name,
          })),
        },
      ];
    },
    [SearchGroups.Organization, SearchGroups.User],
  );

  useEffect(() => {
    const loadedSearches = updateSavedSearches(searches);
    setSavedSearches(loadedSearches);
  }, [searches, updateSavedSearches]);

  const handleSave = (name: string, isOrganization: boolean, id: string | null): void => {
    const payload = {
      name,
      isOrganization,
      queryString: props.getEncodedSearchData(),
      id,
    };
    setIsPending(true);
    void upsertSearchQueryString(payload)
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
          return;
        }
        const responseId = res.data.upsertSearchQueryString.id;

        // Update the selected search (if it's an update operation)
        const newSearches = searches.map((search) =>
          search.id === responseId ? res.data.upsertSearchQueryString : search,
        );

        // Check if no update was made, then push the new search (means it's a new search)
        const isUpdateSearch = searches.some((search) => search.id === responseId);
        if (!isUpdateSearch) newSearches.push(res.data.upsertSearchQueryString);
        setSearches(newSearches);
        setSavedSearches(updateSavedSearches(newSearches));
        setSelectedSearchId(responseId);
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const handleChange = (id: string | null): void => {
    setSelectedSearchId(id);
    const selectedSearch = searches.find((search) => search.id === id);
    if (selectedSearch) props.handleSavedSearchChange(selectedSearch.queryString);
  };

  const handleDelete = (id: string): void => {
    setIsPending(true);
    void deleteSearchQueryString({ id })
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
          return;
        }
        const newSearches = searches.filter((search) => search.id !== id);
        setSearches(newSearches);
        setSavedSearches(updateSavedSearches(newSearches));
        setSelectedSearchId(null);
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const getSelectedSearchName = (id: string | null): string => searches.find((search) => search.id === id)?.name ?? '';

  const getSelectedSearchIsOrganization = (id: string | null): boolean =>
    searches.find((search) => search.id === id)?.isOrganization ?? false;

  // Disable save and delete buttons if the selected search is organizational and the user isn't operator or org admin
  const getCanUserAlter = (id: string | null): boolean => {
    if (searches.find((search) => search.id === id && !search.isOrganization)) return true;
    return id ? searches.some((search) => search.isOrganization && getCanSaveAsOrg()) : false;
  };

  const getCanSaveAsOrg = (): boolean => {
    return isOrgAdmin(userDetails.allRoles) || isOperator(userDetails.allRoles);
  };

  return (
    <Flex gap="sm" align="center">
      <Select
        disabled={isPending}
        clearable
        description={tSearch('searchPresets')}
        placeholder={tSearch('searchPresetHint')}
        miw={200}
        maw={450}
        mb="lg"
        comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
        scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
        data={savedSearches}
        value={selectedSearchId}
        onChange={handleChange}
      />
      <Save
        isPending={isPending || !props.searchTerms.length}
        canUserAlter={getCanUserAlter(selectedSearchId)}
        handleSave={handleSave}
        selectedSearchId={selectedSearchId}
        selectedSearchName={getSelectedSearchName(selectedSearchId)}
        isSelectedSearchOrganization={getSelectedSearchIsOrganization(selectedSearchId)}
        canSaveAsOrg={getCanSaveAsOrg()}
      />
      <Delete
        isPending={isPending}
        canUserAlter={getCanUserAlter(selectedSearchId)}
        handleDelete={() => {
          if (selectedSearchId) handleDelete(selectedSearchId);
        }}
        selectedSearchId={selectedSearchId}
      />
    </Flex>
  );
}
