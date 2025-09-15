import type { Strategy } from "@/types/strategy";

export const chainImageMapping: { [key: string]: string } = {
  Ethereum: "/icons/ethereum.svg",
  Base: "/icons/base.svg",
  Arbitrum: "/icons/arbitrum.svg",
  Optimism: "/icons/optimism.svg",
  "BNB Smart Chain": "/icons/bsc.svg",
  Polygon: "/icons/polygon.png",
  Monad: "/icons/monad.svg",
  Solana: "/icons/solana.svg",
  // "Avalanche": "/icons/avalanche.svg",
  Berachain: "/icons/berachain.svg",
};

export const STRATS_CARDS: Strategy[] = [
  {
    icon: [
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
    ],
    title: "Overly Sold",
    subtitle: "Sniping low RSI levels",
    category: "CEX",
    features: [
      "Identify tokens in the oversold zones.",
      "Enter positions with reduced risk using RSI.",
    ],
    notes: ["Strategy focuses on extended RSI levels for entry."],
    chains: ["Ethereum", "BNB Smart Chain"],
    tradeType: "Swing",
    pnl: 4.2,
    riskLevel: "Medium",
    tags: ["RSI", "Staking", "DeFi"],
    entryCriterias: ["RSI above 70", "Volume increase > 20%"],
    exitCriteria: [
      "RSI below 30",
      "Stop loss at -5%",
      "Take Profit at 20%",
      "News coming out",
    ],
    exchanges: ["Binance", "Bybit"],
    history: [
      {
        coin: "BTC",
        entryPrice: 42000,
        exitPrice: 45000,
        entryDate: "2025-09-10T08:00:00Z",
        exitDate: "2025-09-14T16:00:00Z",
        pnl: 7.14,
      },
      {
        coin: "ETH",
        entryPrice: 2500,
        exitPrice: 2450,
        entryDate: "2025-09-12T10:00:00Z",
        exitDate: "2025-09-15T14:00:00Z",
        pnl: -2.0,
      },
      {
        coin: "SOL",
        entryPrice: 140,
        exitPrice: 155,
        entryDate: "2025-09-08T12:00:00Z",
        exitDate: "2025-09-13T18:00:00Z",
        pnl: 10.71,
      },
    ],

    activities: [] as { message: string; timestamp: Date }[],
    visibility: "public",
    supportedChains: ["Ethereum", "BNB Smart Chain"],
    compatibility:
      "This strategy is only supported on Binance and Bybit Exchanges. Please add your api keys and credit your futures account for the best experience.",
  },
  {
    icon: [
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
    ],
    title: "AI Tokens",
    subtitle: "Purchasing cheap AI tokens.",
    category: "CEX",
    features: ["Relatively new ai tokens.", "Market cap under $10m."],
    notes: ["24h volume over $10m"],
    chains: ["Ethereum", "BNB Smart Chain"],
    tradeType: "Swing",
    history: [
      {
        coin: "RENDER",
        entryPrice: 2.5,
        exitPrice: 4.2,
        entryDate: "2025-09-01T09:00:00Z",
        exitDate: "2025-09-14T15:00:00Z",
        pnl: 68.0,
      },
      {
        coin: "FET",
        entryPrice: 1.2,
        exitPrice: 1.68,
        entryDate: "2025-09-13T11:00:00Z",
        exitDate: "2025-09-15T13:00:00Z",
        pnl: 40.0,
      },
      {
        coin: "AGIX",
        entryPrice: 0.85,
        exitPrice: 0.92,
        entryDate: "2025-09-14T14:00:00Z",
        exitDate: "2025-09-15T12:00:00Z",
        pnl: 8.24,
      },
    ],
    pnl: 12.5,
    riskLevel: "Low",
    tags: ["AI", "New"],
    entryCriterias: ["New Token", "Volume increase > 20%"],
    exitCriteria: ["Stop loss at -20%", "Take Profit at 100%"],
    exchanges: ["Binance", "Bybit"],
    activities: [] as { message: string; timestamp: Date }[],
    compatibility:
      "This strategy is only supported on Binance and Bybit Exchanges. Please add your api keys and credit your futures account for the best experience.",
  },
];

