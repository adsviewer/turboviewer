import 'dotenv/config';
import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { DeviceEnum, PublisherEnum } from '@repo/database';
import { type InsightsDatapointsInputType } from '../../src/schema/integrations/integration-types';
import { insightsDatapoints } from '../../src/utils/insights-datapoint-query-builder';

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
  void it('insights datapoints', () => {
    const args: InsightsDatapointsInputType = {
      adAccountId: 'clwnaip1s000008k00nuu3xez',
      adId: 'clwojj3kp000008l7bfk10qg1',
      adSetId: 'cm1gfkt5v000009kzexbw69eo',
      campaignId: 'cm1gfkzsi000008mgfrld71p1',
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
                             SUM(i.spend)                                               AS spend,
                             SUM(i.impressions)                                         AS impressions,
                             SUM(i.spend) * 10 / NULLIF(SUM(i.impressions::decimal), 0) AS cpm
                      FROM insights i
                               JOIN ads a on i.ad_id = a.id
                               JOIN ad_sets ase on a.ad_set_id = ase.id
                               JOIN campaigns c on ase.campaign_id = c.id
                               JOIN ad_accounts aa on c.ad_account_id = aa.id
                               JOIN "_AdAccountToOrganization" ao on ao."A" = aa.id
                      WHERE ao."B" = 'clwkdrdn7000008k708vfchyr'
                        AND i.date >= DATE_TRUNC('week', TIMESTAMP '2024-04-01T00:00:00.000Z')
                        AND i.date < DATE_TRUNC('week', TIMESTAMP '2024-05-27T00:00:00.000Z')
                        AND c.ad_account_id = 'clwnaip1s000008k00nuu3xez'
                        AND i.ad_id = 'clwojj3kp000008l7bfk10qg1'
                        AND a.ad_set_id = 'cm1gfkt5v000009kzexbw69eo'
                        AND ase.campaign_id = 'cm1gfkzsi000008mgfrld71p1'
                        AND i.device = 'MobileWeb'
                        AND i.position = 'feed'
                        AND i.publisher = 'Facebook'
                      GROUP BY date
                      HAVING SUM(i.impressions) > 0
                      ORDER BY date;`;
    assertSql(insights, expected);
  });
});
