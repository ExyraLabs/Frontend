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
