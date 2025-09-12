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
    title: "Extremes Hunter",
    subtitle: "Positioning at extended RSI levels",
    category: "CEX",
    features: [
      "Identify tokens in the overbought/oversold zones.",
      "Enter positions with reduced risk using RSI.",
    ],
    notes: ["Strategy focuses on extended RSI levels for entry and exit."],

    prompts: [
      // "How can I stake my ETH?",
      "Withdraw all Lido stETH in my wallet - Lido.",
      "Stake $4 worth of ETH for me.",
    ],
    chains: ["Ethereum", "BNB Smart Chain"],
    tradeType: "Day",
    pnl: 4.2,
    apy: 4.2,
    riskLevel: "High",
    tags: ["RSI", "Staking", "DeFi"],
    history: [
      {
        coin: "AGT",
        entryPrice: 3200,
        exitPrice: 3400,
        entryDate: "01/08/25",
        exitDate: "15/08/25",
        pnl: 6.25,
      },
      {
        coin: "PARTI",
        entryPrice: 3300,
        exitPrice: 3350,
        entryDate: "10/08/25",
        exitDate: "20/08/25",
        pnl: 1.52,
      },
    ],
    author: "Jane Doe",
    followers: [] as string[], // Array of wallet addresses following this strategy
    status: "active",
    startDate: "2025-08-01",
    endDate: undefined,
    entryCriterias: ["RSI above 70", "Volume increase > 20%"],
    exitCriteria: [
      "RSI below 30",
      "Stop loss at -5%",
      "Take Profit at 20%",
      "News coming out",
    ],
    exchanges: ["Binance", "Bybit"],
    performanceMetrics: {
      sharpeRatio: 1.2,
      winRate: 75,
      maxDrawdown: 8.5,
    },
    fees: {
      trading: 0.1,
      management: 0.05,
    },
    alerts: [
      { type: "price", message: "ETH above $3400", triggeredAt: "2025-08-15" },
      {
        type: "drawdown",
        message: "Max drawdown exceeded",
        triggeredAt: "2025-08-10",
      },
    ],
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

    prompts: [
      // "How can I stake my ETH?",
      "Withdraw all Lido stETH in my wallet - Lido.",
      "Stake $4 worth of ETH for me.",
    ],
    chains: ["Ethereum", "BNB Smart Chain"],
    tradeType: "Swing",
    pnl: 12.5,
    apy: 4.2,
    riskLevel: "Low",
    tags: ["AI", "New"],
    history: [
      {
        coin: "AGT",
        entryPrice: 3200,
        exitPrice: 3400,
        entryDate: "01/08/25",
        exitDate: "15/08/25",
        pnl: 6.25,
      },
      {
        coin: "PARTI",
        entryPrice: 3300,
        exitPrice: 3350,
        entryDate: "10/08/25",
        exitDate: "20/08/25",
        pnl: 1.52,
      },
    ],
    author: "Jane Doe",
    followers: [] as string[], // Array of wallet addresses following this strategy
    status: "active",
    startDate: "2025-08-01",
    endDate: undefined,
    entryCriterias: ["New Token", "Volume increase > 20%"],
    exitCriteria: ["Stop loss at -20%", "Take Profit at 100%"],
    exchanges: ["Binance", "Bybit"],
    performanceMetrics: {
      sharpeRatio: 1.2,
      winRate: 75,
      maxDrawdown: 8.5,
    },
    fees: {
      trading: 0.1,
      management: 0.05,
    },
    alerts: [
      { type: "price", message: "ETH above $3400", triggeredAt: "2025-08-15" },
      {
        type: "drawdown",
        message: "Max drawdown exceeded",
        triggeredAt: "2025-08-10",
      },
    ],
    visibility: "public",
    supportedChains: ["Ethereum", "BNB Smart Chain"],
    compatibility:
      "This strategy is only supported on Binance and Bybit Exchanges. Please add your api keys and credit your futures account for the best experience.",
  },
  // {
  //   icon: "/icons/uniswap.png",
  //   title: "Uniswap",
  //   subtitle: "Decentralized exchange for swapping tokens",
  //   category: "Swap",
  //   features: [
  //     // "Swap any ERC-20 token instantly",
  //     "Provide liquidity and earn fees",
  //     "Access deep liquidity pools",
  //   ],
  //   prompts: [
  //     // "Swap 10 USDC to ETH",
  //     "Swap $4 worth of ETH for MATIC - Uniswap.",
  //     "Swap 0.0002ETH to USDT - Uniswap.",
  //   ],
  //   chains: ["Ethereum"],
  // },
  // {
  //   icon: "/icons/kyber.png",
  //   title: "KyberSwap",
  //   subtitle: "Multi-chain DEX aggregator",
  //   category: "Swap",
  //   features: [
  //     "Find best token swap rates across chains.",
  //     "Swap tokens on Ethereum, BSC, Polygon and more.",
  //     "Earn rewards by providing liquidity.",
  //   ],
  //   prompts: [
  //     // "Swap 5 BNB to USDT on BSC",
  //     "Show KyberSwap rates for ETH/USDT",
  //     "Swap 0.001 ETH to USDT on Ethereum - KyberSwap.",
  //   ],
  //   chains: ["Ethereum"],
  // },
  // {
  //   icon: "/icons/gecko.png",
  //   title: "CoinGecko",
  //   subtitle: "Your go-to source for crypto market data",
  //   category: "Research",
  //   features: [
  //     "Track price movements of your favorite coins.",
  //     "Get real-time market data and charts.",
  //     "Compare different cryptocurrencies.",
  //   ],
  //   prompts: [
  //     "What is the current price of Bitcoin?",
  //     "What is the brand image for Ethereum?",
  //   ],
  //   chains: ["Ethereum"],
  // },
  // {
  //   icon: "/icons/curve.jpeg",
  //   title: "Curve Finance",
  //   subtitle: "Efficient stablecoin and like-asset trading",
  //   category: "Swap",
  //   features: [
  //     "Trade stablecoins with minimal slippage",
  //     "Provide liquidity to earn trading fees",
  //     "Access deep liquidity for stable assets",
  //   ],
  //   prompts: [
  //     "Show me available Curve pools",
  //     "Provide liquidity to the 3pool",
  //   ],
  //   chains: ["Ethereum", "Arbitrum", "Optimism"],
  // },
  // {
  //   icon: "/icons/alchemy.svg",
  //   title: "Alchemy SDK",
  //   subtitle: "Powerful blockchain data and infrastructure",
  //   category: "Research",
  //   features: [
  //     "Access comprehensive blockchain data.",
  //     "Get real-time transaction information.",
  //     "Query NFT metadata and ownership.",
  //   ],
  //   prompts: [
  //     "Get all token balances in my wallet.",
  //     // "Show me NFTs in my wallet",
  //     "Check the balance of my address",
  //   ],
  //   chains: ["Ethereum"],
  // },
  // {
  //   icon: "/icons/curve.jpeg",
  //   title: "Curve Finance",
  //   subtitle: "Efficient stablecoin and like-asset trading",
  //   category: "Provide LP",
  //   features: [
  //     "Trade stablecoins with minimal slippage",
  //     "Provide liquidity to earn trading fees",
  //     "Access deep liquidity for stable assets",
  //   ],
  //   prompts: [
  //     "Show me available Curve pools",
  //     "Provide liquidity to the 3pool",
  //   ],
  //   chains: ["Ethereum", "Arbitrum", "Optimism"],
  // },
  // {
  //   icon: "/icons/bridge.svg",
  //   title: "Cross-Chain Bridge",
  //   subtitle: "Bridge assets across different blockchains",
  //   category: "Bridge",
  //   features: [
  //     "Bridge tokens between Ethereum and Layer 2s",
  //     "Support for multiple chains",
  //     "Secure cross-chain transfers",
  //   ],
  //   prompts: [
  //     "Bridge 0.1 ETH from Ethereum to Arbitrum",
  //     "What are the bridge fees for USDC?",
  //   ],
  //   chains: ["Ethereum", "Arbitrum", "Optimism", "Base"],
  // },
  // {
  //   icon: "/icons/aave.svg",
  //   title: "Aave Protocol",
  //   subtitle: "Decentralized lending and borrowing platform",
  //   category: "Lend",
  //   features: [
  //     "Lend crypto assets to earn interest",
  //     "Borrow against your collateral",
  //     "Access flash loans",
  //   ],
  //   prompts: [
  //     "Lend 0.0005 WETH",
  //     "What are the current lending rates for WETH?",
  //   ],
  //   chains: ["Ethereum"],
  // },
  // {
  //   icon: "/icons/lifi.png",
  //   title: "Li.Fi",
  //   subtitle: "Cross-chain bridging powered by Li.Fi SDK",
  //   category: "Bridge",
  //   features: [
  //     "Bridge tokens between Ethereum and Layer 2s",
  //     "Support for multiple chains",
  //     "Secure cross-chain transfers",
  //   ],
  //   prompts: [
  //     "Bridge 1 USDC from Ethereum to Polygon - Li.Fi.",
  //     "Swap 10 USDC from Polygon to Ethereum.",
  //   ],
  //   chains: ["Ethereum", "Polygon"],
  // },
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
    Balance_Binance:
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
  };

  return toolIconMapping[toolName] || null;
};
