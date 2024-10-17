'use client';

import { Flex, Select } from '@mantine/core';
import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@repo/logger';
import { getSearchQueryStrings } from '@/app/(authenticated)/actions';
import { type DropdownValueType } from '@/util/types';
import { type SearchQueryStringsQuery } from '@/graphql/generated/schema-server';
import Save from './save';
import Delete from './delete';

interface PropsType {
  getEncodedSearchData: () => string;
}

export default function SavedSearches(props: PropsType): React.ReactNode {
  const [isPending, setIsPending] = useState<boolean>(false);
  const [savedSearches, setSavedSearches] = useState<DropdownValueType[]>([]);

  enum SearchGroups {
    User = 'User',
    Organization = 'Organization',
  }

  const updateSavedSearches = useCallback(
    (searchesData: SearchQueryStringsQuery['searchQueryStrings']): DropdownValueType[] => {
      return searchesData.map((data) => {
        return {
          label: data.name,
          value: data.id,
          group: data.isOrganization ? SearchGroups.Organization : SearchGroups.User,
        };
      });
    },
    [SearchGroups.Organization, SearchGroups.User],
  );

  useEffect(() => {
    setIsPending(true);
    void getSearchQueryStrings()
      .then((res) => {
        if (!res.success) {
          logger.error(res.error);
          return;
        }
        setSavedSearches(updateSavedSearches(res.data.searchQueryStrings));
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [updateSavedSearches]);

  const handleSave = (name: string, isOrganization: boolean, id?: string): void => {
    logger.info(props.getEncodedSearchData());
    logger.info(id);
    logger.info(name);
    logger.info(isOrganization);
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
        data={savedSearches}
      />
      <Save isPending={isPending} handleSave={handleSave} />
      <Delete isPending={isPending} />
    </Flex>
  );
}
