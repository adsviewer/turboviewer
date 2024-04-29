import { useTranslations } from 'next-intl';
import React, { Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { InsightsColumnsGroupBy } from '@/graphql/generated/schema-server';
import AccountId from '@/app/[locale]/(logged-in)/insights/account-id';
import { GroupedByCheckbox } from '@/components/filters/grouped-checkbox';

export default function Filters(): React.ReactElement {
  const t = useTranslations('filters');

  return (
    <div>
      <h3>{t('title')}</h3>
      <Suspense fallback={<Fallback height={48} />}>
        <AccountId />
      </Suspense>
      <h4>{t('groupBy.groupedBy')}</h4>
      <GroupedByCheckbox
        label={t('account')}
        id="groupBy.adAccountId"
        groupByColumn={InsightsColumnsGroupBy.adAccountId}
      />
      <GroupedByCheckbox label={t('groupBy.adId')} id="groupBy.adId" groupByColumn={InsightsColumnsGroupBy.adId} />
      <GroupedByCheckbox
        label={t('groupBy.device')}
        id="groupBy.device"
        groupByColumn={InsightsColumnsGroupBy.device}
      />
      <GroupedByCheckbox label={t('groupBy.date')} id="groupBy.date" groupByColumn={InsightsColumnsGroupBy.date} />
      <GroupedByCheckbox
        label={t('groupBy.publisher')}
        id="groupBy.publisher"
        groupByColumn={InsightsColumnsGroupBy.publisher}
      />
      <GroupedByCheckbox
        label={t('groupBy.position')}
        id="groupBy.position"
        groupByColumn={InsightsColumnsGroupBy.position}
      />
    </div>
  );
}
