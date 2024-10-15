import { after, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { DeviceEnum, PublisherEnum } from '@repo/database';
import { addInterval } from '@repo/utils';
import {
  type FilterInsightsInputType,
  type InsightsColumnsGroupByType,
  type InsightsSearchExpression,
  InsightsSearchField,
  InsightsSearchOperator,
} from '@repo/channel-utils';
import { redisQuit } from '@repo/redis';
import {
  calculateDataPointsPerInterval,
  getInsightsDateFrom,
  getOrganizationalInsights,
  groupedInsights,
  intervalBeforeLast,
  lastInterval,
  orderColumnTrend,
  searchAdsToSQL,
} from '../src/insights-query-builder';

const getNoEmptyLines = (str: string): string =>
  str
    .replace(/\n\s*\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' '))
    .join('\n');

const assertSql = (actual: string, expected: string): void => {
  const actualNoEmptyLines = getNoEmptyLines(actual);
  const expectedNoEmptyLines = getNoEmptyLines(expected);
  assert.strictEqual(actualNoEmptyLines, expectedNoEmptyLines);
};

void describe('insights query builder tests', () => {
  void it('calculateDataPointsPerInterval no date week', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(undefined, undefined, 'week', 'en-GB');
    assert.equal(dataPointsPerInterval, 3);
  });
  void it('calculateDataPointsPerInterval no date day', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(undefined, undefined, 'day', 'en-GB');
    assert.equal(dataPointsPerInterval, 28);
  });
  void it('calculateDataPointsPerInterval no date month', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(undefined, undefined, 'month', 'en-GB');
    assert.equal(dataPointsPerInterval, 3);
  });
  void it('calculateDataPointsPerInterval no date quarter', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(undefined, undefined, 'quarter', 'en-GB');
    assert.equal(dataPointsPerInterval, 3);
  });
  void it('calculateDataPointsPerInterval 3 weeks exact', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(
      new Date('2024-08-05'),
      new Date('2024-08-26'),
      'week',
      'en-GB',
    );
    assert.equal(dataPointsPerInterval, 3);
  });
  void it('calculateDataPointsPerInterval 3 weeks exact en-US', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(
      new Date('2024-08-04'),
      new Date('2024-08-25'),
      'week',
      'en-US',
    );
    assert.equal(dataPointsPerInterval, 3);
  });
  void it('calculateDataPointsPerInterval 1 day before 3 weeks', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(
      new Date('2024-08-05'),
      new Date('2024-08-25'),
      'week',
      'en-GB',
    );
    assert.equal(dataPointsPerInterval, 3);
  });
  void it('calculateDataPointsPerInterval 3+ weeks more before', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(
      new Date('2024-08-03'),
      new Date('2024-08-26'),
      'week',
      'en-GB',
    );
    assert.equal(dataPointsPerInterval, 4);
  });
  void it('calculateDataPointsPerInterval 3+ weeks more before and after', () => {
    const dataPointsPerInterval = calculateDataPointsPerInterval(
      new Date('2024-08-03'),
      new Date('2024-08-27'),
      'week',
      'en-GB',
    );
    assert.equal(dataPointsPerInterval, 5);
  });
  void it('getInsightsDateFrom no range', () => {
    const dateFrom = getInsightsDateFrom(undefined, undefined, 3, 'day');
    assert.strictEqual(dateFrom, `AND i.date >= DATE_TRUNC('day', CURRENT_DATE - INTERVAL '2 day')`);
  });
  void it('getInsightsDateFrom onlyDateTo', () => {
    const dateFrom = getInsightsDateFrom(undefined, new Date('2024-05-15'), 3, 'day');
    assert.strictEqual(
      dateFrom,
      `AND i.date >= DATE_TRUNC('day', TIMESTAMP '2024-05-15T00:00:00.000Z' - INTERVAL '2 day')`,
    );
  });
  void it('getInsightsDateFrom onlyDateFrom back in the past', () => {
    const dateFrom = getInsightsDateFrom(new Date('2024-05-15'), undefined, 3, 'day');
    assert.strictEqual(dateFrom, `AND i.date >= DATE_TRUNC('day', TIMESTAMP '2024-05-15T00:00:00.000Z')`);
  });
  void it('getInsightsDateFrom onlyDateFrom recent past', () => {
    const date = addInterval(new Date(), 'day', -2);
    const dateFrom = getInsightsDateFrom(date, undefined, 3, 'day');
    assert.strictEqual(dateFrom, `AND i.date >= DATE_TRUNC('day', CURRENT_DATE - INTERVAL '2 day')`);
  });
  void it('getInsightsDateFrom bothDates back in the past', () => {
    const dateTo = new Date('2024-05-28');
    const dateFrom = getInsightsDateFrom(new Date('2024-01-15'), dateTo, 3, 'month');
    assert.strictEqual(dateFrom, `AND i.date >= TIMESTAMP '${new Date('2024-01-15').toISOString()}'`);
  });
  void it('getInsightsDateFrom bothDates recent past', () => {
    const dateTo = new Date('2024-05-28');
    const dateFrom = addInterval(dateTo, 'week', -2);
    const res = getInsightsDateFrom(dateFrom, dateTo, 3, 'week');
    assert.strictEqual(res, `AND i.date >= TIMESTAMP '${dateFrom.toISOString()}'`);
  });

  void it('get insights no filters', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend_rel',
      page: 1,
      pageSize: 10,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
    };

    const insights = getOrganizationalInsights('clwkdrdn7000008k708vfchyr', args, 3);
    assertSql(
      insights,
      `organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '2 week')
                                              )`,
    );
  });
  void it('get insights all filters', () => {
    const args: FilterInsightsInputType = {
      dateFrom: new Date('2024-04-01'),
      dateTo: new Date('2024-05-28'),
      devices: [DeviceEnum.MobileWeb, DeviceEnum.MobileApp],
      orderBy: 'spend_rel',
      page: 1,
      pageSize: 10,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      integrations: ['META'],
      order: 'desc',
      positions: ['feed'],
      publishers: [PublisherEnum.Facebook],
      search: {},
    };

    const insights = getOrganizationalInsights('clwkdrdn7000008k708vfchyr', args, 3);
    if (!args.dateFrom) return;
    assertSql(
      insights,
      `organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= TIMESTAMP '2024-04-01T00:00:00.000Z'
                                                AND i.date <= TIMESTAMP '2024-05-28T00:00:00.000Z'
                                                AND i.device IN ('MobileWeb', 'MobileApp')
                                                AND aa.type IN ('META')
                                                AND i.position IN ('feed')
                                                AND i.publisher IN ('Facebook')
                                              )`,
    );
  });
  void it('get insights integration single filter', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend_rel',
      page: 1,
      pageSize: 10,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      integrations: 'META',
      order: 'desc',
    };

    const insights = getOrganizationalInsights('clwkdrdn7000008k708vfchyr', args, 3);
    assertSql(
      insights,
      `organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '2 week')
                                                AND aa.type IN ('META')
                                              )`,
    );
  });

  void it('last interval and not order by it', () => {
    const insights = lastInterval('ad_id, publisher', 'week', 'spend_eur');
    assert.strictEqual(
      insights,
      `last_interval AS (SELECT ad_id, publisher, SUM(i.spend_eur) AS spend_eur
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
                                        AND date <= CURRENT_DATE
                                      GROUP BY ad_id, publisher)`,
    );
  });
  void it('last interval cpm as interval', () => {
    const insights = lastInterval('ad_id, publisher', 'week', 'cpm');
    assert.strictEqual(
      insights,
      `last_interval AS (SELECT ad_id, publisher, SUM(i.spend_eur) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
                                        AND date <= CURRENT_DATE
                                      GROUP BY ad_id, publisher HAVING SUM(i.impressions) > 0)`,
    );
  });
  void it('last interval date to filter', () => {
    const insights = lastInterval('ad_id, publisher', 'week', 'spend_eur', new Date('2024-05-28'));
    assert.strictEqual(
      insights,
      `last_interval AS (SELECT ad_id, publisher, SUM(i.spend_eur) AS spend_eur
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                        AND date <= TIMESTAMP '2024-05-28T00:00:00.000Z'
                                      GROUP BY ad_id, publisher)`,
    );
  });
  void it('intervalBeforeLast', () => {
    const insights = intervalBeforeLast('ad_id, publisher', 'week', 'spend_eur');
    assert.strictEqual(
      insights,
      `interval_before_last AS (SELECT ad_id, publisher, SUM(i.spend_eur) AS spend_eur
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
                                               AND date < DATE_TRUNC('week', CURRENT_DATE)
                                             GROUP BY ad_id, publisher
                                             )`,
    );
  });
  void it('intervalBeforeLast cpm trend', () => {
    const insights = intervalBeforeLast('ad_id, publisher', 'week', 'cpm');
    assert.strictEqual(
      insights,
      `interval_before_last AS (SELECT ad_id, publisher, SUM(i.spend_eur) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
                                               AND date < DATE_TRUNC('week', CURRENT_DATE)
                                             GROUP BY ad_id, publisher
                                             HAVING SUM(i.impressions) > 0)`,
    );
  });
  void it('intervalBeforeLast dateTo', () => {
    const insights = intervalBeforeLast('ad_id, publisher', 'week', 'spend_eur', new Date('2024-05-28'));
    assert.strictEqual(
      insights,
      `interval_before_last AS (SELECT ad_id, publisher, SUM(i.spend_eur) AS spend_eur
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '1 week')
                                               AND date < DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                             GROUP BY ad_id, publisher
                                             )`,
    );
  });
  void it('order column trend', () => {
    const insights = orderColumnTrend(['ad_id', 'publisher'], 'spend_eur', 'desc', 10, 20);
    assert.strictEqual(
      insights,
      `order_column_trend AS (SELECT li.ad_id, li.publisher, li.spend_eur / ibl.spend_eur::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.ad_id = ibl.ad_id AND li.publisher = ibl.publisher
                                      WHERE ibl.spend_eur
                                          > 0
                                      ORDER BY trend DESC
                                      LIMIT 10 OFFSET 20)`,
    );
  });
  void it('grouped insights', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend_rel',
      page: 1,
      pageSize: 10,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'asc',
    };

    const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(args.groupBy ?? []), 'currency'];
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId, 'en-GB', groupBy);
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '2 week')
                                              ),
  last_interval AS (SELECT ad_id, publisher, currency, SUM(i.spend_eur) AS spend_eur
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
                                         AND date <= CURRENT_DATE
                                      GROUP BY ad_id, publisher, currency),
  interval_before_last AS (SELECT ad_id, publisher, currency, SUM(i.spend_eur) AS spend_eur
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
                                               AND date < DATE_TRUNC('week', CURRENT_DATE)
                                             GROUP BY ad_id, publisher, currency
                                             ),
  order_column_trend AS (SELECT li.ad_id, li.publisher, li.currency, li.spend_eur / ibl.spend_eur::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.ad_id = ibl.ad_id AND li.publisher = ibl.publisher AND li.currency = ibl.currency
                                      WHERE ibl.spend_eur
                                          > 0
                                      ORDER BY trend
                                      LIMIT 11 OFFSET 0)
  SELECT i.ad_id, i.publisher, i.currency, DATE_TRUNC('week', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm 
  FROM organization_insights i JOIN order_column_trend oct ON i.ad_id = oct.ad_id AND i.publisher = oct.publisher AND i.currency = oct.currency
  WHERE i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '2 week')
    AND i.date <= DATE_TRUNC('week', CURRENT_DATE)
  GROUP BY i.ad_id, i.publisher, i.currency, interval_start, oct.trend
  ORDER BY oct.trend, interval_start;`,
    );
  });
  void it('grouped insights absolute order', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend_abs',
      page: 1,
      pageSize: 10,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
    };
    const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(args.groupBy ?? []), 'currency'];
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId, 'en-GB', groupBy);
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '2 week')
                                              )
  SELECT i.ad_id, i.publisher, i.currency, DATE_TRUNC('week', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm 
  FROM organization_insights i
  WHERE i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '2 week')
    AND i.date <= DATE_TRUNC('week', CURRENT_DATE)
  GROUP BY i.ad_id, i.publisher, i.currency, interval_start
  ORDER BY spend DESC, interval_start;`,
    );
  });
  void it('grouped insights with date filter', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend_rel',
      page: 1,
      pageSize: 10,
      dateFrom: new Date('2024-04-01'),
      dateTo: new Date('2024-05-28'),
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
    };
    const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(args.groupBy ?? []), 'currency'];
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId, 'en-GB', groupBy);
    if (!args.dateFrom) return;
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= TIMESTAMP '${args.dateFrom.toISOString()}'
                                                AND i.date <= TIMESTAMP '2024-05-28T00:00:00.000Z'
                                              ),
  last_interval AS (SELECT ad_id, publisher, currency, SUM(i.spend_eur) AS spend_eur
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                        AND date <= TIMESTAMP '2024-05-28T00:00:00.000Z'
                                      GROUP BY ad_id, publisher, currency),
  interval_before_last AS (SELECT ad_id, publisher, currency, SUM(i.spend_eur) AS spend_eur
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '1 week')
                                               AND date < DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                             GROUP BY ad_id, publisher, currency
                                             ),
  order_column_trend AS (SELECT li.ad_id, li.publisher, li.currency, li.spend_eur / ibl.spend_eur::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.ad_id = ibl.ad_id AND li.publisher = ibl.publisher AND li.currency = ibl.currency
                                      WHERE ibl.spend_eur
                                          > 0
                                      ORDER BY trend DESC
                                      LIMIT 11 OFFSET 0)
  SELECT i.ad_id, i.publisher, i.currency, DATE_TRUNC('week', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm 
  FROM organization_insights i JOIN order_column_trend oct ON i.ad_id = oct.ad_id AND i.publisher = oct.publisher AND i.currency = oct.currency
  WHERE i.date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '9 week')
    AND i.date <= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
  GROUP BY i.ad_id, i.publisher, i.currency, interval_start, oct.trend
  ORDER BY oct.trend DESC, interval_start;`,
    );
  });

  void it('grouped insights with date filter and day interval', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend_rel',
      page: 1,
      pageSize: 10,
      dateFrom: new Date('2024-09-27'),
      dateTo: new Date('2024-09-30'),
      groupBy: ['publisher'],
      interval: 'day',
      order: 'desc',
    };
    const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(args.groupBy ?? []), 'currency'];
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId, 'en-GB', groupBy);
    if (!args.dateFrom) return;
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= TIMESTAMP '${args.dateFrom.toISOString()}'
                                                AND i.date <= TIMESTAMP '2024-09-30T00:00:00.000Z'
                                              ),
  last_interval AS (SELECT publisher, currency, SUM(i.spend_eur) AS spend_eur
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('day', TIMESTAMP '2024-09-30T00:00:00.000Z')
                                        AND date <= TIMESTAMP '2024-09-30T00:00:00.000Z'
                                      GROUP BY publisher, currency),
  interval_before_last AS (SELECT publisher, currency, SUM(i.spend_eur) AS spend_eur
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('day', TIMESTAMP '2024-09-30T00:00:00.000Z' - INTERVAL '1 day')
                                               AND date < DATE_TRUNC('day', TIMESTAMP '2024-09-30T00:00:00.000Z')
                                             GROUP BY publisher, currency
                                             ),
  order_column_trend AS (SELECT li.publisher, li.currency, li.spend_eur / ibl.spend_eur::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.publisher = ibl.publisher AND li.currency = ibl.currency
                                      WHERE ibl.spend_eur
                                          > 0
                                      ORDER BY trend DESC
                                      LIMIT 11 OFFSET 0)
  SELECT i.publisher, i.currency, DATE_TRUNC('day', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm 
  FROM organization_insights i JOIN order_column_trend oct ON i.publisher = oct.publisher AND i.currency = oct.currency
  WHERE i.date >= DATE_TRUNC('day', TIMESTAMP '2024-09-30T00:00:00.000Z' - INTERVAL '4 day')
    AND i.date <= DATE_TRUNC('day', TIMESTAMP '2024-09-30T00:00:00.000Z')
  GROUP BY i.publisher, i.currency, interval_start, oct.trend
  ORDER BY oct.trend DESC, interval_start;`,
    );
  });

  void it('grouped insights with date filter where dateFrom starts midweek', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend_rel',
      page: 1,
      pageSize: 10,
      dateFrom: new Date('2024-09-25'),
      dateTo: new Date('2024-09-30'),
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
    };
    const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(args.groupBy ?? []), 'currency'];
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId, 'en-GB', groupBy);
    if (!args.dateFrom) return;
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= TIMESTAMP '${args.dateFrom.toISOString()}'
                                                AND i.date <= TIMESTAMP '2024-09-30T00:00:00.000Z'
                                              ),
  last_interval AS (SELECT ad_id, publisher, currency, SUM(i.spend_eur) AS spend_eur
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-09-30T00:00:00.000Z')
                                        AND date <= TIMESTAMP '2024-09-30T00:00:00.000Z'
                                      GROUP BY ad_id, publisher, currency),
  interval_before_last AS (SELECT ad_id, publisher, currency, SUM(i.spend_eur) AS spend_eur
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-09-30T00:00:00.000Z' - INTERVAL '1 week')
                                               AND date < DATE_TRUNC('week', TIMESTAMP '2024-09-30T00:00:00.000Z')
                                             GROUP BY ad_id, publisher, currency
                                             ),
  order_column_trend AS (SELECT li.ad_id, li.publisher, li.currency, li.spend_eur / ibl.spend_eur::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.ad_id = ibl.ad_id AND li.publisher = ibl.publisher AND li.currency = ibl.currency
                                      WHERE ibl.spend_eur
                                          > 0
                                      ORDER BY trend DESC
                                      LIMIT 11 OFFSET 0)
  SELECT i.ad_id, i.publisher, i.currency, DATE_TRUNC('week', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm 
  FROM organization_insights i JOIN order_column_trend oct ON i.ad_id = oct.ad_id AND i.publisher = oct.publisher AND i.currency = oct.currency
  WHERE i.date >= DATE_TRUNC('week', TIMESTAMP '2024-09-30T00:00:00.000Z' - INTERVAL '1 week')
    AND i.date <= DATE_TRUNC('week', TIMESTAMP '2024-09-30T00:00:00.000Z')
  GROUP BY i.ad_id, i.publisher, i.currency, interval_start, oct.trend
  ORDER BY oct.trend DESC, interval_start;`,
    );
  });

  void it('grouped insights where dateFrom and dateTo are within a week and dateFrom starts midweek', () => {
    const args: FilterInsightsInputType = {
      interval: 'week',
      dateFrom: new Date('2024-09-24T00:00:00.000Z'),
      dateTo: new Date('2024-09-29T00:00:00.000Z'),
      orderBy: 'spend_abs',
      pageSize: 10,
      order: 'desc',
      page: 1,
      groupBy: ['publisher'],
    };
    const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(args.groupBy ?? []), 'currency'];
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId, 'en-GB', groupBy);
    if (!args.dateFrom) return;
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= DATE_TRUNC('week', TIMESTAMP '2024-09-24T00:00:00.000Z')
                                                AND i.date <= TIMESTAMP '2024-09-29T00:00:00.000Z'
                                              )
  SELECT i.publisher, i.currency, DATE_TRUNC('week', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm 
  FROM organization_insights i
  WHERE i.date >= DATE_TRUNC('week', TIMESTAMP '2024-09-29T00:00:00.000Z' - INTERVAL '1 week')
    AND i.date <= DATE_TRUNC('week', TIMESTAMP '2024-09-29T00:00:00.000Z')
  GROUP BY i.publisher, i.currency, interval_start
  ORDER BY spend DESC, interval_start;`,
    );
  });

  void it('grouped insights with integrationGroupby filter', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend_rel',
      page: 1,
      pageSize: 10,
      dateFrom: new Date('2024-04-01'),
      dateTo: new Date('2024-05-28'),
      groupBy: ['adId', 'publisher', 'integration'],
      interval: 'week',
      order: 'desc',
    };
    const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(args.groupBy ?? []), 'currency'];
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId, 'en-GB', groupBy);
    if (!args.dateFrom) return;
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*, campaign_id, ad_set_id, aa.type integration
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_sets ase on a.ad_set_id = ase.id
                                                       JOIN campaigns c on ase.campaign_id = c.id
                                                       JOIN ad_accounts aa on c.ad_account_id = aa.id
                                                       JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                                              WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= TIMESTAMP '${args.dateFrom.toISOString()}'
                                                AND i.date <= TIMESTAMP '2024-05-28T00:00:00.000Z'
                                              ),
  last_interval AS (SELECT ad_id, publisher, integration, currency, SUM(i.spend_eur) AS spend_eur
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                        AND date <= TIMESTAMP '2024-05-28T00:00:00.000Z'
                                      GROUP BY ad_id, publisher, integration, currency),
  interval_before_last AS (SELECT ad_id, publisher, integration, currency, SUM(i.spend_eur) AS spend_eur
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '1 week')
                                               AND date < DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                             GROUP BY ad_id, publisher, integration, currency
                                             ),
  order_column_trend AS (SELECT li.ad_id, li.publisher, li.integration, li.currency, li.spend_eur / ibl.spend_eur::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.ad_id = ibl.ad_id AND li.publisher = ibl.publisher AND li.integration = ibl.integration AND li.currency = ibl.currency
                                      WHERE ibl.spend_eur
                                          > 0
                                      ORDER BY trend DESC
                                      LIMIT 11 OFFSET 0)
  SELECT i.ad_id, i.publisher, i.integration, i.currency, DATE_TRUNC('week', i.date) interval_start, SUM(i.spend) AS spend, SUM(i.impressions) AS impressions, SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm 
  FROM organization_insights i JOIN order_column_trend oct ON i.ad_id = oct.ad_id AND i.publisher = oct.publisher AND i.integration = oct.integration AND i.currency = oct.currency
  WHERE i.date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '9 week')
    AND i.date <= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
  GROUP BY i.ad_id, i.publisher, i.integration, i.currency, interval_start, oct.trend
  ORDER BY oct.trend DESC, interval_start;`,
    );
  });
});

void describe('searchAdsToSQL tests', () => {
  after(async () => {
    await redisQuit();
  });
  void it('should generate SQL for no expression', () => {
    const sql = searchAdsToSQL({});
    assert.strictEqual(sql, '');
  });

  void it('should generate SQL for a single term', () => {
    const expression: InsightsSearchExpression = {
      term: {
        field: InsightsSearchField.AdName,
        operator: InsightsSearchOperator.Contains,
        value: 'test',
      },
    };
    const sql = searchAdsToSQL(expression);
    assert.strictEqual(sql, "AND a.name ILIKE '%test%'");
  });

  void it('should generate SQL for AND expression', () => {
    const expression: InsightsSearchExpression = {
      and: [
        {
          term: {
            field: InsightsSearchField.AdName,
            operator: InsightsSearchOperator.Contains,
            value: 'test',
          },
        },
        {
          term: {
            field: InsightsSearchField.AccountName,
            operator: InsightsSearchOperator.Equals,
            value: 'account',
          },
        },
      ],
    };
    const sql = searchAdsToSQL(expression);
    assert.strictEqual(sql, "AND (a.name ILIKE '%test%' AND aa.name = 'account')");
  });

  void it('should generate SQL for OR expression', () => {
    const expression: InsightsSearchExpression = {
      or: [
        {
          term: {
            field: InsightsSearchField.AdName,
            operator: InsightsSearchOperator.Contains,
            value: 'test',
          },
        },
        {
          term: {
            field: InsightsSearchField.AccountName,
            operator: InsightsSearchOperator.Equals,
            value: 'account',
          },
        },
      ],
    };
    const sql = searchAdsToSQL(expression);
    assert.strictEqual(sql, "AND (a.name ILIKE '%test%' OR aa.name = 'account')");
  });

  void it('should generate SQL for nested expressions', () => {
    const expression: InsightsSearchExpression = {
      and: [
        {
          or: [
            {
              term: {
                field: InsightsSearchField.AdName,
                operator: InsightsSearchOperator.Contains,
                value: 'test',
              },
            },
            {
              term: {
                field: InsightsSearchField.CampaignName,
                operator: InsightsSearchOperator.Equals,
                value: 'account',
              },
            },
          ],
        },
        {
          term: {
            field: InsightsSearchField.AdSetName,
            operator: InsightsSearchOperator.StartsWith,
            value: 'start',
          },
        },
      ],
    };
    const sql = searchAdsToSQL(expression);
    assert.strictEqual(sql, "AND ((a.name ILIKE '%test%' OR c.name = 'account') AND ase.name ILIKE 'start%')");
  });

  void it('should generate SQL for nested expressions with nested null expression', () => {
    const expression: InsightsSearchExpression = {
      and: [
        {
          or: [
            {
              term: {
                field: InsightsSearchField.AdName,
                operator: InsightsSearchOperator.Contains,
                value: 'test',
              },
            },
          ],
        },
        {
          term: {
            field: InsightsSearchField.AdName,
            operator: InsightsSearchOperator.StartsWith,
            value: 'start',
          },
        },
      ],
    };
    const sql = searchAdsToSQL(expression);
    assert.strictEqual(sql, "AND ((a.name ILIKE '%test%') AND a.name ILIKE 'start%')");
  });

  void it('should generate SQL for nested expressions with nested null expression 2', () => {
    const expression: InsightsSearchExpression = {
      and: [
        {
          term: {
            field: InsightsSearchField.AdName,
            operator: InsightsSearchOperator.StartsWith,
            value: 'start',
          },
        },
      ],
    };
    const sql = searchAdsToSQL(expression);
    assert.strictEqual(sql, "AND (a.name ILIKE 'start%')");
  });

  void it('should generate SQL for search adName or adAccountName', () => {
    const expression: InsightsSearchExpression = {
      and: [],
      or: [
        {
          and: [],
          or: [],
          term: {
            value: 'asdf',
            field: InsightsSearchField.AdName,
            operator: InsightsSearchOperator.Contains,
          },
        },
        {
          and: [],
          or: [],
          term: {
            value: 'asdf',
            field: InsightsSearchField.AccountName,
            operator: InsightsSearchOperator.Contains,
          },
        },
      ],
    };
    const sql = searchAdsToSQL(expression);
    assert.strictEqual(sql, "AND (a.name ILIKE '%asdf%' OR aa.name ILIKE '%asdf%')");
  });
});
