// Shared DefiLlama functions for reuse and testing

export type YieldPool = {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  apy?: number;
  apyBase?: number;
  apyReward?: number;
  tvlUsd: number;
  stablecoin?: boolean;
  url?: string;
};

export type GetTopYieldPoolsParams = {
  chain?: string;
  project?: string;
  stablecoinOnly?: boolean;
  minTvlUsd?: number;
  limit?: number;
};

export type GetProtocolTvlParams = { protocol: string };
export type GetChainTvlParams = { chain?: string; limit?: number };
export type GetTokenPriceParams = {
  coingeckoId?: string;
  chain?: string;
  address?: string;
};

// New params for extended functionality
// (Free API only) we omit advanced pro-only params/types.

const DEFILLAMA_YIELDS = "https://yields.llama.fi/pools";
const DEFILLAMA_PROTOCOL = (slug: string) =>
  `https://api.llama.fi/protocol/${encodeURIComponent(slug)}`;
const DEFILLAMA_PROTOCOLS = "https://api.llama.fi/protocols";
const DEFILLAMA_PROTOCOL_CHART = (slug: string) =>
  `https://api.llama.fi/charts2/${encodeURIComponent(slug)}`;
const DEFILLAMA_CHAINS = "https://api.llama.fi/chains";
const DEFILLAMA_PRICES_CURRENT = (coins: string) =>
  `https://coins.llama.fi/prices/current/${encodeURIComponent(coins)}`;
const DEFILLAMA_STABLECOINS = "https://stablecoins.llama.fi/stablecoins";
const DEFILLAMA_STABLECOIN_CHAINS =
  "https://stablecoins.llama.fi/stablecoinchains";
const DEFILLAMA_YIELD_POOL_CHART = (pool: string) =>
  `https://yields.llama.fi/chart/${encodeURIComponent(pool)}`;
// Free endpoints only
// Protocol details (already used via getProtocolTvl): https://api.llama.fi/protocol/{slug}
// Chains current TVL: https://api.llama.fi/chains
// No free endpoint for protocol list with full metrics or historical chain TVL snapshot like pro; we skip those.

export async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// Helper for pro endpoints allowing optional key injection: https://pro-api.llama.fi/<KEY>/<endpoint>
// Removed withProKey helper (pro endpoints not used now)

