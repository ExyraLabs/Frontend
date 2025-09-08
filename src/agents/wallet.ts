import axios from "axios";
import crypto from "crypto";
import { getUserApiKeys } from "@/actions/keys";

export const binanceBaseUrl = "https://fapi.binance.com/fapi/v1/";
export const binanceAPI = "https://fapi.binance.com/fapi/v1/markPriceKlines";
export const bybitBaseUrl = "https://api.bybit.com/v5/";
export const bybitAPI = "https://api.bybit.com/v5/market/kline";

// Helper function to create Binance signature
const createBinanceSignature = (
  queryString: string,
  secretKey: string
): string => {
  return crypto
    .createHmac("sha256", secretKey)
    .update(queryString)
    .digest("hex");
};

// Helper function to create Bybit signature
const createBybitSignature = (
  timestamp: number,
  apiKey: string,
  recvWindow: number,
  queryString: string,
  secretKey: string
): string => {
  const prehashString = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  return crypto
    .createHmac("sha256", secretKey)
    .update(prehashString)
    .digest("hex");
};

export const getBalance = async (
  exchange: string = "Bybit",
  address?: string
) => {
  try {
    if (!address) {
      throw new Error("User wallet address is required to fetch API keys");
    }

    // Fetch API keys from database
    const keysResult = await getUserApiKeys(address);
    if (!keysResult.success || !keysResult.keys) {
      throw new Error(keysResult.message || "Failed to retrieve API keys");
    }

    const { binance, bybit } = keysResult.keys;

    if (exchange === "Bybit") {
      if (!bybit.apiKey || !bybit.secretKey) {
        throw new Error(
          "Bybit API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now() - 3000;
      const recvWindow = 5000;
      const queryString = `accountType=UNIFIED&coin=USDT`;

      const signature = createBybitSignature(
        timestamp,
        bybit.apiKey,
        recvWindow,
        queryString,
        bybit.secretKey
      );

      const res = await axios.get(
        `${bybitBaseUrl}account/wallet-balance?${queryString}`,
        {
          headers: {
            "X-BAPI-SIGN": signature,
            "X-BAPI-API-KEY": bybit.apiKey,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recvWindow,
          },
        }
      );

      console.log(res.data.result.list[0].totalAvailableBalance);
      return res.data.result.list[0].totalAvailableBalance;
    } else if (exchange === "Binance") {
      if (!binance.apiKey || !binance.secretKey) {
        throw new Error(
          "Binance API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now();
      const recvWindow = 5000;
      const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;

      const signature = createBinanceSignature(queryString, binance.secretKey);

      const res = await axios.get(
        `https://fapi.binance.com/fapi/v3/account?${queryString}&signature=${signature}`,
        {
          headers: {
            "X-MBX-APIKEY": binance.apiKey,
          },
        }
      );

      console.log(res.data.availableBalance);
      return res.data.availableBalance;
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error.response ? error.response.statusText : error.message);
    throw error; // Re-throw to allow caller to handle
  }
};
export const getPositionInfo = async (
  symbol: string,
  exchange: string = "Bybit",
  address?: string
) => {
  try {
    if (!address) {
      throw new Error("User wallet address is required to fetch API keys");
    }

    // Fetch API keys from database
    const keysResult = await getUserApiKeys(address);
    if (!keysResult.success || !keysResult.keys) {
      throw new Error(keysResult.message || "Failed to retrieve API keys");
    }

    const { binance, bybit } = keysResult.keys;

    if (exchange === "Bybit") {
      if (!bybit.apiKey || !bybit.secretKey) {
        throw new Error(
          "Bybit API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now() - 5000;
      const recvWindow = 10000;
      const queryString = `category=linear&symbol=${symbol}`;

      const signature = createBybitSignature(
        timestamp,
        bybit.apiKey,
        recvWindow,
        queryString,
        bybit.secretKey
      );

      const res = await axios.get(
        `${bybitBaseUrl}/position/list?${queryString}`,
        {
          headers: {
            "X-BAPI-SIGN": signature,
            "X-BAPI-API-KEY": bybit.apiKey,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recvWindow,
          },
        }
      );

      console.log(res.data.result.list);
      if (res.data.retMsg.includes("OK")) {
        return res.data.result.list[0];
      } else {
        console.error(res.data.retMsg);
      }
    } else if (exchange === "Binance") {
      if (!binance.apiKey || !binance.secretKey) {
        throw new Error(
          "Binance API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now();
      const recvWindow = 5000;
      const queryString = `symbol=${symbol}&timestamp=${timestamp}&recvWindow=${recvWindow}`;

      const signature = createBinanceSignature(queryString, binance.secretKey);

      const res = await axios.get(
        `https://fapi.binance.com/fapi/v2/positionRisk?${queryString}&signature=${signature}`,
        {
          headers: {
            "X-MBX-APIKEY": binance.apiKey,
          },
        }
      );

      console.log(res.data);
      if (res.data && Array.isArray(res.data)) {
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        return res.data.find((pos: any) => pos.symbol === symbol);
      }
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error?.code, error?.message);
    throw error; // Re-throw to allow caller to handle
  }
};
export const getTradeHistory = async (
  symbol: string,
  startTime: string,
  endTime: string,
  exchange: string = "Bybit",
  address?: string
) => {
  try {
    if (!address) {
      throw new Error("User wallet address is required to fetch API keys");
    }

    // Fetch API keys from database
    const keysResult = await getUserApiKeys(address);
    if (!keysResult.success || !keysResult.keys) {
      throw new Error(keysResult.message || "Failed to retrieve API keys");
    }

    const { binance, bybit } = keysResult.keys;

    if (exchange === "Bybit") {
      if (!bybit.apiKey || !bybit.secretKey) {
        throw new Error(
          "Bybit API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now() - 5000;
      const recvWindow = 10000;
      const queryString = `category=linear&symbol=${symbol}&startTime=${new Date(
        startTime
      ).getTime()}&endTime=${new Date(endTime).getTime()}`;

      const signature = createBybitSignature(
        timestamp,
        bybit.apiKey,
        recvWindow,
        queryString,
        bybit.secretKey
      );

      const res = await axios.get(
        `${bybitBaseUrl}/position/closed-pnl?${queryString}`,
        {
          headers: {
            "X-BAPI-SIGN": signature,
            "X-BAPI-API-KEY": bybit.apiKey,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recvWindow,
          },
        }
      );

      console.log(res.data.result.list);
      if (res.data.retMsg.includes("OK")) {
        return res.data.result.list[0];
      } else {
        console.error(res.data.retMsg);
      }
    } else if (exchange === "Binance") {
      if (!binance.apiKey || !binance.secretKey) {
        throw new Error(
          "Binance API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now();
      const recvWindow = 5000;
      const startTimeMs = new Date(startTime).getTime();
      const endTimeMs = new Date(endTime).getTime();
      const queryString = `symbol=${symbol}&startTime=${startTimeMs}&endTime=${endTimeMs}&timestamp=${timestamp}&recvWindow=${recvWindow}`;

      const signature = createBinanceSignature(queryString, binance.secretKey);

      const res = await axios.get(
        `https://fapi.binance.com/fapi/v1/userTrades?${queryString}&signature=${signature}`,
        {
          headers: {
            "X-MBX-APIKEY": binance.apiKey,
          },
        }
      );

      console.log(res.data);
      return res.data;
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error?.code, error?.message);
    throw error; // Re-throw to allow caller to handle
  }
};

export const createOrder = async (
  symbol: string,
  side: string,
  qty: string,
  tp?: string,
  sl?: string,
  exchange: string = "Bybit",
  address?: string
) => {
  try {
    if (!address) {
      throw new Error("User wallet address is required to fetch API keys");
    }

    // Fetch API keys from database
    const keysResult = await getUserApiKeys(address);
    if (!keysResult.success || !keysResult.keys) {
      throw new Error(keysResult.message || "Failed to retrieve API keys");
    }

    const { binance, bybit } = keysResult.keys;

    if (exchange === "Bybit") {
      if (!bybit.apiKey || !bybit.secretKey) {
        throw new Error(
          "Bybit API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now() - 5000;
      const recvWindow = 10000;

      const params = {
        category: "linear",
        symbol: symbol,
        side: side,
        orderType: "Market",
        qty: qty,
        marketUnit: "quoteCoin",
        ...(tp && { takeProfit: tp }),
        ...(sl && { stopLoss: sl }),
      };

      const signature = createBybitSignature(
        timestamp,
        bybit.apiKey,
        recvWindow,
        JSON.stringify(params),
        bybit.secretKey
      );

      const res = await axios.post(`${bybitBaseUrl}order/create`, params, {
        headers: {
          "X-BAPI-SIGN": signature,
          "X-BAPI-API-KEY": bybit.apiKey,
          "X-BAPI-TIMESTAMP": timestamp,
          "X-BAPI-RECV-WINDOW": recvWindow,
          "Content-Type": "application/json",
        },
      });

      console.log("Bybit order creation result:", res.data);

      return res.data.retMsg;
    } else if (exchange === "Binance") {
      if (!binance.apiKey || !binance.secretKey) {
        throw new Error(
          "Binance API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now();
      const recvWindow = 5000;

      // Build query string for Binance order
      let queryString = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${qty}&timestamp=${timestamp}&recvWindow=${recvWindow}`;

      // Add take profit and stop loss if provided
      if (tp) {
        queryString += `&stopPrice=${tp}&type=TAKE_PROFIT_MARKET`;
      }
      if (sl) {
        queryString += `&stopPrice=${sl}&type=STOP_MARKET`;
      }

      const signature = createBinanceSignature(queryString, binance.secretKey);

      const res = await axios.post(
        `https://fapi.binance.com/fapi/v1/order?${queryString}&signature=${signature}`,
        {},
        {
          headers: {
            "X-MBX-APIKEY": binance.apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return res.data;
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(
      error.response ? error.response.data : error.message ?? error
    );
    return error;
  }
};

export const changeLeverage = async (
  symbol: string,
  leverage: number,
  exchange: string = "Bybit",
  address?: string
) => {
  try {
    if (!address) {
      throw new Error("User wallet address is required to fetch API keys");
    }

    // Fetch API keys from database
    const keysResult = await getUserApiKeys(address);
    if (!keysResult.success || !keysResult.keys) {
      throw new Error(keysResult.message || "Failed to retrieve API keys");
    }

    const { binance, bybit } = keysResult.keys;

    if (exchange === "Bybit") {
      if (!bybit.apiKey || !bybit.secretKey) {
        throw new Error(
          "Bybit API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now() - 5000;
      const recvWindow = 10000;

      const params = {
        category: "linear",
        symbol: symbol,
        buyLeverage: leverage.toString(),
        sellLeverage: leverage.toString(),
      };

      const signature = createBybitSignature(
        timestamp,
        bybit.apiKey,
        recvWindow,
        JSON.stringify(params),
        bybit.secretKey
      );

      const res = await axios.post(
        `${bybitBaseUrl}position/set-leverage`,
        params,
        {
          headers: {
            "X-BAPI-SIGN": signature,
            "X-BAPI-API-KEY": bybit.apiKey,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recvWindow,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Bybit leverage change result:", res.data);
      if (res.data.retCode === 0) {
        return {
          success: true,
          message: "Leverage changed successfully",
          data: res.data.result,
        };
      } else {
        console.error("Bybit leverage change failed:", res.data.retMsg);
        return {
          success: false,
          message: res.data.retMsg,
        };
      }
    } else if (exchange === "Binance") {
      if (!binance.apiKey || !binance.secretKey) {
        throw new Error(
          "Binance API keys not found. Please configure your API keys first."
        );
      }

      const timestamp = Date.now();
      const recvWindow = 5000;

      // Validate leverage range (1-125 for Binance)
      if (leverage < 1 || leverage > 125) {
        throw new Error("Leverage must be between 1 and 125");
      }

      const queryString = `symbol=${symbol}&leverage=${leverage}&timestamp=${timestamp}&recvWindow=${recvWindow}`;
      const signature = createBinanceSignature(queryString, binance.secretKey);

      const res = await axios.post(
        `https://fapi.binance.com/fapi/v1/leverage?${queryString}&signature=${signature}`,
        {},
        {
          headers: {
            "X-MBX-APIKEY": binance.apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      console.log("Binance leverage change result:", res.data);
      return {
        success: true,
        message: "Leverage changed successfully",
        data: {
          symbol: res.data.symbol,
          leverage: res.data.leverage,
          maxNotionalValue: res.data.maxNotionalValue,
        },
      };
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(
      "Error changing leverage:",
      error.response?.data || error.message
    );
    console.error(
      error.response ? error.response.data : error.message ?? error
    );
    return {
      success: false,
      message:
        error.response?.data?.msg ||
        error.message ||
        "Failed to change leverage",
      error: error.response?.data || error,
    };
  }
};

// Example usage:
// createOrder("SUIUSDT", "Buy", "50", undefined, undefined, "Bybit");
// getTradeHistory("ALEOUSDT", "10-17-2024", "10-24-2024", "Binance");
// changeLeverage("BTCUSDT", 10, "Bybit");
// changeLeverage("BTCUSDT", 5, "Bybit");
// getBalance("Binance");
