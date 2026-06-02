import express from 'express';
import { dataIngestor } from './campainDataIngestor.js';
import { enrichCampaign } from './enrichments.js';

const app = express();
const port = 3001;

app.get('/api/campaigns', (_req, res) => {
  try {
    const { campaigns, summary } = dataIngestor();
    res.json({ body: { campaigns, summary } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/campaigns/:id/enrich', async (req, res) => {
  try {
    const { campaigns } = dataIngestor();
    const campaign = campaigns.find((c) => c.campaign_id === req.params.id);
    if (!campaign) {
      res.status(404).json({ error: `Campaign ${req.params.id} not found` });
      return;
    }
    const enrichment = await enrichCampaign(campaign.campaign_name);
    res.json({ body: enrichment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(port, () => {
  console.log(`api listening on http://localhost:${port}`);
});