export function fmtUsd(n: number) {
  return n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(2)}B`
    : n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function fmtPct(n: number | undefined) {
  if (n === undefined || isNaN(n)) return "-";
  return `${n.toFixed(2)}%`;
}

// Return a markdown-friendly summary string
export async function getTopYieldPools({
  chain,
  project,
  stablecoinOnly = false,
  minTvlUsd = 100000,
  limit = 10,
}: GetTopYieldPoolsParams): Promise<string> {
  const data = await fetchJson<{ data: YieldPool[] }>(DEFILLAMA_YIELDS);
  let pools = data.data || [];

  if (chain) {
    const c = chain.toLowerCase();
    pools = pools.filter((p) => p.chain?.toLowerCase() === c);
  }
  if (project) {
    const t = project.toLowerCase();
    pools = pools.filter((p) => p.project?.toLowerCase().includes(t));
  }
  if (stablecoinOnly) pools = pools.filter((p) => p.stablecoin);
  pools = pools.filter((p) => (p.tvlUsd || 0) >= (minTvlUsd || 0));

  const apyOf = (p: YieldPool) =>
    p.apy !== undefined && !isNaN(p.apy)
      ? p.apy
      : (p.apyBase || 0) + (p.apyReward || 0);

  pools.sort((a, b) => apyOf(b) - apyOf(a) || b.tvlUsd - a.tvlUsd);
  const top = pools.slice(0, Math.max(1, Math.min(50, limit || 10)));
  if (!top.length) return "No pools matched your filters.";

  const lines = top.map((p, i) => {
    const totalApy = apyOf(p);
    return `${String(i + 1).padStart(2, "0")} • ${p.project} — ${p.chain} ${
      p.symbol
    } | APY ${fmtPct(totalApy)} | TVL ${fmtUsd(p.tvlUsd)}$${
      p.url ? `\n   ↪ ${p.url}` : ""
    }`;
  });

  const headerParts: string[] = ["Top Yield Pools (DefiLlama)"];
  if (chain) headerParts.push(`on ${chain}`);
  if (project) headerParts.push(`project: ${project}`);
  if (stablecoinOnly) headerParts.push("stablecoins only");
  if (minTvlUsd) headerParts.push(`min TVL ${fmtUsd(minTvlUsd)}`);

  return `${headerParts.join(" · ")}\n\n${lines.join("\n")}`;
}

export async function getProtocolTvl({
  protocol,
}: GetProtocolTvlParams): Promise<string> {
  type ProtocolInfo = {
    name?: string;
    url?: string;
    tvl?: Array<{ date: number; totalLiquidityUSD: number }>;
    chainTvls?: Record<
      string,
      { tvl?: Array<{ date: number; totalLiquidityUSD: number }> }
    >;
  };
  const info = await fetchJson<ProtocolInfo>(DEFILLAMA_PROTOCOL(protocol));
  const tvlSeries: Array<{ date: number; totalLiquidityUSD: number }> =
    info?.tvl || [];
  const latest = tvlSeries[tvlSeries.length - 1];
  const prev7 = tvlSeries[tvlSeries.length - 8];
  const prev30 = tvlSeries[tvlSeries.length - 31];

  const latestTvl = latest?.totalLiquidityUSD || 0;
  const d7 = prev7
    ? ((latestTvl - prev7.totalLiquidityUSD) / prev7.totalLiquidityUSD) * 100
    : undefined;
  const d30 = prev30
    ? ((latestTvl - prev30.totalLiquidityUSD) / prev30.totalLiquidityUSD) * 100
    : undefined;

  const chains = Object.keys(info?.chainTvls ?? {});
  const topChains = chains
    .map((c) => {
      const arr = info.chainTvls?.[c]?.tvl || [];
      const last = arr[arr.length - 1]?.totalLiquidityUSD || 0;
      return { chain: c, tvl: last };
    })
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 5);

  const lines = topChains.map((c) => `• ${c.chain}: ${fmtUsd(c.tvl)}`);
  return [
    `📊 ${info?.name || protocol} TVL`,
    `Total: ${fmtUsd(latestTvl)}`,
    `7d: ${fmtPct(d7)} · 30d: ${fmtPct(d30)}`,
    "",
    "Top Chains:",
    ...lines,
    "",
    info?.url ? `🔗 ${info.url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function getChainTvl({
  chain,
  limit = 10,
}: GetChainTvlParams): Promise<string> {
  const list = await fetchJson<Array<{ name: string; tvl: number }>>(
    DEFILLAMA_CHAINS
  );
  let rows = list;
  if (chain) {
    const c = chain.toLowerCase();
    rows = rows.filter((r) => r.name?.toLowerCase() === c);
  }
  rows.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
  const top = rows.slice(0, Math.max(1, Math.min(50, limit || 10)));
  const lines = top.map(
    (r, i) =>
      `${String(i + 1).padStart(2, "0")} • ${r.name}: ${fmtUsd(r.tvl || 0)}`
  );
  return `🌉 Chain TVL (DefiLlama)${chain ? ` — ${chain}` : ""}\n\n${lines.join(
    "\n"
  )}`;
}

export async function getTokenPriceDefiLlama({
  coingeckoId,
  chain,
  address,
}: GetTokenPriceParams): Promise<string> {
  let key: string | null = null;
  if (coingeckoId) key = `coingecko:${coingeckoId}`;
  else if (chain && address) key = `${chain}:${address}`;
  if (!key) return "❌ Provide coingeckoId or both chain and address.";

  const resp = await fetchJson<{
    coins: Record<
      string,
      {
        price: number;
        symbol?: string;
        timestamp?: number;
        confidence?: number;
      }
    >;
  }>(DEFILLAMA_PRICES_CURRENT(key));
  const entry = resp.coins?.[key];
  if (!entry) return "Price not found.";
  const when = entry.timestamp
    ? new Date(entry.timestamp * 1000).toUTCString()
    : "now";
  const conf =
    entry.confidence !== undefined
      ? ` (confidence ${Math.round(entry.confidence * 100)}%)`
      : "";
  return `💵 ${
    entry.symbol || coingeckoId || key
  } price: $${entry.price.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })} ${conf}\n🕒 ${when}`;
}

// Removed extended pro-only helper functions to keep free-only surface.

// ================= Additional Free Functions =================

// 1. List protocols (basic) with optional search/category and limit
export async function listProtocols({
  search,
  category,
  chain,
  limit = 20,
}: {
  search?: string;
  category?: string;
  chain?: string;
  limit?: number;
} = {}): Promise<string> {
  const protos = await fetchJson<
    Array<{
      name: string;
      symbol?: string;
      tvl?: number;
      category?: string;
      slug?: string;
      chains?: string[];
    }>
  >(DEFILLAMA_PROTOCOLS);
  let rows = protos || [];
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (p) => p.name.toLowerCase().includes(s) || p.symbol?.toLowerCase() === s
    );
  }
  if (category) {
    const c = category.toLowerCase();
    rows = rows.filter((p) => p.category?.toLowerCase() === c);
  }
  if (chain) {
    const ch = chain.toLowerCase();
    rows = rows.filter((p) => p.chains?.some((c) => c.toLowerCase() === ch));
  }
  rows.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
  const top = rows.slice(0, Math.max(1, Math.min(100, limit)));
  const lines = top.map(
    (p, i) =>
      `${String(i + 1).padStart(2, "0")} • ${p.name} (${p.symbol || "?"}) | ${
        p.category || "-"
      } | TVL ${fmtUsd(p.tvl || 0)} | Chains: ${
        p.chains?.slice(0, 3).join(",") || "-"
      }${p.chains && p.chains.length > 3 ? "+" : ""}`
  );
  return `📚 Protocols${search ? ` search='${search}'` : ""}${
    category ? ` category='${category}'` : ""
  }${chain ? ` chain='${chain}'` : ""} (${top.length}/${
    rows.length
  })\n\n${lines.join("\n")}`;
}

