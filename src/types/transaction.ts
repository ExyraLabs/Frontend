// Transaction types for strategy trading history

export type TransactionType = "buy" | "sell";

export interface Transaction {
  id: string;
  type: TransactionType;
  asset: string;
  amount: number;
  entryPrice: number;
  entryDate: Date;
  exitPrice: number;
  exitDate: Date;
  pnl: number;
  exchange: "Bybit" | "Binance";
  date: Date; // General date field for backward compatibility
}

// Type guard to check if a value is a valid transaction type
export const isValidTransactionType = (
  type: string
): type is TransactionType => {
  return type === "buy" || type === "sell";
};

// Helper function to determine PnL color based on value
export const getPNLColor = (pnl: number): string => {
  if (pnl > 0) return "text-[#06E574]"; // Green for profit
  if (pnl < 0) return "text-[#FC5050]"; // Red for loss
  return "text-white"; // White for neutral
};

// Helper function to format PnL value
export const formatPNL = (pnl: number): string => {
  // Format with proper sign and currency
  if (pnl > 0) {
    return `+${pnl.toFixed(2)}`;
  } else if (pnl < 0) {
    return pnl.toFixed(2); // Already has negative sign
  }
  return "0.00";
};

// Type for transaction creation (when id might not be set yet)
export interface CreateTransactionInput {
  type: TransactionType;
  asset: string;
  amount: number;
  entryPrice: number;
  entryDate: Date;
  exitPrice: number;
  exitDate: Date;
  pnl: number;
  exchange: "Bybit" | "Binance";
}
