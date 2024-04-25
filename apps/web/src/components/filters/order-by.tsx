import { useTranslations } from 'next-intl';
import OrderBySelect from '@/components/filters/order-by-select';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

export function OrderBy({ orderBy }: { orderBy: InsightsColumnsOrderBy }): React.ReactElement {
  const t = useTranslations('Filters');
  return (
    <OrderBySelect orderByLabel={t('orderByLabel')} orderBy={orderBy}>
      {[InsightsColumnsOrderBy.spend, InsightsColumnsOrderBy.impressions].map((value) => (
        <option key={value} value={value}>
          {t('orderByDropDown', { value })}
        </option>
      ))}
    </OrderBySelect>
  );
}
