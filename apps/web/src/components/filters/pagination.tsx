import { type UrlObject } from 'node:url';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import React from 'react';
import { type SearchParams } from '@/app/[locale]/(logged-in)/insights/query-string-util';
import { PageSize } from '@/components/filters/page-size';
import { OrderBy } from '@/components/filters/order-by';
import { Order } from '@/components/filters/order';
import { type InsightsColumnsOrderBy, OrderBy as OrderByEnum } from '@/graphql/generated/schema-server';

export interface PageInfo {
  page: number;
  size: number;
  hasNext: boolean;
}

interface PaginationProps {
  pageInfo: PageInfo;
  searchParams?: SearchParams;
  orderBy: InsightsColumnsOrderBy;
}

export default function Pagination({ pageInfo, orderBy, searchParams }: PaginationProps): React.ReactElement {
  return (
    <div className="flex flex-col xl:flex-row">
      <Pages pageInfo={pageInfo} searchParams={searchParams} />
      <div className="flex w-full justify-center xl:justify-end">
        <PageSize pageSize={pageInfo.size} />
        <OrderBy orderBy={orderBy} />
        <Order order={searchParams?.order ?? OrderByEnum.desc} />
      </div>
    </div>
  );
}

interface PagesProps {
  pageInfo: PageInfo;
  searchParams?: SearchParams;
}

function Pages({ pageInfo, searchParams }: PagesProps): React.ReactElement {
  const t = useTranslations('filters.pagination');

  function getHref(page: number): UrlObject {
    return {
      query: { ...searchParams, page },
    };
  }

  return (
    <div className="flex items-center text-nowrap justify-center xl:justify-start">
      {pageInfo.page > 1 && (
        <Link aria-label={t('prev')} href={getHref(pageInfo.page - 1)}>
          <ArrowLeftIcon height={24} />
        </Link>
      )}
      <div>{t('info', { ...pageInfo })}</div>
      {pageInfo.hasNext ? (
        <Link aria-label={t('prev')} href={getHref(pageInfo.page + 1)}>
          <ArrowRightIcon height={24} />
        </Link>
      ) : null}
    </div>
  );
}
