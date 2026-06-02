import { Fragment, useState } from 'react';
import type { Campaign } from './types';
import { usd, int } from './format';

const roasClass = (roas: number) => {
  if (roas >= 3) return 'pill pill--green';
  if (roas >= 1.5) return 'pill pill--yellow';
  return 'pill pill--red';
};

type WikipediaSummary = { title: string; extract: string; url: string };
type Buzz = { source: string; weeklyViews: number; window: string; url: string };
type Enrichment = {
  query: string;
  wikipedia: WikipediaSummary | null;
  buzz: Buzz | null;
};
type EnrichState = { loading: boolean; data?: Enrichment; error?: string };

type Props = {
  campaigns: Campaign[];
  minRoas: number;
  onMinRoasChange: (v: number) => void;
};

export function CampaignTable({ campaigns, minRoas, onMinRoasChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enrichments, setEnrichments] = useState<Record<string, EnrichState>>({});

  const visible = campaigns.filter((c) => c.roas >= minRoas);

  const toggleInsights = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);

    if (enrichments[id]?.data || enrichments[id]?.loading) return;

    setEnrichments((m) => ({ ...m, [id]: { loading: true } }));
    fetch(`/api/campaigns/${id}/enrich`)
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`${r.status}: ${text.slice(0, 200)}`);
        }
        return r.json();
      })
      .then((res: { body: Enrichment }) => {
        setEnrichments((m) => ({ ...m, [id]: { loading: false, data: res.body } }));
      })
      .catch((err: Error) => {
        setEnrichments((m) => ({ ...m, [id]: { loading: false, error: err.message } }));
      });
  };

  return (
    <section className="card">
      <div className="toolbar">
        <div className="toolbar__group">
          <label htmlFor="min-roas">Min ROAS</label>
          <input
            id="min-roas"
            className="input"
            type="number"
            min={0}
            step={0.1}
            value={minRoas}
            onChange={(e) => onMinRoasChange(Number(e.target.value) || 0)}
          />
        </div>
        <div className="toolbar__count">
          <strong>{visible.length}</strong> of {campaigns.length} campaigns
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">No campaigns at or above ROAS {minRoas}.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Platform</th>
                <th className="table__num">Spend</th>
                <th className="table__num">Revenue</th>
                <th className="table__num">Conv.</th>
                <th className="table__num">ROAS</th>
                <th className="table__num">CPA</th>
                <th className="table__num"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const state = enrichments[c.campaign_id];
                const isOpen = expandedId === c.campaign_id;
                return (
                  <Fragment key={c.campaign_id}>
                    <tr>
                      <td>
                        <div className="campaign__name">{c.campaign_name}</div>
                        <div className="campaign__id">{c.campaign_id}</div>
                      </td>
                      <td>{c.platform}</td>
                      <td className="table__num">{usd.format(c.spend)}</td>
                      <td className="table__num">{usd.format(c.revenue)}</td>
                      <td className="table__num">{int.format(c.conversions)}</td>
                      <td className="table__num">
                        <span className={roasClass(c.roas)}>{c.roas}x</span>
                      </td>
                      <td className="table__num">{usd.format(c.cpa)}</td>
                      <td className="table__num">
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => toggleInsights(c.campaign_id)}
                        >
                          {isOpen ? 'Hide' : 'Insights'}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="enrich-row">
                        <td colSpan={8}>
                          {state?.loading && (
                            <div className="enrich__loading">Fetching insights…</div>
                          )}
                          {state?.error && (
                            <div className="enrich__error">Error: {state.error}</div>
                          )}
                          {state?.data && <InsightsPanel data={state.data} />}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function InsightsPanel({ data }: { data: Enrichment }) {
  return (
    <div className="enrich">
      <div className="enrich__col">
        <div className="enrich__label">
          Wikipedia
          {data.wikipedia && ` · ${data.wikipedia.title}`}
        </div>
        {data.wikipedia ? (
          <>
            <p className="enrich__text">{data.wikipedia.extract}</p>
            <a href={data.wikipedia.url} target="_blank" rel="noopener noreferrer">
              Read on Wikipedia →
            </a>
          </>
        ) : (
          <div className="enrich__none">
            No Wikipedia match for “{data.query}”.
          </div>
        )}
      </div>

      <div className="enrich__col">
        <div className="enrich__label">Wikipedia pageviews · last 7 days</div>
        {data.buzz ? (
          <>
            <div className="enrich__stat">
              <span className="enrich__count">{int.format(data.buzz.weeklyViews)}</span>
              <span className="enrich__unit">views</span>
            </div>
            <a href={data.buzz.url} target="_blank" rel="noopener noreferrer">
              See pageview trend →
            </a>
          </>
        ) : (
          <div className="enrich__none">No buzz signal available.</div>
        )}
      </div>
    </div>
  );
}
