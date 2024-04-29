import { useTranslations } from 'next-intl';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';
import SearchParamsSelect from '@/components/filters/search-params-select';

export function OrderBy({ orderBy }: { orderBy: InsightsColumnsOrderBy }): React.ReactElement {
  const t = useTranslations('filters');
  return (
    <SearchParamsSelect label={t('orderByLabel')} defaultValue={orderBy} searchParamKey="orderBy">
      {[InsightsColumnsOrderBy.spend, InsightsColumnsOrderBy.impressions].map((value) => (
        <option key={value} value={value}>
          {t('orderByDropDown', { value })}
        </option>
      ))}
    </SearchParamsSelect>
  );
}
