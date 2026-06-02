export type Campaign = {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  revenue: number;
  conversions: number;
  platform: string;
  roas: number;
  cpa: number;
};

export type Summary = {
  totalSpend: number;
  totalRevenue: number;
  overallRoas: number;
};
