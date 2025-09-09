import {
  findCoinsBySymbol,
  fetchCoinDetails,
  fetchTokenPrice,
  searchCoinsByName,
  getContractAddress,
  getTokenDecimals,
  getAvailablePlatforms,
  fetchCoinsByCategory,
} from "@/lib/coingecko";
import { getApiErrorMessage } from "@/lib/utils";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export const coingecko: any[] = [
  {
    name: "GetTokenPrice",
    description:
      "Get the current price of a cryptocurrency token using CoinGecko API by the coin_id. Returns price, 24h change, and market cap information.",
    parameters: [
      {
        name: "coin_id",
        type: "string",
        description:
          "The CoinGecko coin ID (e.g., 'ethereum', 'bitcoin', 'usd-coin')",
        required: true,
      },
    ],
    handler: async ({ coin_id }: { coin_id: string }) => {
      try {
        console.log(`[getTokenPriceById] Called with coin_id: ${coin_id}`);
        const coinId = coin_id.toLowerCase();
        if (!coinId) {
          const errorMsg = "❌ Error: coin_id parameter is required.";
          console.log(`[getTokenPriceById] ${errorMsg}`);
          return errorMsg;
        }

        const priceData = await fetchTokenPrice(coinId);

        if (priceData) {
          const { price, change24h, marketCap } = priceData;

          let result = `💰 ${coinId.toUpperCase()} Price Information:\n`;
          result += `💵 Price: $${price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}\n`;
          result += `📈 24h Change: ${
            change24h >= 0 ? "+" : ""
          }${change24h.toFixed(2)}%\n`;
          if (marketCap > 0) {
            result += `🏦 Market Cap: $${marketCap.toLocaleString()}\n`;
          }

          console.log(`[getTokenPriceById] Returning result:`, result);
          return result;
        } else {
          const errorMsg = `❌ Token '${coinId}' not found. Please use the fetchCoinId action first to get the correct coin_id, or try common IDs like 'bitcoin', 'ethereum', 'usd-coin'.`;
          console.log(`[getTokenPriceById] ${errorMsg}`);
          return { error: true, message: errorMsg };
        }
      } catch (error) {
        console.error(
          `[getTokenPriceById] Error fetching price for ${coin_id}:`,
          error
        );

        const errorMsg = getApiErrorMessage(
          error,
          "fetching price for",
          coin_id
        );
        console.log(`[getTokenPriceById] Returning error:`, errorMsg);
        return { error: true, message: errorMsg };
      }
    },
  },
  {
    name: "GetToken",
    description: "Fetches coin ID from the coin gecko API for a given token  .",
    parameters: [
      {
        name: "token_symbol",
        type: "string",
        description: "The symbol of the token to fetch data for.",
        required: true,
      },
    ],
    handler: async ({ token_symbol }: { token_symbol: string }) => {
      try {
        console.log(`[fetchCoinId] Called with token_symbol: ${token_symbol}`);
        // Use utility function to find coins by symbol
        const filteredCoins = await findCoinsBySymbol(token_symbol);

        if (filteredCoins.length === 0) {
          return {
            error: true,
            message: `🔍 **Coin not found**: "${token_symbol}" didn't match any cryptocurrency. Try using the full name (e.g., "Bitcoin" instead of "BTC") or verify the spelling.`,
          };
        }

        let result = `🔍 Found ${filteredCoins.length} match(es) for "${token_symbol}":\n\n`;
        filteredCoins.slice(0, 5).forEach((coin, index) => {
          result += `${index + 1}. **${
            coin.name
          }** (${coin.symbol.toUpperCase()})\n`;
          result += `   🆔 Coin ID: \`${coin.id}\`\n\n`;
        });

        if (filteredCoins.length > 5) {
          result += `... and ${filteredCoins.length - 5} more results.\n\n`;
        }

        result += `💡 Use the coin ID (e.g., "${filteredCoins[0].id}") with getTokenPriceById to get price information.`;

        console.log(`[fetchCoinId] Returning result:`, result);
        return result;
      } catch (error) {
        console.error(`[fetchCoinId] Error:`, error);

        const userFriendlyError = getApiErrorMessage(
          error,
          "searching for",
          token_symbol
        );
        console.log(`[fetchCoinId] Returning error:`, userFriendlyError);
        return { error: true, message: userFriendlyError };
      }
    },
  },
  {
    name: "getCoinDetails",
    description:
      "Get detailed information about a cryptocurrency including description, links, categories, and platform information.",
    parameters: [
      {
        name: "coin_id",
        type: "string",
        description:
          "The CoinGecko coin ID (e.g., 'ethereum', 'bitcoin', 'usd-coin')",
        required: true,
      },
    ],
    handler: async ({ coin_id }: { coin_id: string }) => {
      try {
        console.log(`[getCoinDetails] Called with coin_id: ${coin_id}`);
        const coinDetails = await fetchCoinDetails(coin_id);

        if (!coinDetails) {
          return {
            error: true,
            message: `❌ Coin with ID "${coin_id}" not found. Please verify the coin ID is correct.`,
          };
        }

        let result = `📋 **${
          coinDetails.name
        } (${coinDetails.symbol.toUpperCase()})** Details:\n\n`;

        if (coinDetails.description?.en) {
          const description = coinDetails.description.en.replace(
            /<[^>]*>/g,
            ""
          ); // Remove HTML tags
          result += `📝 **Description:** ${description.substring(0, 300)}${
            description.length > 300 ? "..." : ""
          }\n\n`;
        }

        if (coinDetails.categories?.length > 0) {
          result += `🏷️ **Categories:** ${coinDetails.categories
            .slice(0, 5)
            .join(", ")}\n\n`;
        }

        if (coinDetails.market_cap_rank) {
          result += `📊 **Market Cap Rank:** #${coinDetails.market_cap_rank}\n\n`;
        }

        if (coinDetails.links?.homepage?.[0]) {
          result += `🌐 **Website:** ${coinDetails.links.homepage[0]}\n\n`;
        }

        if (Object.keys(coinDetails.platforms).length > 0) {
          result += `⛓️ **Available Platforms:** ${Object.keys(
            coinDetails.platforms
          )
            .slice(0, 5)
            .join(", ")}\n\n`;
        }

        // Add available exchanges/markets information
        if (coinDetails.tickers && coinDetails.tickers.length > 0) {
          result += `💱 **Available Exchanges:**\n`;

          // Get unique exchanges and sort by volume
          const exchanges = coinDetails.tickers
            .filter((ticker) => ticker.market && ticker.market.name)
            .sort(
              (a, b) =>
                (b.converted_volume?.usd || 0) - (a.converted_volume?.usd || 0)
            )
            .slice(0, 8); // Limit to top 8 exchanges

          if (exchanges.length > 0) {
            exchanges.forEach((ticker, index) => {
              const volume = ticker.converted_volume?.usd
                ? `$${ticker.converted_volume.usd.toLocaleString()}`
                : "N/A";
              const pair = `${ticker.base}/${ticker.target}`;
              result += `${index + 1}. **${
                ticker.market.name
              }** - ${pair} (24h Vol: ${volume})\n`;
            });
            result += `\n💡 These exchanges offer trading pairs for ${coinDetails.symbol.toUpperCase()}.\n\n`;
          } else {
            result += `No major exchanges found with reliable data.\n\n`;
          }
        }

        console.log(`[getCoinDetails] Returning details for ${coin_id}`);
        return result;
      } catch (error) {
        console.error(`[getCoinDetails] Error:`, error);
        const errorMsg = getApiErrorMessage(
          error,
          "fetching details for",
          coin_id
        );
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  },
  {
    name: "searchCoinsByName",
    description:
      "Search for cryptocurrencies by name using partial matching. Useful when you know part of the coin name.",
    parameters: [
      {
        name: "search_term",
        type: "string",
        description:
          "Part of the coin name to search for (e.g., 'bitcoin', 'ethereum', 'dogecoin')",
        required: true,
      },
    ],
    handler: async ({ search_term }: { search_term: string }) => {
      try {
        console.log(
          `[searchCoinsByName] Called with search_term: ${search_term}`
        );
        const matchingCoins = await searchCoinsByName(search_term);

        if (matchingCoins.length === 0) {
          return {
            error: true,
            message: `🔍 No coins found matching "${search_term}". Try using different keywords or check the spelling.`,
          };
        }

        let result = `🔍 Found ${matchingCoins.length} coin(s) matching "${search_term}":\n\n`;
        matchingCoins.slice(0, 10).forEach((coin, index) => {
          result += `${index + 1}. **${
            coin.name
          }** (${coin.symbol.toUpperCase()})\n`;
          result += `   🆔 Coin ID: \`${coin.id}\`\n\n`;
        });

        if (matchingCoins.length > 10) {
          result += `... and ${matchingCoins.length - 10} more results.\n\n`;
        }

        result += `💡 Use the coin ID with other actions to get more information.`;

        console.log(
          `[searchCoinsByName] Found ${matchingCoins.length} matches`
        );
        return result;
      } catch (error) {
        console.error(`[searchCoinsByName] Error:`, error);
        const errorMsg = getApiErrorMessage(
          error,
          "searching for",
          search_term
        );
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  },
  {
    name: "getContractAddress",
    description:
      "Get the contract address for a token on a specific blockchain platform (e.g., Ethereum, BSC, Polygon).",
    parameters: [
      {
        name: "token_symbol",
        type: "string",
        description: "The symbol of the token (e.g., 'USDC', 'LINK', 'UNI')",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description:
          "The blockchain platform (default: 'ethereum'). Common values: 'ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one'",
        required: false,
      },
    ],
    handler: async ({
      token_symbol,
      platform = "ethereum",
    }: {
      token_symbol: string;
      platform?: string;
    }) => {
      try {
        console.log(
          `[getContractAddress] Called with token_symbol: ${token_symbol}, platform: ${platform}`
        );
        const contractAddress = await getContractAddress(
          token_symbol,
          platform
        );

        if (!contractAddress) {
          return {
            error: true,
            message: `❌ Contract address not found for "${token_symbol}" on ${platform}. The token might not be available on this platform.`,
          };
        }

        let result = `📄 **Contract Address for ${token_symbol.toUpperCase()}**:\n\n`;
        result += `⛓️ **Platform:** ${platform}\n`;
        result += `📋 **Address:** \`${contractAddress}\`\n\n`;
        result += `💡 You can use this address to interact with the token on ${platform}.`;

        console.log(
          `[getContractAddress] Found address for ${token_symbol} on ${platform}`
        );
        return result;
      } catch (error) {
        console.error(`[getContractAddress] Error:`, error);
        const errorMsg = getApiErrorMessage(
          error,
          "getting contract address for",
          `${token_symbol} on ${platform}`
        );
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  },
  {
    name: "getTokenDecimals",
    description:
      "Get the number of decimal places for a token on a specific blockchain platform. Important for calculating token amounts.",
    parameters: [
      {
        name: "token_symbol",
        type: "string",
        description: "The symbol of the token (e.g., 'USDC', 'LINK', 'UNI')",
        required: true,
      },
      {
        name: "platform",
        type: "string",
        description:
          "The blockchain platform (default: 'ethereum'). Common values: 'ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one'",
        required: false,
      },
    ],
    handler: async ({
      token_symbol,
      platform = "ethereum",
    }: {
      token_symbol: string;
      platform?: string;
    }) => {
      try {
        console.log(
          `[getTokenDecimals] Called with token_symbol: ${token_symbol}, platform: ${platform}`
        );
        const decimals = await getTokenDecimals(token_symbol, platform);

        if (decimals === null) {
          return {
            error: true,
            message: `❌ Decimal information not found for "${token_symbol}" on ${platform}. The token might not be available on this platform.`,
          };
        }

        let result = `🔢 **Token Decimals for ${token_symbol.toUpperCase()}**:\n\n`;
        result += `⛓️ **Platform:** ${platform}\n`;
        result += `🔢 **Decimals:** ${decimals}\n\n`;
        result += `💡 This means the smallest unit is 1/${Math.pow(
          10,
          decimals
        )} ${token_symbol.toUpperCase()}.`;

        console.log(
          `[getTokenDecimals] Found ${decimals} decimals for ${token_symbol} on ${platform}`
        );
        return result;
      } catch (error) {
        console.error(`[getTokenDecimals] Error:`, error);
        const errorMsg = getApiErrorMessage(
          error,
          "getting decimals for",
          `${token_symbol} on ${platform}`
        );
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  },
  {
    name: "getAvailablePlatforms",
    description:
      "Get all blockchain platforms where a specific token is available. Useful to see on which networks a token can be found.",
    parameters: [
      {
        name: "token_symbol",
        type: "string",
        description: "The symbol of the token (e.g., 'USDC', 'LINK', 'UNI')",
        required: true,
      },
    ],
    handler: async ({ token_symbol }: { token_symbol: string }) => {
      try {
        console.log(
          `[getAvailablePlatforms] Called with token_symbol: ${token_symbol}`
        );
        const platforms = await getAvailablePlatforms(token_symbol);

        if (platforms.length === 0) {
          return {
            error: true,
            message: `❌ No platforms found for "${token_symbol}". Please verify the token symbol is correct.`,
          };
        }

        let result = `⛓️ **Available Platforms for ${token_symbol.toUpperCase()}**:\n\n`;
        result += `📊 **Total Platforms:** ${platforms.length}\n\n`;
        result += `🌐 **Platforms:**\n`;
        platforms.forEach((platform, index) => {
          result += `${index + 1}. ${platform}\n`;
        });

        result += `\n💡 Use these platform names with getContractAddress or getTokenDecimals actions.`;

        console.log(
          `[getAvailablePlatforms] Found ${platforms.length} platforms for ${token_symbol}`
        );
        return result;
      } catch (error) {
        console.error(`[getAvailablePlatforms] Error:`, error);
        const errorMsg = getApiErrorMessage(
          error,
          "getting platforms for",
          token_symbol
        );
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  },
  {
    name: "getCoinsByCategory",
    description:
      "Get all coins in a specific category from CoinGecko. Useful for finding coins in categories like 'defi', 'meme', 'layer-1', etc.",
    parameters: [
      {
        name: "category_id",
        type: "string",
        description:
          "The category ID (e.g., 'defi', 'meme-token', 'layer-1', 'smart-contract-platform')",
        required: true,
      },
    ],
    handler: async ({ category_id }: { category_id: string }) => {
      try {
        console.log(
          `[getCoinsByCategory] Called with category_id: ${category_id}`
        );
        const coins = await fetchCoinsByCategory(category_id);

        if (coins.length === 0) {
          return {
            error: true,
            message: `❌ No coins found in category "${category_id}". Please verify the category ID is correct. You can use common categories like 'defi', 'meme-token', 'layer-1', 'smart-contract-platform', etc.`,
          };
        }

        let result = `🏷️ **Coins in Category: ${category_id.toUpperCase()}**\n\n`;
        result += `📊 **Total Coins:** ${coins.length}\n\n`;
        result += `💰 **Top Coins:**\n`;

        // Show top 20 coins to avoid overwhelming output
        const topCoins = coins.slice(0, 20);
        topCoins.forEach((coin, index) => {
          result += `${index + 1}. **${
            coin.name
          }** (${coin.symbol.toUpperCase()})\n`;
          result += `   🆔 Coin ID: \`${coin.id}\`\n\n`;
        });

        if (coins.length > 20) {
          result += `... and ${coins.length - 20} more coins.\n\n`;
        }

        result += `💡 Use the coin ID with getTokenPriceById to get price information for any of these coins.`;

        console.log(
          `[getCoinsByCategory] Found ${coins.length} coins in category ${category_id}`
        );
        return result;
      } catch (error) {
        console.error(`[getCoinsByCategory] Error:`, error);
        const errorMsg = getApiErrorMessage(
          error,
          "fetching coins for category",
          category_id
        );
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  },
];
