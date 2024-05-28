import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { DeviceEnum, PublisherEnum } from '@repo/database';
import { addInterval } from '@repo/utils';
import type {
  FilterInsightsInputType,
  InsightsDatapointsInputType,
} from '../../src/schema/integrations/integration-types';
import {
  getInsightsDateFrom,
  getOrganizationalInsights,
  groupedInsights,
  insightsDatapoints,
  lastInterval,
  orderColumnTrend,
} from '../../src/utils/insights-query-builder';

const getNoEmptyLines = (str: string) =>
  str
    .replace(/\n\s*\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' '))
    .join('\n');

const assertSql = (actual: string, expected: string) => {
  const actualNoEmptyLines = getNoEmptyLines(actual);
  const expectedNoEmptyLines = getNoEmptyLines(expected);
  assert.strictEqual(actualNoEmptyLines, expectedNoEmptyLines);
};

void describe('insights query builder tests', () => {
  void it('getInsightsDateFrom no range', () => {
    const dateFrom = getInsightsDateFrom(undefined, undefined, 3, 'day');
    assert.strictEqual(dateFrom, `AND i.date >= DATE_TRUNC('day', CURRENT_DATE - INTERVAL '3 day')`);
  });
  void it('getInsightsDateFrom onlyDateTo', () => {
    const dateFrom = getInsightsDateFrom(undefined, new Date('2024-05-15'), 3, 'day');
    assert.strictEqual(
      dateFrom,
      `AND i.date >= DATE_TRUNC('day', TIMESTAMP '2024-05-15T00:00:00.000Z' - INTERVAL '3 day')`,
    );
  });
  void it('getInsightsDateFrom onlyDateFrom back in the past', () => {
    const dateFrom = getInsightsDateFrom(new Date('2024-05-15'), undefined, 3, 'day');
    assert.strictEqual(dateFrom, `AND i.date >= DATE_TRUNC('day', CURRENT_DATE - INTERVAL '3 day')`);
  });
  void it('getInsightsDateFrom onlyDateFrom recent past', () => {
    const date = addInterval(new Date(), 'day', -2);
    const dateFrom = getInsightsDateFrom(date, undefined, 3, 'day');
    assert.strictEqual(dateFrom, `AND i.date >= DATE_TRUNC('day', TIMESTAMP '${date.toISOString()}')`);
  });
  void it('getInsightsDateFrom bothDates back in the past', () => {
    const dateTo = new Date('2024-05-28');
    const dateFrom = getInsightsDateFrom(new Date('2024-01-15'), dateTo, 3, 'month');
    assert.strictEqual(
      dateFrom,
      `AND i.date >= DATE_TRUNC('month', TIMESTAMP '${dateTo.toISOString()}' - INTERVAL '3 month')`,
    );
  });
  void it('getInsightsDateFrom bothDates recent past', () => {
    const dateTo = new Date('2024-05-28');
    const dateFrom = addInterval(dateTo, 'week', -2);
    const res = getInsightsDateFrom(dateFrom, dateTo, 3, 'week');
    assert.strictEqual(res, `AND i.date >= DATE_TRUNC('week', TIMESTAMP '${dateFrom.toISOString()}')`);
  });

  void it('get insights no filters', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend',
      page: 1,
      pageSize: 10,
      dataPointsPerInterval: 3,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
    };

    const insights = getOrganizationalInsights('clwkdrdn7000008k708vfchyr', args);
    assertSql(
      insights,
      `organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '3 week')
                                              )`,
    );
  });
  void it('get insights ad account filter', () => {
    const args: FilterInsightsInputType = {
      adAccountIds: ['clwnaip1s000008k00nuu3xez', 'clwnaivx3000108k04kc7a491'],
      orderBy: 'spend',
      page: 1,
      pageSize: 10,
      dataPointsPerInterval: 3,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
    };

    const insights = getOrganizationalInsights('clwkdrdn7000008k708vfchyr', args);
    assertSql(
      insights,
      `organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = 'clwkdrdn7000008k708vfchyr'
                                                AND aa.id IN ('clwnaip1s000008k00nuu3xez', 'clwnaivx3000108k04kc7a491')
                                                AND i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '3 week')
                                              )`,
    );
  });
  void it('get insights all filters', () => {
    const args: FilterInsightsInputType = {
      adAccountIds: ['clwnaip1s000008k00nuu3xez', 'clwnaivx3000108k04kc7a491'],
      adIds: ['clwnqvgwx000008mlbmkchjwg'],
      dateFrom: new Date('2024-04-01'),
      dateTo: new Date('2024-05-28'),
      devices: [DeviceEnum.MobileWeb, DeviceEnum.MobileApp],
      orderBy: 'spend',
      page: 1,
      pageSize: 10,
      dataPointsPerInterval: 3,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
      positions: ['feed'],
      publishers: [PublisherEnum.Facebook],
    };

    const insights = getOrganizationalInsights('clwkdrdn7000008k708vfchyr', args);
    assertSql(
      insights,
      `organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = 'clwkdrdn7000008k708vfchyr'
                                                AND aa.id IN ('clwnaip1s000008k00nuu3xez', 'clwnaivx3000108k04kc7a491')
                                                AND a.id IN ('clwnqvgwx000008mlbmkchjwg')
                                                AND i.date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '3 week')
                                                AND i.date < TIMESTAMP '2024-05-28T00:00:00.000Z'
                                                AND i.device IN ('MobileWeb', 'MobileApp')
                                                AND i.position IN ('feed')
                                                AND i.publisher IN ('Facebook')
                                              )`,
    );
  });
  void it('last interval and order by it', () => {
    const insights = lastInterval('ad_id, publisher', 'week', 'spend', true);
    assert.strictEqual(
      insights,
      `last_interval AS (SELECT ad_id, publisher, SUM(i.spend) AS spend
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
                                        AND date < DATE_TRUNC('week', CURRENT_DATE)
                                      GROUP BY ad_id, publisher ORDER BY SUM(spend DESC LIMIT $3 OFFSET $4)`,
    );
  });
  void it('last interval and not order by it', () => {
    const insights = lastInterval('ad_id, publisher', 'week', 'spend', false);
    assert.strictEqual(
      insights,
      `last_interval AS (SELECT ad_id, publisher, SUM(i.spend) AS spend
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
                                        AND date < DATE_TRUNC('week', CURRENT_DATE)
                                      GROUP BY ad_id, publisher)`,
    );
  });
  void it('last interval date to filter', () => {
    const insights = lastInterval('ad_id, publisher', 'week', 'spend', false, new Date('2024-05-28'));
    assert.strictEqual(
      insights,
      `last_interval AS (SELECT ad_id, publisher, SUM(i.spend) AS spend
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '1 week')
                                        AND date < DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                      GROUP BY ad_id, publisher)`,
    );
  });
  void it('interval before last', () => {
    const insights = lastInterval('ad_id, publisher', 'week', 'spend', false);
    assert.strictEqual(
      insights,
      `last_interval AS (SELECT ad_id, publisher, SUM(i.spend) AS spend
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
                                        AND date < DATE_TRUNC('week', CURRENT_DATE)
                                      GROUP BY ad_id, publisher)`,
    );
  });
  void it('interval before last dateTo', () => {
    const insights = lastInterval('ad_id, publisher', 'week', 'spend', false, new Date('2024-05-28'));
    assert.strictEqual(
      insights,
      `last_interval AS (SELECT ad_id, publisher, SUM(i.spend) AS spend
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '1 week')
                                        AND date < DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                      GROUP BY ad_id, publisher)`,
    );
  });
  void it('order column trend', () => {
    const insights = orderColumnTrend(['ad_id', 'publisher'], 'spend', 'desc', 10, 20);
    assert.strictEqual(
      insights,
      `order_column_trend AS (SELECT li.ad_id, li.publisher, li.spend / ibl.spend::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.ad_id = ibl.ad_id AND li.publisher = ibl.publisher
                                      WHERE ibl.spend
                                          > 0
                                      ORDER BY trend
                                      LIMIT 10 OFFSET 20)`,
    );
  });
  void it('grouped insights', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend',
      page: 1,
      pageSize: 10,
      dataPointsPerInterval: 3,
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
    };
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId);
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '3 week')
                                              ), 
  last_interval AS (SELECT ad_id, publisher, currency, SUM(i.spend) AS spend
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
                                        AND date < DATE_TRUNC('week', CURRENT_DATE)
                                      GROUP BY ad_id, publisher, currency),
  interval_before_last AS (SELECT ad_id, publisher, currency, SUM(i.spend) AS spend
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '2 week')
                                               AND date < DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
                                             GROUP BY ad_id, publisher, currency),
  order_column_trend AS (SELECT li.ad_id, li.publisher, li.currency, li.spend / ibl.spend::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.ad_id = ibl.ad_id AND li.publisher = ibl.publisher AND li.currency = ibl.currency
                                      WHERE ibl.spend
                                          > 0
                                      ORDER BY trend
                                      LIMIT 10 OFFSET 0)
  SELECT i.ad_id, i.publisher, i.currency, DATE_TRUNC('week', i.date) interval_start, CAST(SUM(i.spend) AS NUMERIC) AS spend, CAST(SUM(i.impressions) AS NUMERIC) AS impressions 
  FROM organization_insights i JOIN order_column_trend oct ON i.ad_id = oct.ad_id AND i.publisher = oct.publisher AND i.currency = oct.currency
  WHERE i.date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '3 week')
    AND i.date < DATE_TRUNC('week', CURRENT_DATE)
  GROUP BY i.ad_id, i.publisher, i.currency, interval_start, oct.trend
  ORDER BY oct.trend, interval_start DESC;`,
    );
  });
  void it('grouped insights with date filter', () => {
    const args: FilterInsightsInputType = {
      orderBy: 'spend',
      page: 1,
      pageSize: 10,
      dataPointsPerInterval: 3,
      dateFrom: new Date('2024-04-01'),
      dateTo: new Date('2024-05-28'),
      groupBy: ['adId', 'publisher'],
      interval: 'week',
      order: 'desc',
    };
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = groupedInsights(args, organizationId);
    assertSql(
      insights,
      `WITH organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = 'clwkdrdn7000008k708vfchyr'
                                                AND i.date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '3 week')
                                                AND i.date < TIMESTAMP '2024-05-28T00:00:00.000Z'
                                              ), 
  last_interval AS (SELECT ad_id, publisher, currency, SUM(i.spend) AS spend
                                      FROM organization_insights i
                                      WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '1 week')
                                        AND date < DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
                                      GROUP BY ad_id, publisher, currency),
  interval_before_last AS (SELECT ad_id, publisher, currency, SUM(i.spend) AS spend
                                             FROM organization_insights i
                                             WHERE date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '2 week')
                                               AND date < DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '1 week')
                                             GROUP BY ad_id, publisher, currency),
  order_column_trend AS (SELECT li.ad_id, li.publisher, li.currency, li.spend / ibl.spend::decimal trend
                                      FROM last_interval li JOIN interval_before_last ibl ON li.ad_id = ibl.ad_id AND li.publisher = ibl.publisher AND li.currency = ibl.currency
                                      WHERE ibl.spend
                                          > 0
                                      ORDER BY trend
                                      LIMIT 10 OFFSET 0)
  SELECT i.ad_id, i.publisher, i.currency, DATE_TRUNC('week', i.date) interval_start, CAST(SUM(i.spend) AS NUMERIC) AS spend, CAST(SUM(i.impressions) AS NUMERIC) AS impressions 
  FROM organization_insights i JOIN order_column_trend oct ON i.ad_id = oct.ad_id AND i.publisher = oct.publisher AND i.currency = oct.currency
  WHERE i.date >= DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z' - INTERVAL '3 week')
    AND i.date < DATE_TRUNC('week', TIMESTAMP '2024-05-28T00:00:00.000Z')
  GROUP BY i.ad_id, i.publisher, i.currency, interval_start, oct.trend
  ORDER BY oct.trend, interval_start DESC;`,
    );
  });
  void it('insights datapoints', () => {
    const args: InsightsDatapointsInputType = {
      adAccountId: 'clwnaip1s000008k00nuu3xez',
      adId: 'clwojj3kp000008l7bfk10qg1',
      dateFrom: new Date('2024-04-01'),
      dateTo: new Date('2024-05-27'),
      device: DeviceEnum.MobileWeb,
      interval: 'week',
      position: 'feed',
      publisher: PublisherEnum.Facebook,
    };
    const organizationId = 'clwkdrdn7000008k708vfchyr';
    const insights = insightsDatapoints(args, organizationId);
    const expected = `SELECT DATE_TRUNC('week', i.date)          AS date,
                             CAST(SUM(i.spend) AS NUMERIC)       AS spend,
                             CAST(SUM(i.impressions) AS NUMERIC) AS impressions
                      FROM insights i
                               JOIN ads a on i.ad_id = a.id
                               JOIN ad_accounts aa on a.ad_account_id = aa.id
                               JOIN integrations int on aa.integration_id = int.id
                      WHERE int.organization_id = 'clwkdrdn7000008k708vfchyr'
                        AND i.date >= DATE_TRUNC('week', TIMESTAMP '2024-04-01T00:00:00.000Z')
                        AND i.date < DATE_TRUNC('week', TIMESTAMP '2024-05-27T00:00:00.000Z')
                        AND i.ad_account_id = 'clwnaip1s000008k00nuu3xez'
                        AND i.ad_id = 'clwojj3kp000008l7bfk10qg1'
                        AND i.device = 'MobileWeb'
                        AND i.position = 'feed'
                        AND i.publisher = 'Facebook'
                      GROUP BY date
                      ORDER BY date DESC;`;
    assertSql(insights, expected);
  });
});
