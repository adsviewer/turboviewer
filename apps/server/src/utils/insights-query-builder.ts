import * as changeCase from 'change-case';
import { getCalendarDateDiffIn, type IntervalType, isDateWithinInterval } from '@repo/utils';
import {
  type FilterInsightsInputType,
  type InsightsDatapointsInputType,
} from '../schema/integrations/integration-types';
import { type InsightsSearchExpression, InsightsSearchOperator, type InsightsSearchTerm } from '../contexts/insights';

export const calculateDataPointsPerInterval = (
  dateFrom: Date | null | undefined,
  dateTo: Date | null | undefined,
  interval: IntervalType,
  locale: string,
): number => {
  if (!dateFrom) {
    switch (interval) {
      case 'week':
        return 3;
      case 'month':
        return 3;
      case 'quarter':
        return 3;
      case 'day':
        return 28;
      default:
        return 3;
    }
  }
  const newDateTo = dateTo ?? new Date();
  return Math.ceil(getCalendarDateDiffIn(interval, dateFrom, newDateTo, locale));
};

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
  return `AND i.date >= DATE_TRUNC('${interval}', TIMESTAMP '${dateTo!.toISOString()}' - INTERVAL '${String(dataPointsPerInterval)} ${interval}')`;
};

export const searchAdsToSQL = (expression: InsightsSearchExpression): string => {
  const evaluateTerm = (term: InsightsSearchTerm): string => {
    const field = term.field;
    const value = term.value;
    switch (term.operator) {
      case InsightsSearchOperator.Contains:
        return `${field} ILIKE '%${value}%'`;
      case InsightsSearchOperator.StartsWith:
        return `${field} ILIKE '${value}%'`;
      case InsightsSearchOperator.Equals:
        return `${field} = '${value}'`;
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- intentional
        throw new Error(`Unknown operator: ${term.operator}`);
    }
  };

  const evaluateExpression = (expr: InsightsSearchExpression): string | null => {
    if (expr.term) {
      return evaluateTerm(expr.term);
    }
    if (expr.and && expr.and.length !== 0) {
      return `(${expr.and
        .flatMap((subExpr) => {
          const evaluatedExpr = evaluateExpression(subExpr);
          return evaluatedExpr ? [evaluatedExpr] : [];
        })
        .join(' AND ')})`;
    }
    if (expr.or && expr.or.length !== 0) {
      return `(${expr.or
        .flatMap((subExpr) => {
          const evaluatedExpr = evaluateExpression(subExpr);
          return evaluatedExpr ? [evaluatedExpr] : [];
        })
        .join(' OR ')})`;
    }
    return null; // Default condition when no expression is provided
  };

  const evaluatedExpr = evaluateExpression(expression);
  return evaluatedExpr ? `AND ${evaluatedExpr}` : '';
};

