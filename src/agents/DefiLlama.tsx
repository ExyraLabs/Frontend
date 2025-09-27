"use client";
import { useCopilotAction } from "@copilotkit/react-core";
import {
  getTopYieldPools,
  getProtocolTvl,
  getChainTvl,
  getTokenPriceDefiLlama,
  listProtocols,
  getLargestProtocolsByTvl,
  getProtocolHistoricalTvl,
  getProtocolTvlChange,
  getStablecoinsOverview,
  getStablecoinChainDistribution,
  getTopStablecoinChains,
  getPoolHistoricalApy,
  getPoolCurrentApy,
  getAggregatedChainTvlSummary,
} from "./defillama-functions";

export default function DefiLlama() {
  // Top yield pools finder
  useCopilotAction({
    name: "getTopYieldPools",
    description:
      "Get top yield pools from DefiLlama. Filter by chain, project, stablecoin-only, and minimum TVL.",
    parameters: [
      {
        name: "chain",
        type: "string",
        description:
          "(Optional) Restrict pools to a specific chain name as displayed by DefiLlama (case-insensitive). Examples: 'Ethereum', 'Arbitrum', 'Optimism', 'Base'. If omitted, all chains are considered.",
        required: false,
      },
      {
        name: "project",
        type: "string",
        description:
          "(Optional) Match pools whose project (slug or display name) contains this substring. Examples: 'aave', 'curve', 'uniswap'. Case-insensitive partial match.",
        required: false,
      },
      {
        name: "stablecoinOnly",
        type: "boolean",
        description:
          "(Optional) When true, include only pools flagged as stablecoin pools. Default: false.",
        required: false,
      },
      {
        name: "minTvlUsd",
        type: "number",
        description:
          "(Optional) Discard pools whose TVL is below this USD threshold. Helps filter out illiquid pools. Default: 100000 (100k).",
        required: false,
      },
      {
        name: "limit",
        type: "number",
        description:
          "(Optional) Maximum number of pools to return after sorting by APY desc then TVL desc. Range: 1-50. Default: 10.",
        required: false,
      },
    ],
    handler: async (args: {
      chain?: string;
      project?: string;
      stablecoinOnly?: boolean;
      minTvlUsd?: number;
      limit?: number;
    }) => {
      try {
        return await getTopYieldPools(args);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return `❌ Failed to fetch yield pools: ${msg}`;
      }
    },
  });

  // Protocol TVL
  useCopilotAction({
    name: "getProtocolTvl",
    description:
      "Get TVL and breakdown for a protocol by slug from DefiLlama (e.g., 'aave', 'curve', 'uniswap').",
    parameters: [
      {
        name: "protocol",
        type: "string",
        description:
          "Required protocol slug as used in DefiLlama URLs (e.g., 'aave', 'curve', 'uniswap'). Not the human label; spaces should be removed / lowercased.",
        required: true,
      },
    ],
    handler: async ({ protocol }: { protocol: string }) => {
      try {
        return await getProtocolTvl({ protocol });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return `❌ Failed to fetch protocol TVL: ${msg}`;
      }
    },
  });

  // Chain TVL overview
  useCopilotAction({
    name: "getChainTvl",
    description:
      "Get TVL by chain from DefiLlama. Optionally filter by chain name or return top chains by TVL.",
    parameters: [
      {
        name: "chain",
        type: "string",
        description:
          "(Optional) Exact chain name to return only that chain's TVL (e.g., 'Ethereum', 'Arbitrum', 'Polygon'). If omitted, returns a ranking of chains.",
        required: false,
      },
      {
        name: "limit",
        type: "number",
        description:
          "(Optional) Number of chains to include when no specific chain is requested. Range: 1-50. Default: 10.",
        required: false,
      },
    ],
    handler: async ({
      chain,
      limit = 10,
    }: {
      chain?: string;
      limit?: number;
    }) => {
      try {
        return await getChainTvl({ chain, limit });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return `❌ Failed to fetch chain TVL: ${msg}`;
      }
    },
  });

  // Token price via DefiLlama coins API
  useCopilotAction({
    name: "getTokenPriceDefiLlama",
    description:
      "Get token price in USD using DefiLlama coins API. Provide either coingeckoId, or chain + address.",
    parameters: [
      {
        name: "coingeckoId",
        type: "string",
        description:
          "(Optional) CoinGecko asset id (e.g., 'ethereum', 'usd-coin', 'uniswap'). Use this OR (chain + address). Overrides chain/address if both provided.",
        required: false,
      },
      {
        name: "chain",
        type: "string",
        description:
          "(Optional) Lowercase chain identifier accepted by DefiLlama for the coins API (e.g., 'ethereum', 'arbitrum', 'polygon', 'base'). Must be paired with 'address'.",
        required: false,
      },
      {
        name: "address",
        type: "string",
        description:
          "(Optional) Token contract address (0x...) on the given chain for chain/address lookup. Exclude if using coingeckoId.",
        required: false,
      },
    ],
    handler: async ({
      coingeckoId,
      chain,
      address,
    }: {
      coingeckoId?: string;
      chain?: string;
      address?: string;
    }) => {
      try {
        return await getTokenPriceDefiLlama({ coingeckoId, chain, address });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return `❌ Failed to fetch price: ${msg}`;
      }
    },
  });

  // List protocols (basic)
  useCopilotAction({
    name: "listProtocols",
    description: "List protocols with optional search, category, limit.",
    parameters: [
      {
        name: "search",
        type: "string",
        description:
          "(Optional) Case-insensitive substring to filter protocol name or exact symbol (e.g., 'lend', 'GMX').",
        required: false,
      },
      {
        name: "category",
        type: "string",
        description:
          "(Optional) Exact category match (e.g., 'Lending', 'DEXes', 'Yield'). Filters to that vertical.",
        required: false,
      },
      {
        name: "chain",
        type: "string",
        description:
          "(Optional) Only include protocols that have TVL on this chain (case-insensitive exact chain name, e.g. 'Tron', 'Ethereum', 'Arbitrum').",
        required: false,
      },
      {
        name: "limit",
        type: "number",
        description:
          "(Optional) Max number of protocols to return. Range: 1-100. Default: 20.",
        required: false,
      },
    ],
    handler: async ({
      search,
      category,
      chain,
      limit,
    }: {
      search?: string;
      category?: string;
      chain?: string;
      limit?: number;
    }) => {
      try {
        return await listProtocols({ search, category, chain, limit });
      } catch (e) {
        return `❌ listProtocols error: ${e instanceof Error ? e.message : e}`;
      }
    },
  });

  // Largest protocols by TVL
  useCopilotAction({
    name: "getLargestProtocolsByTvl",
    description: "Get top protocols ranked by TVL.",
    parameters: [
      {
        name: "limit",
        type: "number",
        description:
          "(Optional) Number of top protocols by TVL to include. Range: 1-50. Default: 10.",
        required: false,
      },
    ],
    handler: async ({ limit }: { limit?: number }) => {
      try {
        return await getLargestProtocolsByTvl({ limit });
      } catch (e) {
        return `❌ getLargestProtocolsByTvl error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  // Protocol historical TVL
  useCopilotAction({
    name: "getProtocolHistoricalTvl",
    description: "Get protocol TVL history for last N days.",
    parameters: [
      {
        name: "protocol",
        type: "string",
        description:
          "Protocol slug (same as used in getProtocolTvl). Example: 'aave', 'curve'.",
        required: true,
      },
      {
        name: "days",
        type: "number",
        description:
          "(Optional) Number of most recent days to include from the historical series. Default: 30. Upper practical limit ~365.",
        required: false,
      },
    ],
    handler: async ({
      protocol,
      days,
    }: {
      protocol: string;
      days?: number;
    }) => {
      try {
        return await getProtocolHistoricalTvl({ protocol, days });
      } catch (e) {
        return `❌ getProtocolHistoricalTvl error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  // Protocol TVL change summary
  useCopilotAction({
    name: "getProtocolTvlChange",
    description: "Get protocol TVL change (1d/7d/30d).",
    parameters: [
      {
        name: "protocol",
        type: "string",
        description:
          "Protocol slug whose TVL change you want to summarize. Must exist on DefiLlama.",
        required: true,
      },
    ],
    handler: async ({ protocol }: { protocol: string }) => {
      try {
        return await getProtocolTvlChange({ protocol });
      } catch (e) {
        return `❌ getProtocolTvlChange error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  // Stablecoins overview
  useCopilotAction({
    name: "getStablecoinsOverview",
    description: "Get top stablecoins by circulating cap.",
    parameters: [
      {
        name: "limit",
        type: "number",
        description:
          "(Optional) Top N stablecoins to include by circulating supply (cap). Range: 1-50. Default: 15.",
        required: false,
      },
    ],
    handler: async ({ limit }: { limit?: number }) => {
      try {
        return await getStablecoinsOverview({ limit });
      } catch (e) {
        return `❌ getStablecoinsOverview error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  // Stablecoin chain distribution
  useCopilotAction({
    name: "getStablecoinChainDistribution",
    description: "Aggregate stablecoin cap per chain (top N).",
    parameters: [
      {
        name: "limit",
        type: "number",
        description:
          "(Optional) Number of chains to include by total stablecoin circulation. Range: 1-50. Default: 10.",
        required: false,
      },
    ],
    handler: async ({ limit }: { limit?: number }) => {
      try {
        return await getStablecoinChainDistribution({ limit });
      } catch (e) {
        return `❌ getStablecoinChainDistribution error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  // Top stablecoin chains (compact)
  useCopilotAction({
    name: "getTopStablecoinChains",
    description: "Top chains by stablecoin circulation (compact).",
    parameters: [
      {
        name: "limit",
        type: "number",
        description:
          "(Optional) Number of chains to list in compact format. Range: 1-25. Default: 5.",
        required: false,
      },
    ],
    handler: async ({ limit }: { limit?: number }) => {
      try {
        return await getTopStablecoinChains({ limit });
      } catch (e) {
        return `❌ getTopStablecoinChains error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  // Pool historical APY
  useCopilotAction({
    name: "getPoolHistoricalApy",
    description:
      "Get yield pool APY history (last N days). Use the pool id from pools list.",
    parameters: [
      {
        name: "pool",
        type: "string",
        description:
          "Exact pool identifier string from the yields API (the 'pool' field). Copy it from getTopYieldPools output.",
        required: true,
      },
      {
        name: "days",
        type: "number",
        description:
          "(Optional) Number of most recent daily APY points to show. Default: 14. Practical upper bound ~90.",
        required: false,
      },
    ],
    handler: async ({ pool, days }: { pool: string; days?: number }) => {
      try {
        return await getPoolHistoricalApy({ pool, days });
      } catch (e) {
        return `❌ getPoolHistoricalApy error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  // Pool current APY
  useCopilotAction({
    name: "getPoolCurrentApy",
    description: "Get current APY & TVL for a specific pool id.",
    parameters: [
      {
        name: "pool",
        type: "string",
        description:
          "Exact pool identifier string (as above). Use this for a one-line current APY/TVL snapshot.",
        required: true,
      },
    ],
    handler: async ({ pool }: { pool: string }) => {
      try {
        return await getPoolCurrentApy({ pool });
      } catch (e) {
        return `❌ getPoolCurrentApy error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  // Aggregated chain TVL summary
  useCopilotAction({
    name: "getAggregatedChainTvlSummary",
    description: "Top chains by TVL with dominance percentages.",
    parameters: [
      {
        name: "limit",
        type: "number",
        description:
          "(Optional) Number of top chains by TVL to include. Range: 1-30. Default: 10.",
        required: false,
      },
    ],
    handler: async ({ limit }: { limit?: number }) => {
      try {
        return await getAggregatedChainTvlSummary({ limit });
      } catch (e) {
        return `❌ getAggregatedChainTvlSummary error: ${
          e instanceof Error ? e.message : e
        }`;
      }
    },
  });

  const test = async () => {
    const res = await listProtocols({ search: "aptos" });
    console.log("Test getTopYieldPools:", res);
  };

  return null;
}
