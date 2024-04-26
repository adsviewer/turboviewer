import { useTranslations } from 'next-intl';
import GroupedCheckbox from '@/components/filters/grouped-checkbox';
import { InsightsColumnsGroupBy } from '@/graphql/generated/schema-server';

export default function Filters(): React.ReactElement {
  const t = useTranslations('filters');

  return (
    <div>
      <h3>{t('title')}</h3>
      <h4>{t('groupBy.groupedBy')}</h4>
      <GroupedCheckbox label={t('groupBy.adId')} id="groupBy.adId" groupByColumn={InsightsColumnsGroupBy.adId} />
      <GroupedCheckbox label={t('groupBy.device')} id="groupBy.device" groupByColumn={InsightsColumnsGroupBy.device} />
      <GroupedCheckbox label={t('groupBy.date')} id="groupBy.date" groupByColumn={InsightsColumnsGroupBy.date} />
      <GroupedCheckbox
        label={t('groupBy.publisher')}
        id="groupBy.publisher"
        groupByColumn={InsightsColumnsGroupBy.publisher}
      />
      <GroupedCheckbox
        label={t('groupBy.position')}
        id="groupBy.position"
        groupByColumn={InsightsColumnsGroupBy.position}
      />
    </div>
  );
}