export const getOrganizationalInsights = (
  organizationId: string,
  filter: FilterInsightsInputType,
  dataPointsPerInterval: number,
): string =>
  `organization_insights AS (SELECT i.*, campaign_id, ad_set_id
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = '${organizationId}'
                                                ${filter.search ? searchAdsToSQL(filter.search) : ''}
                                                ${getInsightsDateFrom(filter.dateFrom, filter.dateTo, dataPointsPerInterval, filter.interval)}
                                                ${filter.dateTo ? `AND i.date < TIMESTAMP '${filter.dateTo.toISOString()}'` : ''}
                                                ${filter.devices ? `AND i.device IN (${filter.devices.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${filter.positions ? `AND i.position IN (${filter.positions.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${filter.publishers ? `AND i.publisher IN (${filter.publishers.map((i) => `'${i}'`).join(', ')})` : ''}
                                              )`;

export const lastInterval = (
  group: string,
  interval: FilterInsightsInputType['interval'],
  orderColumn: OrderByColumn,
  dateTo?: Date | null,
): string => {
  const date = dateTo ? `TIMESTAMP '${dateTo.toISOString()}'` : `CURRENT_DATE`;
  const sqlOrderColumn =
    orderColumn === 'cpm'
      ? 'SUM(i.spend_eur) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm'
      : `SUM(i.${orderColumn}) AS ${orderColumn}`;
  const relative = orderColumn === 'cpm' ? ' HAVING SUM(i.impressions) > 0' : '';
  return `last_interval AS (SELECT ${group}, ${sqlOrderColumn}
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('${interval}', ${date} - INTERVAL '1 ${interval}')
                                        AND date < DATE_TRUNC('${interval}', ${date})
                                      GROUP BY ${group}${relative})`;
};

export const intervalBeforeLast = (
  group: string,
  interval: FilterInsightsInputType['interval'],
  orderColumn: OrderByColumn,
  dateTo?: Date | null,
): string => {
  const date = dateTo ? `TIMESTAMP '${dateTo.toISOString()}'` : `CURRENT_DATE`;
  const sqlOrderColumn =
    orderColumn === 'cpm'
      ? 'SUM(i.spend_eur) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm'
      : `SUM(i.${orderColumn}) AS ${orderColumn}`;
  return `interval_before_last AS (SELECT ${group}, ${sqlOrderColumn}
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('${interval}', ${date} - INTERVAL '2 ${interval}')
                                               AND date < DATE_TRUNC('${interval}', ${date} - INTERVAL '1 ${interval}')
                                             GROUP BY ${group}
                                             ${orderColumn === 'cpm' ? 'HAVING SUM(i.impressions) > 0' : ''})`;
};

const joinFn = (columns: string[], table: string, left: string) => {
  const right = abbreviateSnakeCase(table);
  return `JOIN ${table} ${right} ON ${columns.map((column) => `${left}.${column} = ${right}.${column}`).join(' AND ')}`;
};

export const orderColumnTrend = (
  group: string[],
  orderColumn: OrderByColumn,
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
                                      ORDER BY trend${trend === 'desc' ? ' DESC' : ''}
                                      LIMIT ${String(limit)} OFFSET ${String(offset)})`;
};

export const orderColumnTrendAbsolute = (
  group: string,
  interval: FilterInsightsInputType['interval'],
  orderColumn: OrderByColumn,
  trend: 'asc' | 'desc' | null | undefined,
  limit: number,
  offset: number,
  dateTo?: Date | null,
): string => {
  const date = dateTo ? `TIMESTAMP '${dateTo.toISOString()}'` : `CURRENT_DATE`;
  const sqlOrderColumn =
    orderColumn === 'cpm'
      ? 'SUM(i.spend_eur) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS trend'
      : `SUM(i.${orderColumn}) AS trend`;
  return `order_column_trend AS (SELECT ${group}, ${sqlOrderColumn}
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('${interval}', ${date} - INTERVAL '1 ${interval}')
                                        AND date < DATE_TRUNC('${interval}', ${date})
                                      GROUP BY ${group}
                                      ${orderColumn === 'cpm' ? ' HAVING SUM(i.impressions) > 0' : ''}
                                      ORDER BY trend${trend === 'desc' ? ' DESC' : ''}
                                      LIMIT ${String(limit)} OFFSET ${String(offset)})`;
};

export const groupedInsights = (args: FilterInsightsInputType, organizationId: string, locale: string) => {
  const dataPointsPerInterval = calculateDataPointsPerInterval(args.dateFrom, args.dateTo, args.interval, locale);
  const groupBy = [...(args.groupBy ?? []), 'currency'];
  const orderBy = getOrderByColumn(args.orderBy);
  const isRelative = args.orderBy === 'spend_rel' || args.orderBy === 'impressions_rel' || args.orderBy === 'cpm_rel';
  const snakeGroup = groupBy.map((group) => changeCase.snakeCase(group));
  const joinedSnakeGroup = snakeGroup.join(', ');
  const limit = args.pageSize + 1;
  const offset = (args.page - 1) * args.pageSize;
  const date = args.dateTo ? `TIMESTAMP '${args.dateTo.toISOString()}'` : `CURRENT_DATE`;

  const sql = `WITH ${getOrganizationalInsights(organizationId, args, dataPointsPerInterval)}, 
  ${isRelative ? `${lastInterval(joinedSnakeGroup, args.interval, orderBy, args.dateTo)},` : ''}
  ${isRelative ? `${intervalBeforeLast(joinedSnakeGroup, args.interval, orderBy, args.dateTo)},` : ''}
  ${isRelative ? orderColumnTrend(snakeGroup, orderBy, args.order, limit, offset) : orderColumnTrendAbsolute(joinedSnakeGroup, args.interval, orderBy, args.order, limit, offset, args.dateTo)}
  SELECT ${snakeGroup.map((g) => `i.${g}`).join(', ')}, DATE_TRUNC('${args.interval}', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm 
  FROM organization_insights i ${joinFn(snakeGroup, 'order_column_trend', 'i')}
  WHERE i.date >= DATE_TRUNC('${args.interval}', ${date} - INTERVAL '${String(dataPointsPerInterval)} ${args.interval}')
    AND i.date < DATE_TRUNC('${args.interval}', ${date})
  GROUP BY ${snakeGroup.map((g) => `i.${g}`).join(', ')}, interval_start, oct.trend
  ORDER BY oct.trend${args.order === 'desc' ? ' DESC' : ''}, interval_start;`;

  return sql.replace(/\n\s*\n/g, '\n');
};

export const insightsDatapoints = (args: InsightsDatapointsInputType, organizationId: string) =>
  `SELECT DATE_TRUNC('${args.interval}', i.date)                     AS date,
          SUM(i.spend)                                               AS spend,
          SUM(i.impressions)                                         AS impressions,
          SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm
   FROM insights i
            JOIN ads a on i.ad_id = a.id
            JOIN ad_sets ase on a.ad_set_id = ase.id
            JOIN campaigns c on ase.campaign_id = c.id
            JOIN ad_accounts aa on c.ad_account_id = aa.id
            JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
   WHERE ao."B" = '${organizationId}'
     AND i.date >= DATE_TRUNC('${args.interval}', TIMESTAMP '${args.dateFrom.toISOString()}')
     AND i.date < DATE_TRUNC('${args.interval}', TIMESTAMP '${args.dateTo.toISOString()}')
       ${args.adAccountId ? `AND c.ad_account_id = '${args.adAccountId}'` : ''}
           ${args.adId ? `AND i.ad_id = '${args.adId}'` : ''}
           ${args.adSetId ? `AND a.ad_set_id = '${args.adSetId}'` : ''}
           ${args.campaignId ? `AND ase.campaign_id = '${args.campaignId}'` : ''}
           ${args.device ? `AND i.device = '${args.device}'` : ''}
           ${args.position ? `AND i.position = '${args.position}'` : ''}
           ${args.publisher ? `AND i.publisher = '${args.publisher}'` : ''}
   GROUP BY date
   HAVING SUM(i.impressions) > 0
   ORDER BY date;`;

const abbreviateSnakeCase = (snakeCaseString: string) =>
  snakeCaseString
    .split('_')
    .map((word) => word[0])
    .join('');

type OrderByColumn = 'cpm' | 'spend_eur' | 'impressions';
const getOrderByColumn = (orderBy: FilterInsightsInputType['orderBy']): OrderByColumn => {
  switch (orderBy) {
    case 'spend_abs': {
      return 'spend_eur';
    }
    case 'spend_rel': {
      return 'spend_eur';
    }
    case 'impressions_abs': {
      return 'impressions';
    }
    case 'impressions_rel': {
      return 'impressions';
    }
    case 'cpm_abs': {
      return 'cpm';
    }
    case 'cpm_rel': {
      return 'cpm';
    }
  }
};
