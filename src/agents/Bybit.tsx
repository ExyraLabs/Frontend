"use client";

import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
} from "@copilotkit/react-core";
import { useAppKitAccount } from "@reown/appkit/react";
import { fetchMarketDataWithRetry } from "../constants/exchange";
import {
  getBalance,
  createOrder,
  changeLeverage,
  getPositionInfo,
} from "./wallet";
import { calculateTPSL } from "../utils/trade";
import OrderConfirmationModal from "../components/OrderConfirmationModal";

export default function Bybit() {
  const { address } = useAppKitAccount();

  useCopilotAdditionalInstructions({ instructions: "" });

  useCopilotAction({
    name: "Balance_Bybit",
    description:
      "Get the current account balance from Bybit exchange. Returns the available balance in USDT. Requires user to have configured their Bybit API keys.",
    parameters: [],
    handler: async () => {
      try {
        console.log(`[Balance_Bybit] Called with address: ${address}`);

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to access Bybit balance.`,
          };
        }

        const balance = await getBalance("Bybit", address);

        if (balance === undefined || balance === null) {
          return {
            error: true,
            message: `❌ Failed to retrieve balance from Bybit. Please check your API credentials and network connection.`,
          };
        }

        let result = `💰 **Bybit Account Balance**:\n\n`;
        result += `💵 Available Balance: $${parseFloat(balance).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )} USDT\n\n`;
        result += `📊 Exchange: Bybit\n`;
        result += `⏰ Retrieved at: ${new Date().toLocaleString()}\n\n`;
        result += `💡 This balance represents your available trading funds in USDT.`;

        console.log(
          `[Balance_Bybit] Successfully retrieved balance: $${balance} from Bybit`
        );
        return result;
      } catch (error) {
        console.error(`[Balance_Bybit] Error:`, error);
        const errorMsg = `❌ Error retrieving balance from Bybit: ${
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
    name: "CreateOrder_Bybit",
    description:
      "Create a comprehensive trading order on Bybit exchange. This action supports market orders with advanced features including leverage, take profit, and stop loss. Shows confirmation UI before execution. Perfect for executing trading strategies with precise risk management. Requires Bybit API keys to be configured in user settings.",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description:
          "Trading pair symbol in uppercase format. Examples: 'BTCUSDT' for Bitcoin, 'ETHUSDT' for Ethereum, 'SOLUSDT' for Solana. Always use USDT pairs for futures trading.",
        required: true,
      },
      {
        name: "side",
        type: "string",
        description:
          "Order direction - 'Buy' for long positions (expecting price to rise) or 'Sell' for short positions (expecting price to fall). Case sensitive: use 'Buy' or 'Sell' exactly.",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description:
          "Amount in USDT to invest in this trade. This will be used to calculate the actual position size based on current price and leverage. Examples: '100' for $100 investment, '500' for $500 investment. Minimum usually $5-10 depending on symbol.",
        required: true,
      },
      {
        name: "leverage",
        type: "number",
        description:
          "Leverage multiplier from 1 to 100. Higher leverage amplifies both profits and losses. Examples: 1 = no leverage, 5 = 5x leverage, 20 = 20x leverage. Use lower leverage (1-5x) for safer trading.",
        required: false,
      },
      {
        name: "takeProfitPrice",
        type: "string",
        description:
          "Exact price level to automatically close the position for profit. For Buy orders: set above current price. For Sell orders: set below current price. Example: if BTC is $50000 and you Buy, set TP at $52000.",
        required: false,
      },
      {
        name: "stopLossPrice",
        type: "string",
        description:
          "Exact price level to automatically close the position to limit losses. For Buy orders: set below current price. For Sell orders: set above current price. Example: if BTC is $50000 and you Buy, set SL at $48000.",
        required: false,
      },
      {
        name: "takeProfitPercent",
        type: "number",
        description:
          "Alternative to takeProfitPrice: profit target as percentage. Examples: 2 = 2% profit, 5 = 5% profit. Will calculate exact price automatically based on current market price.",
        required: false,
      },
      {
        name: "stopLossPercent",
        type: "number",
        description:
          "Alternative to stopLossPrice: loss limit as percentage. Examples: 2 = 2% loss, 5 = 5% loss. Will calculate exact price automatically based on current market price.",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const {
        symbol,
        side,
        amount,
        leverage,
        takeProfitPrice,
        stopLossPrice,
        takeProfitPercent,
        stopLossPercent,
      } = args;

      console.log("Bybit CreateOrder Status:", status);

      // Show loading state during execution
      if (status === "inProgress") {
        return (
          <div className="bg-[#1A1A1A] border border-gray-500/20 rounded-[20px] p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white">Creating Bybit order...</span>
            </div>
            <div className="mt-4 text-center text-gray-400 text-sm">
              Please wait while we process your {side} order for {symbol}
            </div>
          </div>
        );
      }

      if (status === "complete") {
        return (
          <div className="bg-[#1A1A1A] border border-green-500/20 rounded-[20px] p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-green-400 text-4xl mb-2">✅</div>
              <div className="text-white font-semibold">
                Order Created Successfully!
              </div>
            </div>
          </div>
        );
      }

      // Show confirmation UI during executing status
      if (status === "executing") {
        // Type check required parameters
        if (!symbol || !side || !amount) {
          return (
            <div className="bg-[#1A1A1A] border border-red-500/20 rounded-[20px] p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-red-400 text-2xl mb-2">❌</div>
                <div className="text-white">Missing required parameters</div>
                <div className="text-gray-400 text-sm mt-2">
                  Please provide symbol, side (Buy/Sell), and amount.
                </div>
                <button
                  onClick={() =>
                    respond({ error: "Missing required parameters" })
                  }
                  className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          );
        }

        return (
          <OrderConfirmationModal
            orderParams={{
              symbol,
              side,
              amount,
              leverage,
              takeProfitPrice,
              stopLossPrice,
              takeProfitPercent,
              stopLossPercent,
              exchange: "Bybit",
            }}
            onConfirm={async () => {
              try {
                console.log(`[CreateOrder_Bybit] Creating enhanced order:`, {
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
                  respond({
                    error: true,
                    message: `❌ Wallet not connected. Please connect your wallet first to create orders on Bybit.`,
                  });
                  return;
                }

                // Validate required parameters
                if (!symbol || !side || !amount) {
                  respond({
                    error: true,
                    message: `❌ Missing required parameters. Please provide symbol, side (Buy/Sell), and amount.`,
                  });
                  return;
                }

                // Validate side parameter (Bybit uses 'Buy'/'Sell' format)
                const normalizedSide =
                  side.charAt(0).toUpperCase() + side.slice(1).toLowerCase();
                if (normalizedSide !== "Buy" && normalizedSide !== "Sell") {
                  respond({
                    error: true,
                    message: `❌ Invalid order side '${side}'. Must be 'Buy' or 'Sell'.`,
                  });
                  return;
                }

                // Validate leverage if provided
                if (leverage && (leverage < 1 || leverage > 100)) {
                  respond({
                    error: true,
                    message: `❌ Invalid leverage '${leverage}'. Must be between 1 and 100.`,
                  });
                  return;
                }

                // Get current market price
                let currentPrice;
                try {
                  const marketData = await fetchMarketDataWithRetry(
                    { symbol: symbol.toUpperCase(), index: 0 },
                    "Bybit",
                    "1",
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
                  console.error(
                    `[CreateOrder_Bybit] Price fetch error:`,
                    priceError
                  );
                  respond({
                    error: true,
                    message: `❌ Failed to fetch current price for ${symbol.toUpperCase()}. ${priceError}`,
                  });
                  return;
                }

                // Calculate quantity based on amount, current price, and leverage
                const leverageMultiplier = leverage || 1;
                const positionValue = parseFloat(amount) * leverageMultiplier;
                const quantity = (positionValue / currentPrice).toFixed(6);

                console.log(`[CreateOrder_Bybit] Price calculation:`, {
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
                      "Bybit"
                    );
                    if (!leverageResult?.success) {
                      respond({
                        error: true,
                        message: `❌ Failed to set leverage to ${leverage}x: ${
                          leverageResult?.message || "Unknown error"
                        }`,
                      });
                      return;
                    }
                  } catch (leverageError) {
                    console.warn(
                      `[CreateOrder_Bybit] Leverage warning:`,
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
                    takeProfitPercent !== undefined
                      ? takeProfitPercent
                      : undefined;
                  const slPercent =
                    stopLossPercent !== undefined ? stopLossPercent : undefined;

                  // Map percent inputs to multipliers depending on side
                  const tpMultiplier = tpPercent
                    ? normalizedSide === "Buy"
                      ? 1 + tpPercent / 100
                      : 1 - tpPercent / 100
                    : undefined;
                  const slMultiplier = slPercent
                    ? normalizedSide === "Buy"
                      ? 1 - slPercent / 100
                      : 1 + slPercent / 100
                    : undefined;

                  const { takeProfit, stopLoss } = calculateTPSL(
                    currentPrice,
                    normalizedSide as "Buy" | "Sell",
                    tpMultiplier,
                    slMultiplier
                  );

                  if (!finalTakeProfit && takeProfit)
                    finalTakeProfit = String(takeProfit);
                  if (!finalStopLoss && stopLoss)
                    finalStopLoss = String(stopLoss);

                  console.log(
                    `[CreateOrder_Bybit] Calculated TP/SL from percents: TP=${finalTakeProfit}, SL=${finalStopLoss}`
                  );
                }

                const result = await createOrder(
                  symbol.toUpperCase(),
                  normalizedSide,
                  quantity,
                  finalTakeProfit,
                  finalStopLoss,
                  "Bybit",
                  address
                );

                // Check if result indicates an error
                if (
                  result?.error ||
                  (typeof result === "object" &&
                    result?.code &&
                    result?.code !== 0)
                ) {
                  respond({
                    error: true,
                    message: `❌ Order failed: ${
                      result?.message || result?.retMsg || "Unknown error"
                    }`,
                  });
                  return;
                }

                let response = `✅ **Bybit Order Created Successfully**\n\n`;
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
                response += `🏢 Exchange: Bybit\n`;
                response += `⏰ Created at: ${new Date().toLocaleString()}\n\n`;
                response += `💡 Order has been submitted to Bybit successfully.`;
                if (leverage && leverage > 1) {
                  response += ` Leverage set to ${leverage}x.`;
                }

                console.log(
                  `[CreateOrder_Bybit] Order created successfully:`,
                  result
                );
                respond(response);
              } catch (error) {
                console.error(`[CreateOrder_Bybit] Error:`, error);
                const errorMsg = `❌ Error creating order on Bybit: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`;
                respond({
                  error: true,
                  message: errorMsg,
                });
              }
            }}
            onCancel={() => {
              respond({
                error: true,
                message: "Order cancelled by user",
              });
            }}
          />
        );
      }

      // Fallback for any other status
      return (
        <div className="bg-[#1A1A1A] border border-gray-500/20 rounded-[20px] p-6 max-w-md w-full mx-4">
          <div className="text-center text-white">
            Preparing order confirmation...
          </div>
        </div>
      );
    },
  });

  useCopilotAction({
    name: "ChangeLeverage_Bybit",
    description:
      "Change the leverage for a specific trading pair on Bybit. Leverage can be set between 1x and 100x. Requires Bybit API keys to be configured.",
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
        description: "Leverage multiplier (1-100)",
        required: true,
      },
    ],
    handler: async ({ symbol, leverage }) => {
      try {
        console.log(`[ChangeLeverage_Bybit] Changing leverage:`, {
          symbol,
          leverage,
        });

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to change leverage on Bybit.`,
          };
        }

        // Validate parameters
        if (!symbol || !leverage) {
          return {
            error: true,
            message: `❌ Missing required parameters. Please provide symbol and leverage.`,
          };
        }

        if (leverage < 1 || leverage > 100) {
          return {
            error: true,
            message: `❌ Invalid leverage '${leverage}'. Must be between 1 and 100.`,
          };
        }

        const result = await changeLeverage(
          symbol.toUpperCase(),
          leverage,
          "Bybit"
        );

        if (!result?.success) {
          return {
            error: true,
            message: `❌ Leverage change failed: ${
              result?.message || "Unknown error"
            }`,
          };
        }

        let response = `✅ **Bybit Leverage Changed Successfully**\n\n`;
        response += `📊 Symbol: ${symbol.toUpperCase()}\n`;
        response += `⚡ New Leverage: ${leverage}x\n`;
        response += `🏢 Exchange: Bybit\n`;
        response += `⏰ Changed at: ${new Date().toLocaleString()}\n\n`;
        response += `💡 Leverage has been updated successfully for ${symbol.toUpperCase()}.`;

        console.log(
          `[ChangeLeverage_Bybit] Leverage changed successfully:`,
          result
        );
        return response;
      } catch (error) {
        console.error(`[ChangeLeverage_Bybit] Error:`, error);
        const errorMsg = `❌ Error changing leverage on Bybit: ${
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
    name: "PositionInfo_Bybit",
    description:
      "Get detailed position information for a specific trading pair on Bybit. This action retrieves comprehensive position data including size, entry price, unrealized PnL, margin, leverage, and liquidation price. Essential for monitoring open positions and risk management.",
    parameters: [
      {
        name: "symbol",
        type: "string",
        description:
          "Trading pair symbol in uppercase format. Examples: 'BTCUSDT' for Bitcoin, 'ETHUSDT' for Ethereum, 'SOLUSDT' for Solana. Must be an active futures trading pair on Bybit.",
        required: true,
      },
    ],
    handler: async ({ symbol }) => {
      try {
        console.log(`[GetPositionInfo_Bybit] Getting position info for:`, {
          symbol,
        });

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to check positions on Bybit.`,
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
          "Bybit",
          address
        );

        if (!positionInfo) {
          return {
            error: true,
            message: `❌ No position found for ${symbol.toUpperCase()} on Bybit or failed to retrieve position data.`,
          };
        }

        // Format the position information
        let response = `📊 **Bybit Position Information**\n\n`;
        response += `💎 Symbol: ${
          positionInfo.symbol || symbol.toUpperCase()
        }\n`;
        response += `📈 Side: ${positionInfo.side || "None"}\n`;
        response += `📏 Size: ${positionInfo.size || "0"}\n`;
        response += `💰 Entry Price: $${positionInfo.avgPrice || "0"}\n`;
        response += `📊 Mark Price: $${positionInfo.markPrice || "0"}\n`;
        response += `💵 Unrealized PnL: ${
          positionInfo.unrealisedPnl
            ? (parseFloat(positionInfo.unrealisedPnl) >= 0 ? "+" : "") +
              positionInfo.unrealisedPnl
            : "0"
        } USDT\n`;
        response += `⚡ Leverage: ${positionInfo.leverage || "1"}x\n`;
        response += `🚨 Liquidation Price: $${
          positionInfo.liqPrice || "N/A"
        }\n`;
        response += `🛡️ Position Margin: ${
          positionInfo.positionIM || "0"
        } USDT\n`;
        response += `📊 Position Value: ${
          positionInfo.positionValue || "0"
        } USDT\n`;
        response += `🏢 Exchange: Bybit\n`;
        response += `⏰ Retrieved at: ${new Date().toLocaleString()}\n\n`;

        // Add position status
        if (positionInfo.size && parseFloat(positionInfo.size) > 0) {
          const pnlColor =
            positionInfo.unrealisedPnl &&
            parseFloat(positionInfo.unrealisedPnl) >= 0
              ? "📈"
              : "📉";
          response += `${pnlColor} Position Status: **ACTIVE** - You have an open ${positionInfo.side} position.`;
        } else {
          response += `⭕ Position Status: **NO POSITION** - No active position for this symbol.`;
        }

        console.log(
          `[GetPositionInfo_Bybit] Position info retrieved successfully:`,
          positionInfo
        );
        return response;
      } catch (error) {
        console.error(`[GetPositionInfo_Bybit] Error:`, error);
        const errorMsg = `❌ Error retrieving position info from Bybit: ${
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
