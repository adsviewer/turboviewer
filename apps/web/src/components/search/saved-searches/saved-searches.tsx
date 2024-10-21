'use client';

import { Flex, Select } from '@mantine/core';
import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useAtom, useAtomValue } from 'jotai';
import { deleteSearchQueryString, upsertSearchQueryString } from '@/app/(authenticated)/actions';
import { type DropdownGroupsValueType } from '@/util/types';
import { type SearchQueryStringsQuery } from '@/graphql/generated/schema-server';
import { searchesAtom } from '@/app/atoms/searches-atoms';
import { isOperator, isOrgAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import Save from './save';
import Delete from './delete';

interface PropsType {
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
  const [selectedSearchID, setSelectedSearchID] = useState<string | null>(null);

  enum SearchGroups {
    User = 'User',
    Organization = 'Organization',
  }

  const updateSavedSearches = useCallback(
    (searchesData: SearchQueryStringsQuery['searchQueryStrings']): DropdownGroupsValueType[] => {
      const userSearches = searchesData.filter((data) => !data.isOrganization);
      const organizationSearches = searchesData.filter((data) => data.isOrganization);
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
        const responseID = res.data.upsertSearchQueryString.id;

        // Update the selected search (if it's an update operation)
        const newSearches = searches.map((search) =>
          search.id === responseID ? res.data.upsertSearchQueryString : search,
        );

        // Check if no update was made, then push the new search (means it's a new search)
        const isUpdateSearch = searches.some((search) => search.id === responseID);
        if (!isUpdateSearch) newSearches.push(res.data.upsertSearchQueryString);
        setSearches(newSearches);
        setSavedSearches(updateSavedSearches(newSearches));
        setSelectedSearchID(responseID);
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const handleChange = (id: string | null): void => {
    setSelectedSearchID(id);
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
        setSelectedSearchID(null);
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const getSelectedSearchName = (id: string | null): string => {
    if (id) {
      const selectedSearch = searches.find((search) => search.id === id);
      if (selectedSearch) return selectedSearch.name;
    }
    return '';
  };

  const getSelectedSearchIsOrganization = (id: string | null): boolean => {
    if (id) {
      const selectedSearch = searches.find((search) => search.id === id);
      if (selectedSearch) return selectedSearch.isOrganization;
    }
    return false;
  };

  // Disable save and delete buttons if the selected search is organizational and the user isn't operator or org admin
  const getCanUserAlter = (id: string | null): boolean => {
    const isValidUserRole = isOrgAdmin(userDetails.allRoles) || isOperator(userDetails.allRoles);
    if (searches.find((search) => search.id === id && !search.isOrganization)) return true;
    return id ? searches.some((search) => search.isOrganization && isValidUserRole) : false;
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
        value={selectedSearchID}
        onChange={handleChange}
      />
      <Save
        isPending={isPending}
        canUserAlter={getCanUserAlter(selectedSearchID)}
        handleSave={handleSave}
        selectedSearchID={selectedSearchID}
        selectedSearchName={getSelectedSearchName(selectedSearchID)}
        isSelectedSearchOrganization={getSelectedSearchIsOrganization(selectedSearchID)}
      />
      <Delete
        isPending={isPending}
        canUserAlter={getCanUserAlter(selectedSearchID)}
        handleDelete={() => {
          if (selectedSearchID) handleDelete(selectedSearchID);
        }}
        selectedSearchID={selectedSearchID}
      />
    </Flex>
  );
}
