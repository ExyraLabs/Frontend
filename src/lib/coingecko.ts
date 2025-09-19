/**
 * CoinGecko API utilities with automatic retry mechanism
 *
 * All API calls include automatic retry with exponential backoff for:
 * - Network timeouts and connection errors
 * - Rate limiting (429 errors)
 * - Server errors (5xx status codes)
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_COINGECKO_API_KEY: Your CoinGecko API key for authentication
 *   Get your API key from: https://www.coingecko.com/en/api/pricing
 */

import { TOKENS } from "@/constants/tokens";
import { fetchWithRetry, COINGECKO_RETRY_OPTIONS } from "./retry";

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  platforms: Record<string, string>;
  decimals?: number;
  tickers: unknown[];
}

export interface CoinDetailData {
  id: string;
  symbol: string;
  name: string;
  web_slug: string;
  asset_platform_id: string;
  platforms: Record<string, string>;
  detail_platforms: Record<
    string,
    {
      decimal_place: number;
      contract_address: string;
      geckoterminal_url?: string;
    }
  >;
  block_time_in_minutes: number;
  hashing_algorithm: string | null;
  categories: string[];
  preview_listing: boolean;
  public_notice: string | null;
  additional_notices: string[];
  tickers: Array<{
    base: string;
    target: string;
    market: {
      name: string;
      identifier: string;
      has_trading_incentive: boolean;
    };
    last: number;
    volume: number;
    converted_last: {
      btc: number;
      eth: number;
      usd: number;
    };
    converted_volume: {
      btc: number;
      eth: number;
      usd: number;
    };
    trust_score: string;
    bid_ask_spread_percentage: number;
    timestamp: string;
    last_traded_at: string;
    last_fetch_at: string;
    is_anomaly: boolean;
    is_stale: boolean;
    trade_url: string;
    token_info_url: string | null;
    coin_id: string;
    target_coin_id: string;
  }>;
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    whitepaper?: string;
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    snapshot_url: string | null;
    twitter_screen_name: string | null;
    facebook_username: string | null;
    bitcointalk_thread_identifier: string | null;
    telegram_channel_identifier: string | null;
    subreddit_url: string | null;
    repos_url: {
      github: string[];
      bitbucket: string[];
    };
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  country_origin: string | null;
  genesis_date: string | null;
  contract_address: string;
  sentiment_votes_up_percentage: number | null;
  sentiment_votes_down_percentage: number | null;
  watchlist_portfolio_users: number;
  market_cap_rank: number;
  status_updates: unknown[];
  last_updated: string;
}

export interface CoinGeckoResponse {
  success: boolean;
  data?: CoinData[];
  total?: number;
  filtered_by?: string;
  error?: string;
}

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
}

/**
 * Get standard headers for CoinGecko API requests
 */
export function getCoinGeckoHeaders(): HeadersInit {
  return {
    accept: "application/json",
    "x-cg-demo-api-key": process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "",
  };
}

/**
 * Fetch token price information by coin ID
 */
export async function fetchTokenPrice(coinId: string): Promise<{
  price: number;
  change24h: number;
  marketCap: number;
} | null> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

  const response = await fetchWithRetry(
    url,
    {
      headers: getCoinGeckoHeaders(),
    },
    COINGECKO_RETRY_OPTIONS
  );

  const data = await response.json();

  if (coinId in data) {
    const priceData = data[coinId];
    return {
      price: priceData.usd,
      change24h: priceData.usd_24h_change || 0,
      marketCap: priceData.usd_market_cap || 0,
    };
  }

  return null;
}

/**
 * Fetch detailed coin information by ID including decimal places
 */
export async function fetchCoinDetails(
  coinId: string
): Promise<CoinDetailData | null> {
  // console.log(`Fetching details for coin ID: ${coinId}`);

  const response = await fetchWithRetry(
    `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=true&market_data=false&community_data=false&developer_data=false&sparkline=false`,
    {
      headers: getCoinGeckoHeaders(),
    },
    COINGECKO_RETRY_OPTIONS
  );

  if (response.status === 404) {
    return null;
  }

  const res = await response.json();
  // console.log(res.tickers[0].market, "coinDetails");

  return res;
}

/**
 * Fetch all coins from CoinGecko API with platform information
 */
export async function fetchAllCoins(): Promise<CoinData[]> {
  const response = await fetchWithRetry(
    "https://api.coingecko.com/api/v3/coins/list?include_platform=true",
    {
      headers: getCoinGeckoHeaders(),
    },
    COINGECKO_RETRY_OPTIONS
  );

  return response.json();
}

/**
 * Find coins by symbol with detailed information including decimals
 */
