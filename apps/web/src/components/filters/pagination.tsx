import { type UrlObject } from 'node:url';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import React from 'react';
import { type SearchParams } from '@/app/[locale]/(logged-in)/insights/query-string-util';
import { PageSize } from '@/components/filters/page-size';
import { OrderBy } from '@/components/filters/order-by';
import { Order } from '@/components/filters/order';
import { type InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
}

interface PaginationProps {
  pageInfo: PageInfo;
  searchParams?: SearchParams;
  pageSize: number;
  orderBy: InsightsColumnsOrderBy;
  totalCount: number;
  page: number;
}

export default function Pagination({
  page,
  totalCount,
  pageSize,
  orderBy,
  searchParams,
}: PaginationProps): React.ReactElement {
  return (
    <div className="flex flex-col xl:flex-row">
      <Pages pageInfo={{ page, size: pageSize, totalElements: totalCount }} searchParams={searchParams} />
      <div className="flex w-full justify-center xl:justify-end">
        <PageSize pageSize={pageSize} />
        <OrderBy orderBy={orderBy} />
        <Order order={searchParams?.order ?? 'desc'} />
      </div>
    </div>
  );
}

interface PagesProps {
  pageInfo: PageInfo;
  searchParams?: SearchParams;
}

function Pages({ pageInfo, searchParams }: PagesProps): React.ReactElement {
  const t = useTranslations('Filters.Pagination');
  const totalPages = Math.ceil(pageInfo.totalElements / pageInfo.size);

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
      <div>{t('info', { ...pageInfo, totalPages })}</div>
      {pageInfo.page < totalPages && (
        <Link aria-label={t('prev')} href={getHref(pageInfo.page + 1)}>
          <ArrowRightIcon height={24} />
        </Link>
      )}
    </div>
  );
}