// 2. Largest protocols by TVL (alias of list filtered just using limit)
export async function getLargestProtocolsByTvl({
  limit = 10,
}: { limit?: number } = {}): Promise<string> {
  const data = await fetchJson<
    Array<{ name: string; tvl?: number; symbol?: string }>
  >(DEFILLAMA_PROTOCOLS);
  const rows = (data || [])
    .filter((p) => (p.tvl || 0) > 0)
    .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
    .slice(0, Math.max(1, Math.min(50, limit)));
  const lines = rows.map(
    (p, i) =>
      `${String(i + 1).padStart(2, "0")} • ${p.name} (${
        p.symbol || "?"
      }) TVL ${fmtUsd(p.tvl || 0)}`
  );
  return `🏆 Top Protocols by TVL\n\n${lines.join("\n")}`;
}

// Helper to get protocol chart series
async function fetchProtocolSeries(slug: string) {
  type ChartPoint = { date: number; totalLiquidityUSD: number };
  const chart = await fetchJson<{
    chart?: Array<ChartPoint>;
    tvl?: Array<ChartPoint>; // fallback shape
  }>(DEFILLAMA_PROTOCOL_CHART(slug));
  return (chart.chart || chart.tvl || []) as Array<ChartPoint>;
}

// 3. Protocol historical TVL (last N days)
export async function getProtocolHistoricalTvl({
  protocol,
  days = 30,
}: {
  protocol: string;
  days?: number;
}): Promise<string> {
  const series = await fetchProtocolSeries(protocol);
  if (!series.length) return `No TVL data for ${protocol}.`;
  const slice = series.slice(-days);
  const lines = slice.map(
    (p) =>
      `${new Date(p.date * 1000).toISOString().split("T")[0]}: ${fmtUsd(
        p.totalLiquidityUSD
      )}`
  );
  return `🕒 ${protocol} TVL (last ${slice.length} days)\n\n${lines.join(
    "\n"
  )}`;
}

