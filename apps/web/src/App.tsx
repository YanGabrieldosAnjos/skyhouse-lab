import { useEffect, useState } from 'react';
import { CampaignTable } from './CampaignTable';
import { Stat } from './Stat';
import { usd } from './format';
import type { Campaign, Summary } from './types';
import './App.css';

export function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [minRoas, setMinRoas] = useState<number>(0);

  const loading = !error && campaigns.length === 0;

  useEffect(() => {
    fetch('/api/campaigns')
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`${r.status}: ${text.slice(0, 200)}`);
        }
        return r.json();
      })
      .then((data: { body: { campaigns: Campaign[]; summary: Summary } }) => {
        setCampaigns(data.body.campaigns);
        setSummary(data.body.summary);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="app">
      <div className="app__container">
        <header className="app__header">
          <div className="app__brand">skyhouse-lab</div>
          <h1 className="app__title">Campaign Performance</h1>
        </header>

        {error && <div className="banner banner--error">{error}</div>}
        {loading && <div className="loading">Loading campaigns…</div>}

        {summary && (
          <section className="stats">
            <Stat label="Total Spend" value={usd.format(summary.totalSpend)} />
            <Stat label="Total Revenue" value={usd.format(summary.totalRevenue)} />
            <Stat label="Overall ROAS" value={`${summary.overallRoas}x`} />
          </section>
        )}

        {campaigns.length > 0 && (
          <CampaignTable
            campaigns={campaigns}
            minRoas={minRoas}
            onMinRoasChange={setMinRoas}
          />
        )}
      </div>
    </main>
  );
}
