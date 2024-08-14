'use client';

import {
  ActionIcon,
  Modal,
  Tooltip,
  Text,
  Flex,
  ScrollArea,
  CloseButton,
  TextInput,
  Checkbox,
  Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAd, IconSearch } from '@tabler/icons-react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ChangeEvent, useState, type ReactNode } from 'react';
import { logger } from '@repo/logger';
import { useAtomValue } from 'jotai';
import _ from 'lodash';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type OrganizationAdAccountsQuery,
  type IntegrationType,
  type AvailableOrganizationAdAccountsQuery,
} from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';
import { isAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { addOrReplaceURLParams, errorKey } from '@/util/url-query-utils';
import {
  getAvailableOrganizationAdAccounts,
  getOrganizationAdAccounts,
  updateOrganizationAdAccounts,
} from '../../organization/actions';

interface PropsType {
  channel: IntegrationType;
  integrationTitle: string;
}

type AdAccountsDataType =
  | OrganizationAdAccountsQuery['organizationAdAccounts']
  | AvailableOrganizationAdAccountsQuery['availableOrganizationAdAccounts'];

export default function AdAccountsButton(props: PropsType): ReactNode {
  const t = useTranslations('integrations');
  const tGeneric = useTranslations('generic');
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userDetails = useAtomValue(userDetailsAtom);
  const [opened, { open, close }] = useDisclosure(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [adAccounts, setAdAccounts] = useState<AdAccountsDataType>([]);
  const [adAccountsToShow, setAdAccountsToShow] = useState<AdAccountsDataType>([]);
  const [initialAdAccounts, setInitialAdAccounts] = useState<AdAccountsDataType>([]); // is used for keeping submit button disabled
  const [searchValue, setSearchValue] = useState<string>('');

  const fetchAdAccounts = (): void => {
    setAdAccounts([]);
    setAdAccountsToShow([]);
    setInitialAdAccounts([]);
    setIsPending(true);

    // Fetch data from the appropriate endpoint based on whether the user is an admin or not
    if (!isAdmin(userDetails.allRoles)) {
      void getOrganizationAdAccounts(props.channel)
        .then((res) => {
          if (!res.success) {
            logger.error(res.error);
            return;
          }

          setAdAccounts(res.data.organizationAdAccounts);
          setAdAccountsToShow(res.data.organizationAdAccounts);
        })
        .catch((err: unknown) => {
          logger.error(err);
        })
        .finally(() => {
          setIsPending(false);
        });
    } else {
      void getAvailableOrganizationAdAccounts(props.channel)
        .then((res) => {
          if (!res.success) {
            logger.error(res.error);
            return;
          }

          setAdAccounts(res.data.availableOrganizationAdAccounts);
          setAdAccountsToShow(res.data.availableOrganizationAdAccounts);
          setInitialAdAccounts(res.data.availableOrganizationAdAccounts);
        })
        .catch((err: unknown) => {
          logger.error(err);
        })
        .finally(() => {
          setIsPending(false);
        });
    }
  };

  const openModal = (): void => {
    open();

    if (!isPending) {
      fetchAdAccounts();
    }
  };

  const closeModal = (): void => {
    close();
    clearSearch();
    setAdAccounts([]);
    setAdAccountsToShow([]);
    setInitialAdAccounts([]);
    setIsPending(false);
  };

  const clearSearch = (): void => {
    setSearchValue('');
    setAdAccountsToShow(adAccounts);
  };

  const onSearchValueChanged = (e: ChangeEvent<HTMLInputElement>): void => {
    const searchFieldValue = e.target.value;
    setSearchValue(searchFieldValue);
    performSearch(searchFieldValue);
  };

  const performSearch = (searchFieldValue: string): void => {
    const data = adAccounts.filter((adAccount) => {
      return adAccount.name.toLowerCase().includes(searchFieldValue.toLowerCase());
    });
    setAdAccountsToShow(data);
  };

  const toggleCheckbox = (e: ChangeEvent<HTMLInputElement>, adAccountId: string): void => {
    const adAccountsData = _.map(adAccounts, (adAccount) =>
      adAccount.id === adAccountId ? { ...adAccount, isConnectedToCurrentOrg: e.target.checked } : adAccount,
    );
    setAdAccounts(adAccountsData);

    const adAccountsToShowData = _.map(adAccounts, (adAccount) =>
      adAccount.id === adAccountId ? { ...adAccount, isConnectedToCurrentOrg: e.target.checked } : adAccount,
    );
    setAdAccountsToShow(adAccountsToShowData);
  };

  const handleSubmit = (): void => {
    const selectedAdAccounts = adAccounts.filter(
      (adAccount) => 'isConnectedToCurrentOrg' in adAccount && adAccount.isConnectedToCurrentOrg,
    );
    const adAccountIds = selectedAdAccounts.map((adAccount) => adAccount.id);

    setIsPending(true);
    void updateOrganizationAdAccounts({ adAccountIds })
      .then((res) => {
        if (!res.success) {
          logger.error(res.error);
          const newURL = addOrReplaceURLParams(pathname, searchParams, errorKey, String(res.error));
          router.replace(newURL);
        }
        logger.info(res);
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        closeModal();
      });
  };

  return (
    <>
      {/* View button */}
      <Tooltip label={t('adAccounts')}>
        <ActionIcon variant="default" onClick={openModal}>
          <IconAd size={22} />
        </ActionIcon>
      </Tooltip>

      {/* Modal Contents */}
      <Modal
        opened={opened}
        onClose={closeModal}
        title={`${t('adAccounts')} (${props.integrationTitle})`}
        size="md"
        centered
      >
        <TextInput
          value={searchValue}
          onChange={(e) => {
            onSearchValueChanged(e);
          }}
          disabled={isPending}
          leftSection={<IconSearch size={16} />}
          rightSection={<CloseButton onClick={clearSearch} style={{ cursor: 'pointer' }} disabled={!searchValue} />}
          placeholder={tGeneric('search')}
          mb="lg"
        />
        <ScrollArea.Autosize offsetScrollbars type="always" mah={300}>
          {adAccountsToShow.length
            ? adAccountsToShow.map((adAccount) => {
                return (
                  <Flex align="center" key={adAccount.id} gap="sm" m="xs">
                    {isAdmin(userDetails.allRoles) ? (
                      <Checkbox
                        label={adAccount.name}
                        checked={'isConnectedToCurrentOrg' in adAccount ? adAccount.isConnectedToCurrentOrg : false}
                        onChange={(e) => {
                          toggleCheckbox(e, adAccount.id);
                        }}
                      />
                    ) : null}
                    <Text size="sm" c="dimmed" fs="italic">
                      ({format.number(adAccount.adCount)} {t('ads')})
                    </Text>
                  </Flex>
                );
              })
            : null}

          {!adAccountsToShow.length && !isPending ? (
            <Text size="sm" c="dimmed" fs="italic" ta="center">
              {t('noAdAccountsFound')}
            </Text>
          ) : null}
          {isPending ? <LoaderCentered /> : null}
        </ScrollArea.Autosize>

        {isAdmin(userDetails.allRoles) ? (
          <Button
            variant="filled"
            fullWidth
            disabled={_.isEqual(adAccounts, initialAdAccounts) || isPending}
            onClick={handleSubmit}
          >
            {tGeneric('submit')}
          </Button>
        ) : null}
      </Modal>
    </>
  );
}
