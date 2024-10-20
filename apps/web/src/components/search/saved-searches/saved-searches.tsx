'use client';

import { Flex, Select } from '@mantine/core';
import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useAtom } from 'jotai';
import { deleteSearchQueryString, upsertSearchQueryString } from '@/app/(authenticated)/actions';
import { type DropdownGroupsValueType } from '@/util/types';
import { type SearchQueryStringsQuery } from '@/graphql/generated/schema-server';
import { searchesAtom } from '@/app/atoms/searches-atoms';
import Save from './save';
import Delete from './delete';

interface PropsType {
  getEncodedSearchData: () => string;
}

export default function SavedSearches(props: PropsType): React.ReactNode {
  const tGeneric = useTranslations('generic');
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
    logger.info(loadedSearches);
    setSavedSearches(loadedSearches);
  }, [searches, updateSavedSearches]);

  const handleSave = (name: string, isOrganization: boolean, id?: string): void => {
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
        logger.info(res);
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
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
        setSearches([...newSearches]);
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

  return (
    <Flex gap="sm" align="center">
      <Select
        disabled={isPending}
        description="Saved searches"
        placeholder="Saved searches"
        miw={200}
        maw={450}
        mb="lg"
        comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
        scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
        data={savedSearches}
        value={selectedSearchID}
        onChange={(id) => {
          if (id) setSelectedSearchID(id);
        }}
      />
      <Save isPending={isPending} handleSave={handleSave} />
      <Delete
        isPending={isPending}
        handleDelete={() => {
          if (selectedSearchID) handleDelete(selectedSearchID);
        }}
      />
    </Flex>
  );
}
