import * as changeCase from 'change-case';
import { type FilterInsightsInputType } from '../schema/integrations/integration-types';

export const getOrganizationalInsights = (organizationId: string): string =>
  `organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = '${organizationId}')`;

export const lastInterval = (
  group: string,
  interval: FilterInsightsInputType['interval'],
  orderColumn: FilterInsightsInputType['orderBy'],
  isOrderByLastInterval: boolean,
): string =>
  `last_interval AS (SELECT ${group}, SUM(i.${orderColumn}) AS ${orderColumn}
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('${interval}', CURRENT_DATE - INTERVAL '1 ${interval}')
                                        AND date < DATE_TRUNC('${interval}', CURRENT_DATE)
                                      GROUP BY ${group}${isOrderByLastInterval ? ` ORDER BY SUM(${orderColumn} DESC LIMIT $3 OFFSET $4` : ''})`;

export const intervalBeforeLast = (group: string, interval: string, orderColumn: string): string =>
  `interval_before_last AS (SELECT ${group}, SUM(i.${orderColumn}) AS ${orderColumn}
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('${interval}', CURRENT_DATE - INTERVAL '2 ${interval}')
                                               AND date < DATE_TRUNC('${interval}', CURRENT_DATE - INTERVAL '1 ${interval}')
                                             GROUP BY ${group})`;

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
  return `WITH ${getOrganizationalInsights(organizationId)}, 
  ${lastInterval(joinedSnakeGroup, args.interval, args.orderBy, false)}, 
  ${intervalBeforeLast(joinedSnakeGroup, args.interval, args.orderBy)}, 
  ${orderColumnTrend(snakeGroup, args.orderBy, args.order, limit, offset)}
  SELECT ${snakeGroup.map((g) => `i.${g}`).join(', ')}, DATE_TRUNC('${args.interval}', i.date) interval_start, CAST(SUM(i.spend) AS NUMERIC) AS spend, CAST(SUM(i.impressions) AS NUMERIC) AS impressions 
  FROM organization_insights i ${joinFn(snakeGroup, 'order_column_trend', 'i')}
  WHERE i.date >= DATE_TRUNC('${args.interval}', CURRENT_DATE - INTERVAL '${String(args.dataPointsPerInterval)} ${args.interval}')
    AND i.date < DATE_TRUNC('${args.interval}', CURRENT_DATE)
  GROUP BY ${snakeGroup.map((g) => `i.${g}`).join(', ')}, interval_start, oct.trend
  ORDER BY oct.trend, interval_start DESC;`;
};

const abbreviateSnakeCase = (snakeCaseString: string) =>
  snakeCaseString
    .split('_')
    .map((word) => word[0])
    .join('');
