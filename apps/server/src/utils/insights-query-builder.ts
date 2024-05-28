import * as changeCase from 'change-case';
import { type IntervalType, isDateWithinInterval } from '@repo/utils';
import {
  type FilterInsightsInputType,
  type InsightsDatapointsInputType,
} from '../schema/integrations/integration-types';

export const getInsightsDateFrom = (
  dateFrom: Date | undefined | null,
  dateTo: Date | undefined | null,
  dataPointsPerInterval: number,
  interval: IntervalType,
) => {
  if (!dateFrom && !dateTo)
    return `AND i.date >= DATE_TRUNC('${interval}', CURRENT_DATE - INTERVAL '${String(dataPointsPerInterval)} ${interval}')`;
  if (!dateFrom && dateTo)
    return `AND i.date >= DATE_TRUNC('${interval}', TIMESTAMP '${dateTo.toISOString()}' - INTERVAL '${String(dataPointsPerInterval)} ${interval}')`;
  if (dateFrom && !dateTo) {
    if (isDateWithinInterval(dateFrom, interval, new Date(), dataPointsPerInterval)) {
      return `AND i.date >= DATE_TRUNC('${interval}', CURRENT_DATE - INTERVAL '${String(dataPointsPerInterval)} ${interval}')`;
    }
    return `AND i.date >= DATE_TRUNC('${interval}', TIMESTAMP '${dateFrom.toISOString()}')`;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- dates are defined
  if (isDateWithinInterval(dateFrom!, interval, dateTo!, dataPointsPerInterval)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- dates are defined
    return `AND i.date >= DATE_TRUNC('${interval}', TIMESTAMP '${dateTo!.toISOString()}' - INTERVAL '${String(dataPointsPerInterval)} ${interval}')`;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- dates are defined
  return `AND i.date >= DATE_TRUNC('${interval}', TIMESTAMP '${dateFrom!.toISOString()}')`;
};

export const getOrganizationalInsights = (organizationId: string, filter: FilterInsightsInputType): string =>
  `organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = '${organizationId}'
                                                ${filter.adAccountIds ? `AND aa.id IN (${filter.adAccountIds.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${filter.adIds ? `AND a.id IN (${filter.adIds.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${getInsightsDateFrom(filter.dateFrom, filter.dateTo, filter.dataPointsPerInterval, filter.interval)}
                                                ${filter.dateTo ? `AND i.date < TIMESTAMP '${filter.dateTo.toISOString()}'` : ''}
                                                ${filter.devices ? `AND i.device IN (${filter.devices.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${filter.positions ? `AND i.position IN (${filter.positions.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${filter.publishers ? `AND i.publisher IN (${filter.publishers.map((i) => `'${i}'`).join(', ')})` : ''}
                                              )`;

export const lastInterval = (
  group: string,
  interval: FilterInsightsInputType['interval'],
  orderColumn: FilterInsightsInputType['orderBy'],
  isOrderByLastInterval: boolean,
  dateTo?: Date | null,
): string => {
  const date = dateTo ? `TIMESTAMP '${dateTo.toISOString()}'` : `CURRENT_DATE`;
  return `last_interval AS (SELECT ${group}, SUM(i.${orderColumn}) AS ${orderColumn}
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('${interval}', ${date} - INTERVAL '1 ${interval}')
                                        AND date < DATE_TRUNC('${interval}', ${date})
                                      GROUP BY ${group}${isOrderByLastInterval ? ` ORDER BY SUM(${orderColumn} DESC LIMIT $3 OFFSET $4` : ''})`;
};

export const intervalBeforeLast = (
  group: string,
  interval: string,
  orderColumn: string,
  dateTo?: Date | null,
): string => {
  const date = dateTo ? `TIMESTAMP '${dateTo.toISOString()}'` : `CURRENT_DATE`;
  return `interval_before_last AS (SELECT ${group}, SUM(i.${orderColumn}) AS ${orderColumn}
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('${interval}', ${date} - INTERVAL '2 ${interval}')
                                               AND date < DATE_TRUNC('${interval}', ${date} - INTERVAL '1 ${interval}')
                                             GROUP BY ${group})`;
};

const joinFn = (columns: string[], table: string, left: string) => {
  const right = abbreviateSnakeCase(table);
  return `JOIN ${table} ${right} ON ${columns.map((column) => `${left}.${column} = ${right}.${column}`).join(' AND ')}`;
};

export const orderColumnTrend = (
  group: string[],
  orderColumn: string,
  trend: 'asc' | 'desc' | null | undefined,
  limit: number,
  offset: number,
): string => {
  const intervalBeforeLastStr = 'interval_before_last';
  const lastIntervalStr = 'last_interval';
  const li = abbreviateSnakeCase(lastIntervalStr);
  const ibl = abbreviateSnakeCase(intervalBeforeLastStr);
  const join = joinFn(group, intervalBeforeLastStr, li);
  return `order_column_trend AS (SELECT ${group.map((g) => `${li}.${g}`).join(', ')}, ${li}.${orderColumn} / ${ibl}.${orderColumn}::decimal trend
                                      FROM last_interval ${li} ${join}
                                      WHERE ${ibl}.${orderColumn}
                                          > 0
                                      ORDER BY trend${trend === 'asc' ? ' DESC' : ''}
                                      LIMIT ${String(limit)} OFFSET ${String(offset)})`;
};

export const groupedInsights = (args: FilterInsightsInputType, organizationId: string) => {
  const groupBy = [...(args.groupBy ?? []), 'currency'];
  const snakeGroup = groupBy.map((group) => changeCase.snakeCase(group));
  const joinedSnakeGroup = snakeGroup.join(', ');
  const limit = args.pageSize;
  const offset = (args.page - 1) * args.pageSize;
  const date = args.dateTo ? `TIMESTAMP '${args.dateTo.toISOString()}'` : `CURRENT_DATE`;
  return `WITH ${getOrganizationalInsights(organizationId, args)}, 
  ${lastInterval(joinedSnakeGroup, args.interval, args.orderBy, false, args.dateTo)},
  ${intervalBeforeLast(joinedSnakeGroup, args.interval, args.orderBy, args.dateTo)},
  ${orderColumnTrend(snakeGroup, args.orderBy, args.order, limit, offset)}
  SELECT ${snakeGroup.map((g) => `i.${g}`).join(', ')}, DATE_TRUNC('${args.interval}', i.date) interval_start, CAST(SUM(i.spend) AS NUMERIC) AS spend, CAST(SUM(i.impressions) AS NUMERIC) AS impressions 
  FROM organization_insights i ${joinFn(snakeGroup, 'order_column_trend', 'i')}
  WHERE i.date >= DATE_TRUNC('${args.interval}', ${date} - INTERVAL '${String(args.dataPointsPerInterval)} ${args.interval}')
    AND i.date < DATE_TRUNC('${args.interval}', ${date})
  GROUP BY ${snakeGroup.map((g) => `i.${g}`).join(', ')}, interval_start, oct.trend
  ORDER BY oct.trend, interval_start DESC;`;
};

export const insightsDatapoints = (args: InsightsDatapointsInputType, organizationId: string) =>
  `SELECT DATE_TRUNC('${args.interval}', i.date) AS date,
          CAST(SUM(i.spend) AS NUMERIC)          AS spend,
          CAST(SUM(i.impressions) AS NUMERIC)    AS impressions
   FROM insights i
            JOIN ads a on i.ad_id = a.id
            JOIN ad_accounts aa on a.ad_account_id = aa.id
            JOIN integrations int on aa.integration_id = int.id
   WHERE int.organization_id = '${organizationId}'
     AND i.date >= DATE_TRUNC('${args.interval}', TIMESTAMP '${args.dateFrom.toISOString()}')
     AND i.date < DATE_TRUNC('${args.interval}', TIMESTAMP '${args.dateTo.toISOString()}')
       ${args.adAccountId ? `AND i.ad_account_id = '${args.adAccountId}'` : ''}
           ${args.adId ? `AND i.ad_id = '${args.adId}'` : ''}
           ${args.device ? `AND i.device = '${args.device}'` : ''}
           ${args.position ? `AND i.position = '${args.position}'` : ''}
           ${args.publisher ? `AND i.publisher = '${args.publisher}'` : ''}
   GROUP BY date
   ORDER BY date DESC;`;

const abbreviateSnakeCase = (snakeCaseString: string) =>
  snakeCaseString
    .split('_')
    .map((word) => word[0])
    .join('');
