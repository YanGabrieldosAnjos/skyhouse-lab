
const UA = 'skyhouse-lab/0.1 (campaign dashboard demo)';
const TTL_MS = 10 * 60 * 1000; // 10 minutes

type WikipediaSummary = {
  title: string;
  extract: string;
  url: string;
};

type Buzz = {
  source: 'wikipedia-pageviews';
  weeklyViews: number;
  window: 'week';
  url: string; // link to the pageviews tool for this article
};

export type CampaignEnrichment = {
  query: string;
  wikipedia: WikipediaSummary | null;
  buzz: Buzz | null;
};

const cache = new Map<string, { value: CampaignEnrichment; ts: number }>();

/** "Wrinkle Cream — FB Broad" → "Wrinkle Cream" */
const deriveQuery = (campaignName: string): string => {
  const head = campaignName.split(/[—-]/)[0];
  return (head ?? campaignName).trim();
};

const firstSentences = (text: string, n: number): string => {
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!parts || parts.length === 0) return text.trim();
  return parts.slice(0, n).join('').trim();
};

async function fetchWikipedia(query: string): Promise<WikipediaSummary | null> {
  try {
    const searchUrl =
      `https://en.wikipedia.org/w/api.php?action=opensearch` +
      `&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`;
    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': UA } });
    if (!searchRes.ok) return null;
    const [, titles] = (await searchRes.json()) as [string, string[], string[], string[]];
    const title = titles?.[0];
    if (!title) return null;

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': UA } });
    if (!summaryRes.ok) return null;
    const data = (await summaryRes.json()) as {
      title: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    };
    if (!data.extract) return null;

    return {
      title: data.title,
      extract: firstSentences(data.extract, 3),
      url:
        data.content_urls?.desktop?.page ??
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

const yyyymmdd = (d: Date) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

async function fetchPageviews(title: string): Promise<Buzz | null> {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);

  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/` +
    `en.wikipedia/all-access/all-agents/${encodeURIComponent(title)}` +
    `/daily/${yyyymmdd(start)}/${yyyymmdd(end)}`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Array<{ views?: number }> };
    const weeklyViews = (data.items ?? []).reduce((s, it) => s + (it.views ?? 0), 0);
    return {
      source: 'wikipedia-pageviews',
      weeklyViews,
      window: 'week',
      url: `https://pageviews.wmcloud.org/?project=en.wikipedia.org&platform=all-access&agent=user&pages=${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

export async function enrichCampaign(campaignName: string): Promise<CampaignEnrichment> {
  const query = deriveQuery(campaignName);
  const cached = cache.get(query);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.value;

  const wikipedia = await fetchWikipedia(query);
  const buzz = wikipedia ? await fetchPageviews(wikipedia.title) : null;

  const value: CampaignEnrichment = { query, wikipedia, buzz };
  cache.set(query, { value, ts: Date.now() });
  return value;
}