export async function findCoinsBySymbolWithDecimals(
  symbol: string,
  platform: string = "ethereum"
): Promise<CoinData[]> {
  const allCoins = TOKENS;
  const matchingCoins = allCoins.filter(
    (coin) =>
      coin.symbol.toLowerCase() === symbol.toLowerCase() &&
      coin.platforms[platform] !== undefined
  );

  console.log("matchingCoins", matchingCoins);

  // Fetch detailed information for each matching coin
  const coinsWithDecimals = await Promise.all(
    matchingCoins.map(async (coin) => {
      const coinWithDecimals = await findCoinByIdWithDecimals(coin.id);
      // Always use the symbol from the original coin object
      if (coinWithDecimals) {
        return { ...coinWithDecimals, symbol: coin.symbol };
      }
      return coin;
    })
  );

  return coinsWithDecimals;
}

/**
 * Find coins by symbol
 */
export async function findCoinsBySymbol(symbol: string): Promise<CoinData[]> {
  // First check TOKENS for the symbol
  const localMatches = TOKENS.filter(
    (coin) => coin.symbol.toLowerCase() === symbol.toLowerCase()
  );
  if (localMatches.length > 0) {
    return localMatches;
  }
  // Fallback to API if not found locally
  const allCoins = await fetchAllCoins();
  return allCoins.filter(
    (coin) => coin.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

/**
 * Find a specific coin by ID with detailed information including decimals
 */
export async function findCoinByIdWithDecimals(
  coinId: string
): Promise<CoinData | null> {
  const coinDetails = await fetchCoinDetails(coinId);
  if (!coinDetails) return null;

  // Extract decimal information from detail_platforms
  let decimals: number | undefined;
  if (coinDetails.detail_platforms) {
    // Try to get decimals from the primary platform first
    const primaryPlatform = coinDetails.asset_platform_id;
    if (primaryPlatform && coinDetails.detail_platforms[primaryPlatform]) {
      decimals = coinDetails.detail_platforms[primaryPlatform].decimal_place;
    } else {
      // Try to get decimals from Ethereum, then from any platform
      const ethereumPlatform = coinDetails.detail_platforms.ethereum;
      if (ethereumPlatform && ethereumPlatform.decimal_place !== undefined) {
        decimals = ethereumPlatform.decimal_place;
      } else {
        // Fallback to first available platform
        const platformKeys = Object.keys(coinDetails.detail_platforms);
        if (platformKeys.length > 0) {
          const firstPlatform = coinDetails.detail_platforms[platformKeys[0]];
          if (firstPlatform && firstPlatform.decimal_place !== undefined) {
            decimals = firstPlatform.decimal_place;
          }
        }
      }
    }
  }

  return {
    id: coinDetails.id,
    symbol: coinDetails.symbol,
    name: coinDetails.name,
    platforms: coinDetails.platforms,
    tickers: coinDetails.tickers || [],
    decimals,
  };
}

/**
 * Find a specific coin by ID
 */
export async function findCoinById(coinId: string): Promise<CoinData | null> {
  // First check TOKENS for the id
  const localMatch = TOKENS.find((coin) => coin.id === coinId);
  if (localMatch) {
    return localMatch;
  }
  // Fallback to API if not found locally
  const allCoins = await fetchAllCoins();
  return allCoins.find((coin) => coin.id === coinId) || null;
}

/**
 * Search coins by name (partial match) with detailed information including decimals
 */
export async function searchCoinsByNameWithDecimals(
  searchTerm: string
): Promise<CoinData[]> {
  const allCoins = await fetchAllCoins();
  const matchingCoins = allCoins.filter((coin) =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch detailed information for each matching coin (limit to first 10 for performance)
  const limitedCoins = matchingCoins.slice(0, 10);
  const coinsWithDecimals = await Promise.all(
    limitedCoins.map(async (coin) => {
      const coinWithDecimals = await findCoinByIdWithDecimals(coin.id);
      return coinWithDecimals || coin;
    })
  );

  return coinsWithDecimals;
}

/**
 * Search coins by name (partial match)
 */
export async function searchCoinsByName(
  searchTerm: string
): Promise<CoinData[]> {
  // First check TOKENS for the name
  const localMatches = TOKENS.filter((coin) =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (localMatches.length > 0) {
    return localMatches;
  }
  // Fallback to API if not found locally
  const allCoins = await fetchAllCoins();
  return allCoins.filter((coin) =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * Get all contract addresses and decimals for tokens matching a symbol on a platform
 * Returns all matches instead of just the first one
 */
export async function getAllContractAddressesWithDecimals(
  symbol: string,
  platform: string = "ethereum"
): Promise<Array<{
  id: string;
  address: string;
  decimals?: number;
  name: string;
  symbol: string;
}> | null> {
  // Return default values for ETH without API call
  if (symbol.toLowerCase() === "eth") {
    return [
      {
        id: "ethereum",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH native address
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
      },
    ];
  }

  if (symbol.toLowerCase() === "usdt") {
    if (platform === "binance-smart-chain" || platform === "bsc") {
      return [
        {
          id: "tether",
          symbol: "USDT",
          name: "Binance Bridged USDT (BNB Smart Chain)",
          address: "0x55d398326f99059ff775485246999027b3197955",
          decimals: 18,
        },
      ];
    }
  }

  // Return default values for BNB without API call
  if (symbol.toLowerCase() === "bnb") {
    // Check if the platform is Binance Smart Chain
    if (platform === "binance-smart-chain" || platform === "bsc") {
      return [
        {
          id: "binancecoin",
          address: "0x0000000000000000000000000000000000000000", // BNB native address on BSC
          decimals: 18,
          name: "BNB",
          symbol: "BNB",
        },
      ];
    }
    // For Ethereum platform, return the wrapped BNB contract
    if (platform === "ethereum") {
      return [
        {
          id: "binancecoin",
          address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", // BNB token on Ethereum
          decimals: 18,
          name: "BNB",
          symbol: "BNB",
        },
      ];
    }
  }

  const coins = await findCoinsBySymbolWithDecimals(symbol, platform);

  // Return all coins that have the platform, not just the first one
  const validCoins = coins.filter((coin) => coin.platforms[platform]);

  if (validCoins.length === 0) {
    return null;
  }

  return validCoins.map((coin) => ({
    id: coin.id,
    address: coin.platforms[platform],
    decimals: coin.decimals,
    name: coin.name,
    symbol: coin.symbol,
  }));
}

/**
 * Get contract address and decimals for a specific token on a specific platform
 */
export async function getContractAddressWithDecimals(
  symbol: string,
  platform: string = "ethereum"
): Promise<{
  address: string;
  decimals?: number;
  name: string;
  symbol: string;
} | null> {
  // Return default values for ETH without API call
  if (symbol.toLowerCase() === "eth") {
    return {
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH native address
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH",
    };
  }
  if (symbol.toLowerCase() === "usdt") {
    if (platform === "binance-smart-chain" || platform === "bsc") {
      return {
        symbol: "USDT",
        name: "Binance Bridged USDT (BNB Smart Chain)",

        address: "0x55d398326f99059ff775485246999027b3197955",
      };
    }
  }

  // Return default values for BNB without API call
  if (symbol.toLowerCase() === "bnb") {
    // Check if the platform is Binance Smart Chain
    if (platform === "binance-smart-chain" || platform === "bsc") {
      return {
        address: "0x0000000000000000000000000000000000000000", // BNB native address on BSC
        decimals: 18,
        name: "BNB",
        symbol: "BNB",
      };
    }
    // For Ethereum platform, return the wrapped BNB contract
    if (platform === "ethereum") {
      return {
        address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", // BNB token on Ethereum
        decimals: 18,
        name: "BNB",
        symbol: "BNB",
      };
    }
  }

  const coins = await findCoinsBySymbolWithDecimals(symbol, platform);

  // Look for the most relevant coin (prefer main tokens over bridged versions)
  const mainCoin = coins.find(
    (coin) =>
      !coin.name.toLowerCase().includes("bridged") &&
      !coin.name.toLowerCase().includes("wrapped") &&
      coin.platforms[platform]
  );

  if (mainCoin && mainCoin.platforms[platform]) {
    console.log(mainCoin, "coin");
    return {
      address: mainCoin.platforms[platform],
      decimals: mainCoin.decimals,
      name: mainCoin.name,
      symbol: mainCoin.symbol,
    };
  }

  return null;
}

/**
 * Get contract address for a specific token on a specific platform
 */
export async function getContractAddress(
  symbol: string,
  platform: string = "ethereum"
): Promise<string | null> {
  const coins = await findCoinsBySymbol(symbol);

  // Look for the most relevant coin (prefer main tokens over bridged versions)
  const mainCoin = coins.find(
    (coin) =>
      !coin.name.toLowerCase().includes("bridged") &&
      !coin.name.toLowerCase().includes("wrapped") &&
      coin.platforms[platform]
  );

  if (mainCoin && mainCoin.platforms[platform]) {
    return mainCoin.platforms[platform];
  }

  // Fallback to any coin with the platform
  const anyCoin = coins.find((coin) => coin.platforms[platform]);
  if (anyCoin && anyCoin.platforms[platform]) {
    return anyCoin.platforms[platform];
  }

  return null;
}

/**
 * Get decimals for a specific token on a specific platform
 */
export async function getTokenDecimals(
  symbol: string,
  platform: string = "ethereum"
): Promise<number | null> {
  const contractInfo = await getContractAddressWithDecimals(symbol, platform);
  return contractInfo?.decimals || null;
}

/**
 * Get decimals for a specific coin ID on a specific platform
 */
export async function getTokenDecimalsByCoinId(
  coinId: string,
  platform: string = "ethereum"
): Promise<number | null> {
  const coinDetails = await fetchCoinDetails(coinId);
  if (!coinDetails || !coinDetails.detail_platforms) return null;

  const platformData = coinDetails.detail_platforms[platform];
  return platformData?.decimal_place || null;
}

/**
 * Get all available platforms for a token symbol
 */
export async function getAvailablePlatforms(symbol: string): Promise<string[]> {
  const coins = await findCoinsBySymbol(symbol);
  const platforms = new Set<string>();

  coins.forEach((coin) => {
    Object.keys(coin.platforms).forEach((platform) => {
      if (coin.platforms[platform]) {
        platforms.add(platform);
      }
    });
  });

  return Array.from(platforms);
}

// fetchCoinDetails("skyops").then((res) => console.log(res, "skyops details"));

/**
 * Fetch the image URL for a coin by coin ID
 * Returns the large image URL if available, otherwise null
 */
export async function fetchCoinImageById(
  coinId: string
): Promise<string | null> {
  const coinDetails = await fetchCoinDetails(coinId);
  return coinDetails?.image?.large || null;
}

/**
 * Fetch the image URL for a coin by symbol and optionally by name for disambiguation
 * Returns the large image URL if available, otherwise null
 */
export async function fetchCoinImage(
  symbol: string,
  name?: string
): Promise<string | null> {
  const coins = await findCoinsBySymbol(symbol);
  if (coins.length === 0) return null;

  let targetCoin = coins[0]; // Default fallback

  // If name is provided, try to find a more specific match
  if (name && coins.length > 1) {
    // First try exact name match (case insensitive)
    const exactMatch = coins.find(
      (coin) => coin.name.toLowerCase() === name.toLowerCase()
    );

    if (exactMatch) {
      targetCoin = exactMatch;
    } else {
      // Try partial name match
      const partialMatch = coins.find(
        (coin) =>
          coin.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(coin.name.toLowerCase())
      );

      if (partialMatch) {
        targetCoin = partialMatch;
      }
    }
  }

  const coinDetails = await fetchCoinDetails(targetCoin.id);
  return coinDetails?.image?.large || null;
}

/**
 * Fetch images for multiple coins by their coin IDs
 * Returns a map of coin ID to image URL
 */
export async function fetchMultipleCoinImages(
  coinIds: string[]
): Promise<Record<string, string | null>> {
  const imagePromises = coinIds.map(async (coinId) => {
    try {
      const image = await fetchCoinImageById(coinId);
      return { coinId, image };
    } catch (error) {
      console.warn(`Failed to fetch image for coin ${coinId}:`, error);
      return { coinId, image: null };
    }
  });

  const results = await Promise.all(imagePromises);

  return results.reduce((acc, { coinId, image }) => {
    acc[coinId] = image;
    return acc;
  }, {} as Record<string, string | null>);
}

// findCoinsBySymbol("AGT").then((res) => {
//   console.log(res, "AGT matches");
//   if (res.length > 0) {
//     fetchCoinDetails(res[2].id).then((d) =>
//       console.log(d?.image.large, "AGT details")
//     );
//   }
// });

/**
 * Fetch all available categories from CoinGecko
 */
export async function fetchCategories(): Promise<
  Array<{ id: string; name: string }>
> {
  const response = await fetchWithRetry(
    "https://api.coingecko.com/api/v3/coins/categories/list",
    {
      headers: getCoinGeckoHeaders(),
    },
    COINGECKO_RETRY_OPTIONS
  );

  return response.json();
}

/**
 * Fetch coins in a specific category
 */
export async function fetchCoinsByCategory(
  categoryId: string
): Promise<CoinData[]> {
  const response = await fetchWithRetry(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${categoryId}&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en`,
    {
      headers: getCoinGeckoHeaders(),
    },
    COINGECKO_RETRY_OPTIONS
  );

  const data: CoinMarketData[] = await response.json();

  // Transform the market data to match CoinData interface
  return data.map((coin: CoinMarketData) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    platforms: {}, // Market data doesn't include platforms, so we'll leave it empty
    tickers: [], // Market data doesn't include tickers
  }));
}

// getAllContractAddressesWithDecimals("AGT", "binance-smart-chain").then((res) =>
//   console.log(res, "usdt bsc")
// );

// findCoinsBySymbolWithDecimals("AGT", "binance-smart-chain").then((res) =>
//   console.log(res, "bnb coins")
// );
// findCoinByIdWithDecimals("aiville-governance-token").then((res) =>
//   console.log(res, "bnb coins")
// );
