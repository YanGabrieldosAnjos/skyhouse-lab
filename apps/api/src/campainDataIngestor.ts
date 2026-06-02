import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, 'campain_data.csv');
type CampaignRaw = {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  revenue: number;
  conversions: number;
  platform: string;
};
type Campaign = {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  revenue: number;
  conversions: number;
  platform: string;
  roas: number;
  cpa: number;
};

type SummaryOfCampaigns = {
    totalSpend: number;
    totalRevenue: number;
    overallRoas: number;
}

const safe = (n: unknown): number => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

export const dataIngestor = () => {
  let campaigns: Array<Campaign> = [];
  let summary: SummaryOfCampaigns = {
    totalSpend: 0,
    totalRevenue: 0,
    overallRoas: 0,
  }

  const csv = readFileSync(csvPath, 'utf8');
  const { data } = Papa.parse<CampaignRaw>(csv, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  for (const row of data) {
    let roas = row.spend ? row.revenue / row.spend : 0;
    let cpa = row.conversions ? row.spend / row.conversions : 0;
    campaigns.push({
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        spend: row.spend,
        revenue: row.revenue,
        conversions: row.conversions,
        platform: row.platform,
        roas: Math.round((roas) * 100) / 100,
        cpa: Math.round((cpa) * 100) / 100,
    });
    summary.totalSpend += safe(row.spend);
    summary.totalRevenue += safe(row.revenue);
    summary.overallRoas = summary.totalSpend ? Math.round((summary.totalRevenue / summary.totalSpend) * 100) / 100 : 0;
  }
  console.log('campaigns', summary); 
  return { campaigns, summary };
};
