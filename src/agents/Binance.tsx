"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useAppKitAccount } from "@reown/appkit/react";
import { fetchMarketDataWithRetry } from "../constants/exchange";
import {
  getBalance,
  createOrder,
  changeLeverage,
  getPositionInfo,
} from "./wallet";
import { calculateTPSL } from "../utils/trade";

export default function Binance() {
  const { address } = useAppKitAccount();

  useCopilotAction({
    name: "Balance_Binance",
    description:
      "Get the current account balance from Binance exchange. Returns the available balance in USDT. Requires user to have configured their Binance API keys.",
    parameters: [],
    handler: async () => {
      try {
        console.log(`[Balance_Binance] Called with address: ${address}`);

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to access Binance balance.`,
          };
        }

        const balance = await getBalance("Binance", address);

        if (balance === undefined || balance === null) {
          return {
            error: true,
            message: `❌ Failed to retrieve balance from Binance. Please check your API credentials and network connection.`,
          };
        }

        let result = `💰 **Binance Account Balance**:\n\n`;
        result += `💵 Available Balance: $${parseFloat(balance).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )} USDT\n\n`;
        result += `📊 Exchange: Binance\n`;
        result += `⏰ Retrieved at: ${new Date().toLocaleString()}\n\n`;
        result += `💡 This balance represents your available trading funds in USDT.`;

        console.log(
          `[Balance_Binance] Successfully retrieved balance: $${balance} from Binance`
        );
        return result;
      } catch (error) {
        console.error(`[Balance_Binance] Error:`, error);
        const errorMsg = `❌ Error retrieving balance from Binance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  });

  useCopilotAction({
    name: "CreateOrder_Binance",
    description:
      "Create a comprehensive trading order on Binance Futures exchange. This action supports market orders with advanced features including leverage up to 125x, take profit, and stop loss. Ideal for executing professional trading strategies with precise risk management. Requires Binance API keys to be configured in user settings.",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description:
          "Trading pair symbol in uppercase format. Examples: 'BTCUSDT' for Bitcoin, 'ETHUSDT' for Ethereum, 'BNBUSDT' for Binance Coin. Always use USDT pairs for futures trading on Binance.",
        required: true,
      },
      {
        name: "side",
        type: "string",
        description:
          "Order direction - 'BUY' for long positions (expecting price to rise) or 'SELL' for short positions (expecting price to fall). Case sensitive: use 'BUY' or 'SELL' exactly in uppercase.",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description:
          "Amount in USDT to invest in this trade. This will be used to calculate the actual position size based on current price and leverage. Examples: '100' for $100 investment, '1000' for $1000 investment. Minimum usually $10-20 depending on symbol.",
        required: true,
      },
      {
        name: "leverage",
        type: "number",
        description:
          "Leverage multiplier from 1 to 125. Higher leverage amplifies both profits and losses. Examples: 1 = no leverage, 10 = 10x leverage, 50 = 50x leverage. Use lower leverage (1-10x) for safer trading.",
        required: false,
      },
      {
        name: "takeProfitPrice",
        type: "string",
        description:
          "Exact price level to automatically close the position for profit. For BUY orders: set above current price. For SELL orders: set below current price. Example: if BTC is $50000 and you BUY, set TP at $52000.",
        required: false,
      },
      {
        name: "stopLossPrice",
        type: "string",
        description:
          "Exact price level to automatically close the position to limit losses. For BUY orders: set below current price. For SELL orders: set above current price. Example: if BTC is $50000 and you BUY, set SL at $48000.",
        required: false,
      },
      {
        name: "takeProfitPercent",
        type: "number",
        description:
          "Alternative to takeProfitPrice: profit target as percentage. Examples: 3 = 3% profit, 7 = 7% profit. Will calculate exact price automatically based on current market price.",
        required: false,
      },
      {
        name: "stopLossPercent",
        type: "number",
        description:
          "Alternative to stopLossPrice: loss limit as percentage. Examples: 2 = 2% loss, 4 = 4% loss. Will calculate exact price automatically based on current market price.",
        required: false,
      },
    ],
    handler: async ({
      symbol,
      side,
      amount,
      leverage,
      takeProfitPrice,
      stopLossPrice,
      takeProfitPercent,
      stopLossPercent,
    }) => {
      try {
        console.log(`[CreateOrder_Binance] Creating enhanced order:`, {
          symbol,
          side,
          amount,
          leverage,
          takeProfitPrice,
          stopLossPrice,
          takeProfitPercent,
          stopLossPercent,
        });

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to create orders on Binance.`,
          };
        }

        // Validate required parameters
        if (!symbol || !side || !amount) {
          return {
            error: true,
            message: `❌ Missing required parameters. Please provide symbol, side (BUY/SELL), and amount.`,
          };
        }

        // Validate side parameter
        const normalizedSide = side.toUpperCase();
        if (normalizedSide !== "BUY" && normalizedSide !== "SELL") {
          return {
            error: true,
            message: `❌ Invalid order side '${side}'. Must be 'BUY' or 'SELL'.`,
          };
        }

        // Validate leverage if provided
        if (leverage && (leverage < 1 || leverage > 125)) {
          return {
            error: true,
            message: `❌ Invalid leverage '${leverage}'. Must be between 1 and 125.`,
          };
        }

        // Get current market price
        let currentPrice;
        try {
          const marketData = await fetchMarketDataWithRetry(
            { symbol: symbol.toUpperCase(), index: 0 },
            "Binance",
            "1m",
            1,
            Date.now() - 60000, // 1 minute ago
            Date.now()
          );
          if (marketData && marketData[0] && marketData[0][4]) {
            currentPrice = parseFloat(marketData[0][4]);
          } else {
            throw new Error("Invalid market data response");
          }
        } catch (priceError) {
          console.error(`[CreateOrder_Binance] Price fetch error:`, priceError);
          return {
            error: true,
            message: `❌ Failed to fetch current price for ${symbol.toUpperCase()}. ${priceError}`,
          };
        }

        // Calculate quantity based on amount, current price, and leverage
        const leverageMultiplier = leverage || 1;
        const positionValue = parseFloat(amount) * leverageMultiplier;
        const quantity = (positionValue / currentPrice).toFixed(6);

        console.log(`[CreateOrder_Binance] Price calculation:`, {
          currentPrice,
          amount: parseFloat(amount),
          leverage: leverageMultiplier,
          positionValue,
          calculatedQuantity: quantity,
        });

        // Set leverage first if provided
        if (leverage && leverage > 1) {
          try {
            const leverageResult = await changeLeverage(
              symbol.toUpperCase(),
              leverage,
              "Binance"
            );
            if (!leverageResult?.success) {
              return {
                error: true,
                message: `❌ Failed to set leverage to ${leverage}x: ${
                  leverageResult?.message || "Unknown error"
                }`,
              };
            }
          } catch (leverageError) {
            console.warn(
              `[CreateOrder_Binance] Leverage warning:`,
              leverageError
            );
            // Continue with order creation even if leverage setting fails
          }
        }

        // Calculate TP/SL prices. Prefer explicit price inputs; fall back to percent-based calculation using currentPrice.
        let finalTakeProfit: string | undefined = undefined;
        let finalStopLoss: string | undefined = undefined;

        // If explicit prices provided, use them
        if (takeProfitPrice) finalTakeProfit = String(takeProfitPrice);
        if (stopLossPrice) finalStopLoss = String(stopLossPrice);

        // If percent-based values provided and explicit prices are not, compute from currentPrice
        if ((takeProfitPercent || stopLossPercent) && currentPrice) {
          const tpPercent =
            takeProfitPercent !== undefined ? takeProfitPercent : undefined;
          const slPercent =
            stopLossPercent !== undefined ? stopLossPercent : undefined;

          // For Binance we use uppercase sides 'BUY'/'SELL' — map to Buy/Sell semantics
          const sideForCalc = normalizedSide === "BUY" ? "Buy" : "Sell";

          const tpMultiplier = tpPercent
            ? sideForCalc === "Buy"
              ? 1 + tpPercent / 100
              : 1 - tpPercent / 100
            : undefined;
          const slMultiplier = slPercent
            ? sideForCalc === "Buy"
              ? 1 - slPercent / 100
              : 1 + slPercent / 100
            : undefined;

          const { takeProfit, stopLoss } = calculateTPSL(
            currentPrice,
            sideForCalc as "Buy" | "Sell",
            tpMultiplier,
            slMultiplier
          );

          if (!finalTakeProfit && takeProfit)
            finalTakeProfit = String(takeProfit);
          if (!finalStopLoss && stopLoss) finalStopLoss = String(stopLoss);

          console.log(
            `[CreateOrder_Binance] Calculated TP/SL from percents: TP=${finalTakeProfit}, SL=${finalStopLoss}`
          );
        }

        const result = await createOrder(
          symbol.toUpperCase(),
          normalizedSide,
          quantity,
          finalTakeProfit,
          finalStopLoss,
          "Binance"
        );

        if (result?.error || result?.code) {
          return {
            error: true,
            message: `❌ Order failed: ${
              result?.msg || result?.message || "Unknown error"
            }`,
          };
        }

        let response = `✅ **Binance Order Created Successfully**\n\n`;
        response += `📊 Symbol: ${symbol.toUpperCase()}\n`;
        response += `📈 Side: ${normalizedSide}\n`;
        response += `💰 Investment Amount: $${amount} USDT\n`;
        response += `💎 Current Price: $${currentPrice.toLocaleString()}\n`;
        response += `📏 Position Size: ${quantity} ${symbol.replace(
          "USDT",
          ""
        )}\n`;
        response += `📊 Position Value: $${positionValue.toLocaleString()} USDT\n`;
        if (leverage) response += `⚡ Leverage: ${leverage}x\n`;
        if (finalTakeProfit || takeProfitPercent) {
          response += `🎯 Take Profit: ${
            finalTakeProfit || takeProfitPercent + "%"
          }\n`;
        }
        if (finalStopLoss || stopLossPercent) {
          response += `🛡️ Stop Loss: ${
            finalStopLoss || stopLossPercent + "%"
          }\n`;
        }
        response += `🏢 Exchange: Binance\n`;
        response += `⏰ Created at: ${new Date().toLocaleString()}\n\n`;
        response += `💡 Order has been submitted to Binance successfully.`;
        if (leverage && leverage > 1) {
          response += ` Leverage set to ${leverage}x.`;
        }

        console.log(
          `[CreateOrder_Binance] Order created successfully:`,
          result
        );
        return response;
      } catch (error) {
        console.error(`[CreateOrder_Binance] Error:`, error);
        const errorMsg = `❌ Error creating order on Binance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  });

  useCopilotAction({
    name: "ChangeLeverage_Binance",
    description:
      "Change the leverage for a specific trading pair on Binance Futures. Leverage can be set between 1x and 125x. Requires Binance API keys to be configured.",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description: "Trading pair symbol (e.g., BTCUSDT, ETHUSDT)",
        required: true,
      },
      {
        name: "leverage",
        type: "number",
        description: "Leverage multiplier (1-125)",
        required: true,
      },
    ],
    handler: async ({ symbol, leverage }) => {
      try {
        console.log(`[ChangeLeverage_Binance] Changing leverage:`, {
          symbol,
          leverage,
        });

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to change leverage on Binance.`,
          };
        }

        // Validate parameters
        if (!symbol || !leverage) {
          return {
            error: true,
            message: `❌ Missing required parameters. Please provide symbol and leverage.`,
          };
        }

        if (leverage < 1 || leverage > 125) {
          return {
            error: true,
            message: `❌ Invalid leverage '${leverage}'. Must be between 1 and 125.`,
          };
        }

        const result = await changeLeverage(
          symbol.toUpperCase(),
          leverage,
          "Binance",
          address
        );

        if (!result?.success) {
          return {
            error: true,
            message: `❌ Leverage change failed: ${
              result?.message || "Unknown error"
            }`,
          };
        }

        let response = `✅ **Binance Leverage Changed Successfully**\n\n`;
        response += `📊 Symbol: ${symbol.toUpperCase()}\n`;
        response += `⚡ New Leverage: ${leverage}x\n`;
        response += `🏢 Exchange: Binance\n`;
        response += `⏰ Changed at: ${new Date().toLocaleString()}\n\n`;
        response += `💡 Leverage has been updated successfully for ${symbol.toUpperCase()}.`;

        console.log(
          `[ChangeLeverage_Binance] Leverage changed successfully:`,
          result
        );
        return response;
      } catch (error) {
        console.error(`[ChangeLeverage_Binance] Error:`, error);
        const errorMsg = `❌ Error changing leverage on Binance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  });

  useCopilotAction({
    name: "PositionInfo_Binance",
    description:
      "Get detailed position information for a specific trading pair on Binance Futures. This action retrieves comprehensive position data including size, entry price, unrealized PnL, margin, leverage, and liquidation price. Critical for monitoring open positions and managing risk effectively.",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description:
          "Trading pair symbol in uppercase format. Examples: 'BTCUSDT' for Bitcoin, 'ETHUSDT' for Ethereum, 'BNBUSDT' for Binance Coin. Must be an active futures trading pair on Binance.",
        required: true,
      },
    ],
    handler: async ({ symbol }) => {
      try {
        console.log(`[GetPositionInfo_Binance] Getting position info for:`, {
          symbol,
        });

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to check positions on Binance.`,
          };
        }

        // Validate required parameters
        if (!symbol) {
          return {
            error: true,
            message: `❌ Missing required parameter. Please provide a trading symbol (e.g., BTCUSDT).`,
          };
        }

        const positionInfo = await getPositionInfo(
          symbol.toUpperCase(),
          "Binance",
          address
        );

        if (!positionInfo) {
          return {
            error: true,
            message: `❌ No position found for ${symbol.toUpperCase()} on Binance or failed to retrieve position data.`,
          };
        }

        // Format the position information for Binance
        let response = `📊 **Binance Position Information**\n\n`;
        response += `💎 Symbol: ${
          positionInfo.symbol || symbol.toUpperCase()
        }\n`;
        response += `📈 Side: ${positionInfo.positionSide || "BOTH"}\n`;
        response += `📏 Position Amount: ${positionInfo.positionAmt || "0"}\n`;
        response += `💰 Entry Price: $${positionInfo.entryPrice || "0"}\n`;
        response += `📊 Mark Price: $${positionInfo.markPrice || "0"}\n`;
        response += `💵 Unrealized PnL: ${
          positionInfo.unRealizedProfit
            ? (parseFloat(positionInfo.unRealizedProfit) >= 0 ? "+" : "") +
              positionInfo.unRealizedProfit
            : "0"
        } USDT\n`;
        response += `⚡ Leverage: ${positionInfo.leverage || "1"}x\n`;
        response += `🚨 Liquidation Price: $${
          positionInfo.liquidationPrice || "N/A"
        }\n`;
        response += `🛡️ Initial Margin: ${
          positionInfo.initialMargin || "0"
        } USDT\n`;
        response += `📊 Notional Value: ${positionInfo.notional || "0"} USDT\n`;
        response += `🏢 Exchange: Binance\n`;
        response += `⏰ Retrieved at: ${new Date().toLocaleString()}\n\n`;

        // Add position status
        if (
          positionInfo.positionAmt &&
          parseFloat(positionInfo.positionAmt) !== 0
        ) {
          const pnlColor =
            positionInfo.unRealizedProfit &&
            parseFloat(positionInfo.unRealizedProfit) >= 0
              ? "📈"
              : "📉";
          const side =
            parseFloat(positionInfo.positionAmt) > 0 ? "LONG" : "SHORT";
          response += `${pnlColor} Position Status: **ACTIVE** - You have an open ${side} position.`;
        } else {
          response += `⭕ Position Status: **NO POSITION** - No active position for this symbol.`;
        }

        console.log(
          `[GetPositionInfo_Binance] Position info retrieved successfully:`,
          positionInfo
        );
        return response;
      } catch (error) {
        console.error(`[GetPositionInfo_Binance] Error:`, error);
        const errorMsg = `❌ Error retrieving position info from Binance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  });

  return null; // This component doesn't render anything
}