// 4. Protocol TVL change summary (1d,7d,30d)
export async function getProtocolTvlChange({
  protocol,
}: {
  protocol: string;
}): Promise<string> {
  const s = await fetchProtocolSeries(protocol);
  if (s.length < 2) return `Insufficient data for ${protocol}.`;
  const latest = s[s.length - 1].totalLiquidityUSD;
  const idx1d = s[s.length - 2]?.totalLiquidityUSD;
  const idx7d = s[s.length - 8]?.totalLiquidityUSD;
  const idx30d = s[s.length - 31]?.totalLiquidityUSD;
  function delta(prev?: number) {
    if (!prev) return undefined;
    return ((latest - prev) / prev) * 100;
  }
  return [
    `📈 ${protocol} TVL Change`,
    `Current: ${fmtUsd(latest)}`,
    `1d: ${fmtPct(delta(idx1d))} · 7d: ${fmtPct(delta(idx7d))} · 30d: ${fmtPct(
      delta(idx30d)
    )}`,
  ].join("\n");
}

// 5. Stablecoins overview (top by circulating)
export async function getStablecoinsOverview({
  limit = 15,
}: { limit?: number } = {}): Promise<string> {
  type Stablecoin = {
    name: string;
    symbol: string;
    circulating?: number;
    peggedUSD?: number;
  };
  const data = await fetchJson<{ stablecoins: Stablecoin[] }>(
    DEFILLAMA_STABLECOINS
  );
  const rows = (data.stablecoins || [])
    .map((s) => ({
      name: s.name,
      symbol: s.symbol,
      cap: s.circulating ?? s.peggedUSD ?? 0,
    }))
    .filter((s) => s.cap > 0)
    .sort((a, b) => b.cap - a.cap)
    .slice(0, Math.max(1, Math.min(50, limit)));
  const total = rows.reduce((acc, r) => acc + r.cap, 0);
  const lines = rows.map(
    (r, i) =>
      `${String(i + 1).padStart(2, "0")} • ${r.symbol}: ${fmtUsd(r.cap)}`
  );
  return `💱 Top Stablecoins (subset cap ${fmtUsd(total)})\n\n${lines.join(
    "\n"
  )}`;
}

// 6. Stablecoin chain distribution (aggregate per chain)
export async function getStablecoinChainDistribution({
  limit = 10,
}: { limit?: number } = {}): Promise<string> {
  type ChainEntry = { name: string; stablecoin?: { circulating: number }[] };
  const data = await fetchJson<{ chains: ChainEntry[] }>(
    DEFILLAMA_STABLECOIN_CHAINS
  );
  const rows = (data.chains || []).map((c) => ({
    name: c.name,
    cap: (c.stablecoin || []).reduce((acc, s) => acc + (s.circulating || 0), 0),
  }));
  rows.sort((a, b) => b.cap - a.cap);
  const top = rows.slice(0, Math.max(1, Math.min(50, limit)));
  const total = rows.reduce((a, r) => a + r.cap, 0);
  const lines = top.map(
    (r, i) =>
      `${String(i + 1).padStart(2, "0")} • ${r.name}: ${fmtUsd(
        r.cap
      )} (${fmtPct((r.cap / total) * 100)})`
  );
  return `🌐 Stablecoin Distribution by Chain (Top ${
    top.length
  })\nTotal Counted: ${fmtUsd(total)}\n\n${lines.join("\n")}`;
}

// 7. Top chains by stablecoin cap (alias focusing on top summary line only)
export async function getTopStablecoinChains({
  limit = 5,
}: { limit?: number } = {}): Promise<string> {
  type ChainEntry = { name: string; stablecoin?: { circulating: number }[] };
  const data = await fetchJson<{ chains: ChainEntry[] }>(
    DEFILLAMA_STABLECOIN_CHAINS
  );
  const rows = (data.chains || []).map((c) => ({
    name: c.name,
    cap: (c.stablecoin || []).reduce((acc, s) => acc + (s.circulating || 0), 0),
  }));
  rows.sort((a, b) => b.cap - a.cap);
  const top = rows.slice(0, Math.max(1, Math.min(25, limit)));
  const lines = top.map(
    (r, i) => `${String(i + 1).padStart(2, "0")} ${r.name} (${fmtUsd(r.cap)})`
  );
  return `🏦 Top Stablecoin Chains\n${lines.join(" | ")}`;
}

