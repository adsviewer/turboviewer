import { getTranslations } from 'next-intl/server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import GroupedCheckbox from '@/components/filters/grouped-checkbox';

export default async function AccountId(): Promise<React.ReactElement> {
  const accounts = (await urqlClientSdk().adAccounts()).integrations.flatMap((integration) => integration.adAccounts);
  const t = await getTranslations('filters');
  return (
    <div>
      <div>{t('account')}</div>
      {accounts.map((account) => (
        <GroupedCheckbox
          key={account.id}
          label={account.name}
          id="filter.accountId"
          groupByColumn={account.id}
          groupKey="account"
        />
      ))}
    </div>
  );
}
