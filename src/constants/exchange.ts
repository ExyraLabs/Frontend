import axios from "axios";

export const binanceBaseUrl = "https://fapi.binance.com/fapi/v1/";
export const binanceAPI = "https://fapi.binance.com/fapi/v1/markPriceKlines";
export const bybitBaseUrl = "https://api.bybit.com/v5/";
export const bybitAPI = "https://api.bybit.com/v5/market/kline";

// Function to fetch market data for a symbol within a specific time range with retry mechanism
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchMarketDataWithRetry: any = async (
  symbol: { symbol: string; index: number },
  api: string,
  interval: string,
  limit: number,
  startTime: number,
  endTime: number,
  retryCount = 0
) => {
  const endpoint = async () => {
    switch (api) {
      case "Binance":
        return `${binanceAPI}?symbol=${symbol.symbol}&interval=${interval}&limit=${limit}`;

      case "Bybit":
        return `${bybitAPI}?symbol=${symbol.symbol}&interval=${interval}&limit=${limit}&start=${startTime}`;

      default:
        break;
    }
  };

  const API = (await endpoint()) as string;

  try {
    const res = await axios.get(API, {
      timeout: 10000, // Set the timeout to 10 seconds (adjust as needed)
    });

    if (api == "Binance") {
      return res.data;
    } else if (api == "Bybit") {
      return res.data.result.list;
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (
      (error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.code == "ECONNABORTED") &&
      retryCount < 3
    ) {
      console.log(
        `${error.code}: Retrying ${retryCount} times  for ${symbol.symbol} ${symbol.index}`
      );
      await wait(2 ** retryCount * 2000); // Exponential backoff
      return fetchMarketDataWithRetry(
        symbol,
        api,
        interval,
        limit,
        startTime,
        endTime,
        retryCount + 1
      );
    } else {
      console.error(
        "Failed to fetch symbol data",
        error.message,
        error.code,
        error.response?.data?.msg
      );
    }
  }
};

// Utility function for exponential backoff wait
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
