export interface TradeHistoryEntry {
  coin: string;
  entryPrice: number;
  exitPrice?: number;
  entryDate?: string;
  exitDate?: string;
  pnl?: number;
}

export interface Strategy {
  icon: string | string[];
  title: string;
  subtitle?: string;
  category: string;
  features?: string[];
  prompts?: string[];
  chains?: string[];
  name?: string;
  description?: string;
  tradeType?: string;
  pnl?: number;
  apy?: number;
  history?: TradeHistoryEntry[];
  riskLevel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  compatibility?: string;
  currentHoldings?: string[];
  entryCriterias?: string[];
  exitCriteria?: string[];
  exchanges?: string[];
  performanceMetrics?: Record<string, number | undefined>;
  fees?: Record<string, number | undefined>;
  tags?: string[];
  author?: string;
  followers?: string[]; // Array of wallet addresses
  notes?: string;
  alerts?: Array<{ type: string; message: string; triggeredAt?: string }>;
  visibility?: "public" | "private";
  supportedChains?: string[];
  icons?: string[];
}

// Strategy core data (rarely changes)
export interface StrategyCore {
  icon: string | string[];
  title: string;
  subtitle?: string;
  category: string;
  features?: string[];
  prompts?: string[];
  chains?: string[];
  name?: string;
  description?: string;
  tradeType?: string;
  riskLevel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  compatibility?: string;
  currentHoldings?: string[];
  entryCriterias?: string[];
  exitCriteria?: string[];
  exchanges?: string[];
  fees?: Record<string, number | undefined>;
  tags?: string[];
  author?: string;
  notes?: string;
  visibility?: "public" | "private";
  supportedChains?: string[];
  icons?: string[];
}

// Strategy dynamic data (frequently updated)
export interface StrategyDynamic {
  pnl?: number;
  apy?: number;
  history?: TradeHistoryEntry[];
  performanceMetrics?: Record<string, number | undefined>;
  followers?: string[]; // Array of wallet addresses
  alerts?: Array<{ type: string; message: string; triggeredAt?: string }>;
}
