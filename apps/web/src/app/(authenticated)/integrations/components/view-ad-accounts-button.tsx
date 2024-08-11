'use client';

import { ActionIcon, Modal, Tooltip, Text, Flex, ScrollArea, CloseButton, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAd, IconSearch } from '@tabler/icons-react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ChangeEvent, useState, type ReactNode } from 'react';
import { logger } from '@repo/logger';
import { type OrganizationAdAccountsQuery, type IntegrationType } from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';
import { getOrganizationAdAccounts } from '../../organization/actions';

interface PropsType {
  channel: IntegrationType;
  integrationTitle: string;
}

export default function ViewAdAccountsButton(props: PropsType): ReactNode {
  const t = useTranslations('integrations');
  const tGeneric = useTranslations('generic');
  const format = useFormatter();
  const [opened, { open, close }] = useDisclosure(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [adAccounts, setAdAccounts] = useState<OrganizationAdAccountsQuery['organizationAdAccounts']>([]);
  const [adAccountsToShow, setAdAccountsToShow] = useState<OrganizationAdAccountsQuery['organizationAdAccounts']>([]);
  const [searchValue, setSearchValue] = useState<string>('');

  const fetchAdAccounts = (): void => {
    setAdAccounts([]);
    setIsPending(true);

    void getOrganizationAdAccounts(props.channel)
      .then((res) => {
        if (res.error) {
          logger.error(res.error);
          return;
        }

        if (res.data) {
          setAdAccounts(res.data.organizationAdAccounts);
          setAdAccountsToShow(res.data.organizationAdAccounts);
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
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
  };

  const clearSearch = (): void => {
    setSearchValue('');
    setAdAccountsToShow(adAccounts);
  };

  const onSearchValueChanged = (e: ChangeEvent<HTMLInputElement>): void => {
    const searchFieldValue = e.target.value;
    setSearchValue(searchFieldValue);
    const data = adAccounts.filter((adAccount) => {
      return adAccount.name.toLowerCase().includes(searchFieldValue.toLowerCase());
    });
    setAdAccountsToShow(data);
  };

  return (
    <>
      {/* View button */}
      <Tooltip label={t('viewAdAccountsTitle')}>
        <ActionIcon variant="default" onClick={openModal}>
          <IconAd size={22} />
        </ActionIcon>
      </Tooltip>

      {/* View modal */}
      <Modal
        opened={opened}
        onClose={closeModal}
        title={`${t('viewAdAccountsTitle')} (${props.integrationTitle})`}
        size="md"
        centered
      >
        <TextInput
          value={searchValue}
          onChange={(e) => {
            onSearchValueChanged(e);
          }}
          leftSection={<IconSearch size={16} />}
          rightSection={<CloseButton onClick={clearSearch} style={{ cursor: 'pointer' }} disabled={!searchValue} />}
          placeholder={tGeneric('search')}
          mb="lg"
        />
        <ScrollArea.Autosize offsetScrollbars type="always" mah={300}>
          {adAccountsToShow.length
            ? adAccountsToShow.map((adAccount) => {
                return (
                  <Flex align="center" key={adAccount.id} gap="sm">
                    <Text>{adAccount.name}</Text>
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
      </Modal>
    </>
  );
}
