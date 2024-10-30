import * as changeCase from 'change-case';
import { getCalendarDateDiffIn, getStartOfTheWeek, type IntervalType, isDateWithinInterval } from '@repo/utils';
import {
  type FilterInsightsInputType,
  type InsightsColumnsGroupByType,
  type InsightsSearchExpression,
  InsightsSearchOperator,
  type InsightsSearchTerm,
} from '@repo/channel-utils';

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
): string => {
  const intervalMapping = (): string => {
    if (interval === 'quarter') {
      return '3 months';
    }
    return `${String(dataPointsPerInterval - 1)} ${interval}`;
  };

  const mappedInterval = intervalMapping();

  if (!dateFrom && !dateTo) {
    return `AND i.date >= DATE_TRUNC('${interval}', CURRENT_DATE - INTERVAL '${mappedInterval}')`;
  }
  if (!dateFrom && dateTo) {
    return `AND i.date >= DATE_TRUNC('${interval}', TIMESTAMP '${dateTo.toISOString()}' - INTERVAL '${mappedInterval}')`;
  }
  if (dateFrom && !dateTo) {
    if (isDateWithinInterval(dateFrom, interval, new Date(), dataPointsPerInterval)) {
      return `AND i.date >= DATE_TRUNC('${interval}', CURRENT_DATE - INTERVAL '${mappedInterval}')`;
    }
    return `AND i.date >= DATE_TRUNC('${interval}', TIMESTAMP '${dateFrom.toISOString()}')`;
  }

  if (!dateFrom || !dateTo) return '';

  const isSameWeek = getStartOfTheWeek(dateFrom).getTime() === getStartOfTheWeek(dateTo).getTime();

  if (isSameWeek && dateFrom.getUTCDay() !== 1 && interval === 'week') {
    return `AND i.date >= DATE_TRUNC('${interval}', TIMESTAMP '${dateFrom.toISOString()}')`;
  }

  return `AND i.date >= TIMESTAMP '${dateFrom.toISOString()}'`;
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
  `organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = '${organizationId}'
                                                ${filter.search ? searchAdsToSQL(filter.search) : ''}
                                                ${filter.adAccountIds?.length ? `AND aa.id IN (${filter.adAccountIds.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${filter.adIds?.length ? `AND a.id IN (${filter.adIds.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${getInsightsDateFrom(filter.dateFrom, filter.dateTo, dataPointsPerInterval, filter.interval)}
                                                ${filter.dateTo ? `AND i.date <= TIMESTAMP '${filter.dateTo.toISOString()}'` : ''}
                                                ${filter.devices?.length ? `AND i.device IN (${filter.devices.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${
                                                  filter.integrations
                                                    ? `AND aa.type IN (${Array.isArray(filter.integrations) ? filter.integrations.map((i) => `'${i}'`).join(', ') : `'${filter.integrations}'`})`
                                                    : ''
                                                }
                                                ${filter.positions?.length ? `AND i.position IN (${filter.positions.map((i) => `'${i}'`).join(', ')})` : ''}
                                                ${filter.publishers?.length ? `AND i.publisher IN (${filter.publishers.map((i) => `'${i}'`).join(', ')})` : ''}
                                              )`;

export const lastInterval = (
  group: string,
  interval: FilterInsightsInputType['interval'],
  orderColumn: OrderByColumn,
  dateTo?: Date | null,
): string => {
  const date = dateTo ? `TIMESTAMP '${dateTo.toISOString()}'` : `CURRENT_DATE`;
  return `last_interval AS (SELECT ${group}, ${getSqlOrderColumn(orderColumn)}
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('${interval}', ${date})
                                        AND date <= ${date}
                                      GROUP BY ${group}${addHavingOnComputed(orderColumn)})`;
};

export const intervalBeforeLast = (
  group: string,
  interval: FilterInsightsInputType['interval'],
  orderColumn: OrderByColumn,
  dateTo?: Date | null,
): string => {
  const date = dateTo ? `TIMESTAMP '${dateTo.toISOString()}'` : `CURRENT_DATE`;
  const doubleIntervalInMonths = `1 ${interval}`;

  return `interval_before_last AS (SELECT ${group}, ${getSqlOrderColumn(orderColumn)}
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('${interval}', ${date} - INTERVAL '${doubleIntervalInMonths}')
                                               AND date < DATE_TRUNC('${interval}', ${date})
                                             GROUP BY ${group}${addHavingOnComputed(orderColumn)})`;
};

const joinFn = (columns: string[], table: string, left: string): string => {
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

  const intervalInMonths = interval === 'quarter' ? '3 months' : `1 ${interval}`;

  const sqlOrderColumn = getSqlOrderColumn(orderColumn, 'trend');

  return `order_column_trend AS (SELECT ${group}, ${sqlOrderColumn}
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('${interval}', ${date} - INTERVAL '${intervalInMonths}')
                                        AND date <= DATE_TRUNC('${interval}', ${date})
                                      GROUP BY ${group}${addHavingOnComputed(orderColumn)}
                                      ORDER BY trend${trend === 'desc' ? ' DESC' : ''}
                                      LIMIT ${String(limit)} OFFSET ${String(offset)})`;
};

const getInterval = (interval: string, dataPointsPerInterval: number): string => {
  if (interval === 'quarter') {
    return `${String(dataPointsPerInterval * 3)} months`;
  }
  return `${String(dataPointsPerInterval)} ${interval}`; // Default case
};

export const groupedInsights = (
  args: FilterInsightsInputType,
  organizationId: string,
  locale: string,
  groupBy: (InsightsColumnsGroupByType | 'currency')[],
): string => {
  const dataPointsPerInterval = calculateDataPointsPerInterval(args.dateFrom, args.dateTo, args.interval, locale);
  const orderBy = getOrderByColumn(args.orderBy);
  const isRelative =
    args.orderBy === 'spend_rel' ||
    args.orderBy === 'impressions_rel' ||
    args.orderBy === 'cpm_rel' ||
    args.orderBy === 'cpc_rel';
  const snakeGroup = groupBy.map((group) => changeCase.snakeCase(group));
  const joinedSnakeGroup = snakeGroup.join(', ');
  const limit = args.pageSize + 1;
  const offset = (args.page - 1) * args.pageSize;
  const date = args.dateTo ? `TIMESTAMP '${args.dateTo.toISOString()}'` : `CURRENT_DATE`;
  let adjustedDatapoints = dataPointsPerInterval;
  if (!args.dateFrom && !args.dateTo) adjustedDatapoints = dataPointsPerInterval - 1;

  const dateInterval = getInterval(args.interval, adjustedDatapoints);

  const sql = `WITH ${getOrganizationalInsights(organizationId, args, dataPointsPerInterval)},
  ${isRelative ? `${lastInterval(joinedSnakeGroup, args.interval, orderBy, args.dateTo)},` : ''}
  ${isRelative ? `${intervalBeforeLast(joinedSnakeGroup, args.interval, orderBy, args.dateTo)},` : ''}
  ${isRelative ? orderColumnTrend(snakeGroup, orderBy, args.order, limit, offset) : orderColumnTrendAbsolute(joinedSnakeGroup, args.interval, orderBy, args.order, limit, offset, args.dateTo)}
  SELECT ${snakeGroup.map((g) => `i.${g}`).join(', ')}, DATE_TRUNC('${args.interval}', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.clicks) AS clicks, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm, SUM(i.spend) * 10 / NULLIF(SUM(i.clicks::decimal), 0) AS cpc 
  FROM organization_insights i
  ${joinFn(snakeGroup, 'order_column_trend', 'i')}
  WHERE i.date >= DATE_TRUNC('${args.interval}', ${date} - INTERVAL '${dateInterval}')
    AND i.date <= DATE_TRUNC('${args.interval}', ${date})
  GROUP BY ${snakeGroup.map((g) => `i.${g}`).join(', ')}, interval_start, oct.trend
  ORDER BY oct.trend${args.order === 'desc' ? ' DESC' : ''}, interval_start;`;

  return sql.replace(/\n\s*\n/g, '\n');
};

const abbreviateSnakeCase = (snakeCaseString: string): string =>
  snakeCaseString
    .split('_')
    .map((word) => word[0])
    .join('');

type OrderByColumn = 'cpm' | 'spend_eur' | 'impressions' | 'cpc' | 'clicks';
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
    case 'cpc_abs': {
      return 'cpc';
    }
    case 'cpc_rel': {
      return 'cpc';
    }
    case 'clicks_abs': {
      return 'clicks';
    }
    case 'clicks_rel': {
      return 'clicks';
    }
  }
};

const getSqlOrderColumn = (
  orderColumn: 'cpm' | 'spend_eur' | 'impressions' | 'cpc' | 'clicks',
  columnName?: string,
): string => {
  switch (orderColumn) {
    case 'cpm':
      return `SUM(i.spend_eur) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS ${columnName ?? 'cpm'}`;
    case 'cpc':
      return `SUM(i.spend_eur) * 10 / NULLIF(SUM(i.clicks::decimal), 0) AS ${columnName ?? 'cpc'}`;
    default:
      return `SUM(i.${orderColumn}) AS ${columnName ?? orderColumn}`;
  }
};

const addHavingOnComputed = (orderColumn: 'cpm' | 'spend_eur' | 'impressions' | 'cpc' | 'clicks'): string => {
  switch (orderColumn) {
    case 'cpm':
      return ' HAVING SUM(i.impressions) > 0';
    case 'cpc':
      return ' HAVING SUM(i.clicks) > 0';
    default:
      return '';
  }
};