export const socialLinks = [
  {
    name: "Twitter",
    href: "https://x.com/ExyraLabs",
    icon: "/icons/twitter.svg",
  },
  {
    name: "Telegram",
    href: "https://t.me/ExyraLabs",
    icon: "/icons/telegram.svg",
  },
  {
    name: "Medium",
    href: "https://exyralabs.medium.com/",
    icon: "/icons/medium.svg",
  },
  {
    name: "Github",
    href: "https://github.com/ExyraLabs",
    icon: "/icons/github.svg",
  },
];

// Risk level color mapping
export const getRiskLevelColor = (riskLevel: string): string => {
  const riskLevelColors: Record<string, string> = {
    Low: "text-[#06E574]", // Green
    Medium: "text-[#F59E0B]", // Orange/Yellow
    High: "text-[#EF4444]", // Red
  };

  return riskLevelColors[riskLevel] || "text-[#9B9D9D]"; // Default gray
};

// Tool icon mapping based on tool name
export const getToolIcon = (toolName: string): string | null => {
  const toolIconMapping: Record<string, string> = {
    // CoinGecko tools
    GetTokenPrice: "/icons/gecko.png",
    GetToken: "/icons/gecko.png",
    getCoinDetails: "/icons/gecko.png",
    searchCoinsByName: "/icons/gecko.png",
    getContractAddress: "/icons/gecko.png",
    getTokenDecimals: "/icons/gecko.png",
    getAvailablePlatforms: "/icons/gecko.png",

    // Lifi Tools
    GetBridgeQuote: "/icons/lifi.png",
    ExecuteBridge: "/icons/lifi.png",

    // Uniswap tools
    swapTokens: "/icons/uniswap.png",
    getUniswapQuote: "/icons/uniswap.png",
    executeSwap: "/icons/uniswap.png",
    WrapETH: "/icons/uniswap.png",
    unwrapWETH: "/icons/uniswap.png",

    // Lido tools
    getLidoContractAddress: "/icons/Lido.png",
    getLidoBalances: "/icons/Lido.png",
    wrapETH: "/icons/Lido.png",
    withdrawstETH: "/icons/Lido.png",
    lidoConversions: "/icons/Lido.png",
    lidoTokenOperations: "/icons/Lido.png",
    lidoRpcConfiguration: "/icons/Lido.png",
    lidoOverview: "/icons/Lido.png",
    lidoStake: "/icons/Lido.png",
    stakeETH: "/icons/Lido.png",
    lidoStatistics: "/icons/Lido.png",
    lidoWithdrawalApprove: "/icons/Lido.png",
    lidoWithdrawalClaim: "/icons/Lido.png",
    lidoWithdrawalInfo: "/icons/Lido.png",

    // KyberSwap/KNC tools
    getKyberSwapQuoteBySymbol: "/icons/kyber.png",
    GettingRoutes: "/icons/kyber.png",
    Swapping: "/icons/kyber.png",
    executeKyberSwap: "/icons/kyber.png",

    // Alchemy tools
    getAccountBalance: "/icons/alchemy.svg",
    getAllTokenBalances: "/icons/alchemy.svg",

    // Add more tool mappings as needed
    //Aave Tools
    Lend: "/icons/aave.svg",
    Borrow: "/icons/aave.svg",
    FindingReserves: "/icons/aave.svg",
    FindHighestApyReserves: "/icons/aave.svg",
    // GetUserSupplyPositions: "/icons/aave.svg",
    // GetUserBorrowPositions: "/icons/aave.svg",
    GetUserPortfolio: "/icons/aave.svg",
    ToggleCollateral: "/icons/aave.svg",
    ApproveCreditDelegation: "/icons/aave.svg",
    Repay: "/icons/aave.svg",
    Withdraw: "/icons/aave.svg",
    // GetUserTokenPosition: "/icons/aave.svg",

    //Binance,
    Balance_Bybit:
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
    PositionInfo_Bybit:
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
    Balance_Binance:
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
  };

  return toolIconMapping[toolName] || null;
};