// 8. Yield pool historical APY (pool identifier from pools list)
export async function getPoolHistoricalApy({
  pool,
  days = 14,
}: {
  pool: string;
  days?: number;
}): Promise<string> {
  type Point = {
    timestamp: number;
    apy?: number;
    apyBase?: number;
    apyReward?: number;
  };
  const data = await fetchJson<{ data: Point[] }>(
    DEFILLAMA_YIELD_POOL_CHART(pool)
  );
  const series = data.data || [];
  if (!series.length) return `No APY data for pool ${pool}.`;
  const slice = series.slice(-days);
  const rows = slice.map((p) => {
    const apy =
      p.apy !== undefined && !isNaN(p.apy)
        ? p.apy
        : (p.apyBase || 0) + (p.apyReward || 0);
    return `${new Date(p.timestamp * 1000).toISOString().split("T")[0]}: ${
      apy !== undefined ? apy.toFixed(2) + "%" : "-"
    }`;
  });
  const latest = slice[slice.length - 1];
  const latestApy =
    latest.apy !== undefined && !isNaN(latest.apy)
      ? latest.apy
      : (latest.apyBase || 0) + (latest.apyReward || 0);
  const avg =
    slice.reduce((acc, p) => {
      const v =
        p.apy !== undefined && !isNaN(p.apy)
          ? p.apy
          : (p.apyBase || 0) + (p.apyReward || 0);
      return acc + (v || 0);
    }, 0) / slice.length;
  return `⏱️ Pool APY History (${pool}) last ${
    slice.length
  } days\nCurrent: ${latestApy?.toFixed(2)}% · Avg: ${avg.toFixed(
    2
  )}%\n\n${rows.join("\n")}`;
}

// 9. Pool current APY summary (find in pools list)
export async function getPoolCurrentApy({
  pool,
}: {
  pool: string;
}): Promise<string> {
  const data = await fetchJson<{ data: YieldPool[] }>(DEFILLAMA_YIELDS);
  const match = (data.data || []).find((p) => p.pool === pool);
  if (!match) return `Pool ${pool} not found.`;
  const apy =
    match.apy !== undefined && !isNaN(match.apy)
      ? match.apy
      : (match.apyBase || 0) + (match.apyReward || 0);
  return `🧪 Pool ${pool}\nProject: ${match.project} | Chain: ${
    match.chain
  }\nSymbol: ${match.symbol} | TVL ${fmtUsd(match.tvlUsd)}\nAPY: ${apy?.toFixed(
    2
  )}% (base ${fmtPct(match.apyBase)} reward ${fmtPct(match.apyReward)})${
    match.url ? `\n🔗 ${match.url}` : ""
  }`;
}

// 10. Aggregated chain TVL summary (top N & dominance)
export async function getAggregatedChainTvlSummary({
  limit = 10,
}: { limit?: number } = {}): Promise<string> {
  const chains = await fetchJson<Array<{ name: string; tvl: number }>>(
    DEFILLAMA_CHAINS
  );
  const rows = (chains || []).filter((c) => c.tvl > 0);
  const total = rows.reduce((a, c) => a + c.tvl, 0);
  rows.sort((a, b) => b.tvl - a.tvl);
  const top = rows.slice(0, Math.max(1, Math.min(30, limit)));
  const lines = top.map(
    (c, i) =>
      `${String(i + 1).padStart(2, "0")} • ${c.name}: ${fmtUsd(
        c.tvl
      )} (${fmtPct((c.tvl / total) * 100)})`
  );
  return `🌍 Chain TVL Dominance (Top ${
    top.length
  })\nTotal TVL Counted: ${fmtUsd(total)}\n\n${lines.join("\n")}`;
}
