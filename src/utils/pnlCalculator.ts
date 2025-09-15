import type { TradeHistoryEntry } from "@/types/strategy";

export interface PnlData {
  totalPnl: number;
  pnl24h: number;
  pnl7d: number;
}

/**
 * Calculate PNL data from strategy history
 * @param history Array of trade history entries
 * @returns PnlData object with total, 24h, and 7d PNL
 */
export function calculatePnlFromHistory(
  history: TradeHistoryEntry[] = []
): PnlData {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalPnl = 0;
  let pnl24h = 0;
  let pnl7d = 0;

  // Filter only completed trades (those with exitDate and pnl)
  const completedTrades = history.filter(
    (trade) => trade.exitDate && trade.pnl !== undefined && trade.pnl !== null
  );

  completedTrades.forEach((trade) => {
    const pnl = trade.pnl || 0;
    totalPnl += pnl;

    if (trade.exitDate) {
      const exitDate = new Date(trade.exitDate);

      // Check if trade was completed in the last 24 hours
      if (exitDate >= oneDayAgo) {
        pnl24h += pnl;
      }

      // Check if trade was completed in the last 7 days
      if (exitDate >= sevenDaysAgo) {
        pnl7d += pnl;
      }
    }
  });

  return {
    totalPnl: Number(totalPnl.toFixed(2)),
    pnl24h: Number(pnl24h.toFixed(2)),
    pnl7d: Number(pnl7d.toFixed(2)),
  };
}

/**
 * Format PNL percentage for display
 * @param pnl PNL value
 * @returns Formatted string with + or - prefix and % suffix
 */
export function formatPnlPercentage(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${pnl.toFixed(1)}%`;
}

/**
 * Get PNL color class based on value
 * @param pnl PNL value
 * @returns CSS color class
 */
export function getPnlColorClass(pnl: number): string {
  if (pnl > 0) return "text-[#06E574]"; // Green for positive
  if (pnl < 0) return "text-[#FC5050]"; // Red for negative
  return "text-[#ADADAD]"; // Gray for zero
}
