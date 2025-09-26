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

export const AGENT_CARDS = [
  {
    icon: "/icons/llama.jpeg",
    title: "DefiLlama",
    subtitle: "DeFi analytics: TVL, yields, prices",
    category: "Research",
    features: [
      "Discover top yield farms across chains",
      "Track protocol and chain TVL trends",
      "Fetch token prices via DefiLlama",
    ],
    prompts: [
      "Show top yield pools on Arbitrum with TVL > $1M",
      "Get Aave protocol TVL and top chains",
      "What are the highest APY stablecoin pools right now?",
      "Get TVL ranking of top 10 chains",
    ],
    chains: ["Ethereum", "Arbitrum", "Optimism", "Polygon", "Base"],
  },
  {
    icon: "/icons/Lido.png",
    title: "Lido Finance",
    subtitle: "Liquid staking for Ethereum",
    category: "Stake",
    features: [
      "Earn staking rewards on your ETH",
      "Participate in DeFi with stETH",
    ],
    prompts: [
      "Stake 0.1 ETH with Lido to earn rewards",
      "Check my stETH balance and shares",
      "Request withdrawal of 0.05 stETH",
      "Get current Lido staking APR and statistics",
    ],
    chains: ["Ethereum"],
  },
  {
    icon: "/icons/uniswap.png",
    title: "Uniswap",
    subtitle: "Decentralized exchange for swapping tokens",
    category: "Swap",
    features: [
      // "Swap any ERC-20 token instantly",
      "Provide liquidity and earn fees",
      "Access deep liquidity pools",
    ],
    prompts: [
      "Get quote for swapping 50 USDC to ETH",
      "Swap 0.1 ETH for USDT on Uniswap",
      "Wrap 0.5 ETH to WETH",
      "Unwrap 0.3 WETH back to ETH",
    ],
    chains: ["Ethereum"],
  },
  {
    icon: "/icons/kyber.png",
    title: "KyberSwap",
    subtitle: "Multi-chain DEX aggregator",
    category: "Swap",
    features: [
      "Find best token swap rates across chains",
      "Swap tokens on Ethereum, BSC, Polygon and more",
      "Earn rewards by providing liquidity",
    ],
    prompts: [
      "Get best routes for swapping 1 ETH to USDC",
      "Swap 200 USDT for ETH on Ethereum",
      "Find optimal swap rates across DEXs",
      "Execute swap with 0.5% slippage tolerance",
    ],
    chains: ["Ethereum"],
  },
  {
    icon: "/icons/gecko.png",
    title: "CoinGecko",
    subtitle: "Your go-to source for crypto market data",
    category: "Research",
    features: [
      "Track price movements of your favorite coins",
      "Get real-time market data and charts",
      "Compare different cryptocurrencies",
    ],
    prompts: [
      "Get current Bitcoin price and market data",
      "Find contract address for USDC token",
      "Search for Ethereum token information",
      "Get token details and price for SOL",
    ],
    chains: ["Ethereum"],
  },
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
  {
    icon: "/icons/alchemy.svg",
    title: "Alchemy SDK",
    subtitle: "Powerful blockchain data and infrastructure",
    category: "Research",
    features: [
      "Access comprehensive blockchain data",
      "Get real-time transaction information",
      "Query NFT metadata and ownership",
    ],
    prompts: [
      "Get all token balances in my wallet",
      "Check USDC balance for my address",
      "Get account balance for specific token",
      "Show ETH balance for wallet address",
    ],
    chains: ["Ethereum"],
  },
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
  {
    icon: "/icons/aave.svg",
    title: "Aave Protocol",
    subtitle: "Decentralized lending and borrowing platform",
    category: "Lend",
    features: [
      "Lend crypto assets to earn interest",
      "Borrow against your collateral",
      "Access flash loans",
    ],
    prompts: [
      "Supply 100 USDC to Aave for lending",
      "Find highest APY reserves available",
      "Borrow 50 DAI against my collateral",
      "Check my current supply and borrow positions",
    ],
    chains: ["Ethereum"],
  },
  {
    icon: "/icons/lifi.png",
    title: "Li.Fi",
    subtitle: "Cross-chain bridging powered by Li.Fi SDK",
    category: "Bridge",
    features: [
      "Bridge tokens between Ethereum and Layer 2s",
      "Support for multiple chains",
      "Secure cross-chain transfers",
    ],
    prompts: [
      "Get bridge quote for 100 USDC to Polygon",
      "Execute bridge from Ethereum to Arbitrum",
      "Find cheapest way to bridge USDT to Base",
      "Get bridge fees for 0.5 ETH to Optimism",
    ],
    chains: ["Ethereum", "Polygon"],
  },
  {
    icon: "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
    title: "Binance",
    subtitle: "Leading cryptocurrency exchange platform",
    category: "Trading",
    features: [
      "Check your Binance account balance",
      "Access real-time trading data",
      "Secure API integration",
    ],
    prompts: [
      "Check my Binance futures balance",
      "Create order: Buy BTCUSDT with 10x leverage",
      "Set leverage to 5x for ETHUSDT",
      "Get position info for SOLUSDT",
    ],
    chains: [
      "Ethereum",
      "BNB Smart Chain",
      "Arbitrum",
      "Optimism",
      "Solana",
      "Monad",
      "Berachain",
    ],
  },
  {
    icon: "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
    title: "Bybit",
    subtitle: "Advanced cryptocurrency derivatives exchange",
    category: "Trading",
    features: [
      "Check your Bybit account balance",
      "Access derivatives trading data",
      "Secure API integration",
    ],
    prompts: [
      "Show my Bybit account balance",
      "Place order: Long BTCUSDT $100 with 20x leverage",
      "Change leverage to 15x for ETHUSDT",
      "Check position details for ADAUSDT",
    ],
    chains: [
      "Ethereum",
      "BNB Smart Chain",
      "Arbitrum",
      "Optimism",
      "Solana",
      "Monad",
      "Berachain",
    ],
  },
];

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
    history: [],

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
    history: [],
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
  {
    icon: [
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
    ],
    title: "Engulfing",
    subtitle: "Spotting Engulfing patterns.",
    category: "CEX",
    features: [
      "Identify bullish and bearish engulfing patterns.",
      "Use patterns to predict price reversals.",
    ],
    notes: ["Engulfing patterns are strong reversal signals."],
    chains: ["Ethereum", "BNB Smart Chain"],
    tradeType: "Swing",
    history: [],
    pnl: 0,
    riskLevel: "Medium",
    tags: ["Chart Patterns", "Reversal"],
    entryCriterias: ["Bullish engulfing pattern", "Volume increase > 100%"],
    exitCriteria: ["Bearish engulfing pattern", "Take Profit reached"],
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

    //Bybit,
    CreateOrder_Bybit:
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
    Balance_Bybit:
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
    PositionInfo_Bybit:
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
    ChangeLeverage_Bybit:
      "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",
    //Binance,
    Balance_Binance:
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
    CreateOrder_Binance:
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
    PositionInfo_Binance:
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
    ChangeLeverage_Binance:
      "https://assets.coingecko.com/markets/images/52/small/binance.jpg",

    // DefiLlama tools
    getTopYieldPools: "/icons/llama.jpeg",
    getProtocolTvl: "/icons/llama.jpeg",
    getChainTvl: "/icons/llama.jpeg",
    getTokenPriceDefiLlama: "/icons/llama.jpeg",
    listProtocols: "/icons/llama.jpeg",
    getLargestProtocolsByTvl: "/icons/llama.jpeg",
    getProtocolHistoricalTvl: "/icons/llama.jpeg",
    getProtocolTvlChange: "/icons/llama.jpeg",
    getStablecoinsOverview: "/icons/llama.jpeg",
    getStablecoinChainDistribution: "/icons/llama.jpeg",
    getTopStablecoinChains: "/icons/llama.jpeg",
    getPoolHistoricalApy: "/icons/llama.jpeg",
    getPoolCurrentApy: "/icons/llama.jpeg",
    getAggregatedChainTvlSummary: "/icons/llama.jpeg",
  };

  return toolIconMapping[toolName] || null;
};
