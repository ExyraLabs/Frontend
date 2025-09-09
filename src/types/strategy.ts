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
  entryCriteria?: string;
  exitCriteria?: string;
  performanceMetrics?: Record<string, number | undefined>;
  fees?: Record<string, number | undefined>;
  tags?: string[];
  author?: string;
  followers?: number;
  notes?: string;
  alerts?: Array<{ type: string; message: string; triggeredAt?: string }>;
  visibility?: "public" | "private";
  supportedChains?: string[];
  icons?: string[];
}
