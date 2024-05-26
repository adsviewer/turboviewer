import { useTranslations } from 'next-intl';
import SearchParamsSelect from '@/components/filters/search-params-select';
import { OrderBy } from '@/graphql/generated/schema-server';

export function Order({ order }: { order: OrderBy }): React.ReactElement {
  const t = useTranslations('filters');
  const types: OrderBy[] = [OrderBy.asc, OrderBy.desc];
  return (
    <SearchParamsSelect defaultValue={order} searchParamKey="order">
      {types.map((value) => (
        <option key={value} value={value}>
          {t('orderDropDown', { value })}
        </option>
      ))}
    </SearchParamsSelect>
  );
}
