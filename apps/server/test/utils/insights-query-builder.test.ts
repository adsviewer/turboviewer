import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import type { FilterInsightsInputType } from '../../src/schema/integrations/integration-types';
import {
  getOrganizationalInsights,
  groupedInsights,
  lastInterval,
  orderColumnTrend,
} from '../../src/utils/insights-query-builder';

void describe('insights query builder tests', () => {
  void it('get insights', () => {
    const insights = getOrganizationalInsights('clwkdrdn7000008k708vfchyr');
    assert.strictEqual(
      insights,
      `organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = 'clwkdrdn7000008k708vfchyr')`,
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
    assert.strictEqual(
      insights,
      `WITH organization_insights AS (SELECT i.*
                                              FROM insights i
                                                       JOIN ads a on i.ad_id = a.id
                                                       JOIN ad_accounts aa on a.ad_account_id = aa.id
                                                       JOIN integrations int on aa.integration_id = int.id
                                              WHERE int.organization_id = 'clwkdrdn7000008k708vfchyr'), 
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
});
