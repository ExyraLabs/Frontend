/**
 * Calculate take profit and stop loss prices based on current price and side
 * @param currentPrice - Current market price
 * @param side - Trade side ("Buy" or "Sell")
 * @param takeProfitMultiplier - Optional TP multiplier (e.g., 1.02 for 2% profit on Buy)
 * @param stopLossMultiplier - Optional SL multiplier (e.g., 0.96 for 4% loss on Buy)
 * @returns Object with calculated take profit and stop loss prices
 */
export const calculateTPSL = (
  currentPrice: number,
  side: "Buy" | "Sell",
  takeProfitMultiplier?: number,
  stopLossMultiplier?: number
): { takeProfit: number; stopLoss: number } => {
  let takeProfit: number;
  let stopLoss: number;

  if (takeProfitMultiplier !== undefined) {
    takeProfit = currentPrice * takeProfitMultiplier;
  } else {
    // Default: 2% profit
    takeProfit = side === "Buy" ? currentPrice * 1.02 : currentPrice * 0.98;
  }

  if (stopLossMultiplier !== undefined) {
    stopLoss = currentPrice * stopLossMultiplier;
  } else {
    // Default: 4% loss
    stopLoss = side === "Buy" ? currentPrice * 0.96 : currentPrice * 1.04;
  }

  return { takeProfit, stopLoss };
};
