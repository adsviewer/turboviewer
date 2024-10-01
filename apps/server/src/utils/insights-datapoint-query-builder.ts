import { type InsightsDatapointsInputType } from '../schema/integrations/integration-types';

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
