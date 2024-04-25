import { useTranslations } from 'next-intl';
import OrderBySelect from '@/components/filters/order-by-select';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

export function OrderBy({ orderBy }: { orderBy: InsightsColumnsOrderBy }): React.ReactElement {
  const t = useTranslations('Filters');
  return (
    <div className="flex justify-end">
      <OrderBySelect orderBy={orderBy}>
        {[InsightsColumnsOrderBy.spend, InsightsColumnsOrderBy.impressions].map((value) => (
          <option key={value} value={value}>
            {t('orderBy', { value })}
          </option>
        ))}
      </OrderBySelect>
    </div>
  );
}
