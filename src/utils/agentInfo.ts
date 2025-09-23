import type { AgentTool } from "@/components/AgentInfoModal";

export type AgentKey =
  | "Lido Finance"
  | "Uniswap"
  | "KyberSwap"
  | "CoinGecko"
  | "Alchemy SDK"
  | "Aave Protocol"
  | "Li.Fi"
  | "Binance"
  | "Bybit"
  | string;

// Minimal curated metadata per agent. Extend over time.
export const AGENT_TOOLS: Record<AgentKey, AgentTool[]> = {
  "Aave Protocol": [
    {
      name: "Lend",
      description:
        "Supply assets to an Aave reserve. Supports native supply and EIP-2612 permit when available.",
      params: [
        {
          name: "symbol",
          type: "string",
          description: "Token symbol (e.g., USDC)",
          required: false,
        },
        {
          name: "address",
          type: "string",
          description: "Token address (overrides symbol)",
          required: false,
        },
        {
          name: "amount",
          type: "string",
          description: "Amount to supply",
          required: true,
        },
        {
          name: "useNative",
          type: "boolean",
          description: "Use native asset path if supported",
        },
        {
          name: "usePermit",
          type: "boolean",
          description: "Use permit signature if supported",
        },
      ],
    },
    {
      name: "Borrow",
      description:
        "Borrow assets against your collateral with checks for capacity and reserve status.",
      params: [
        { name: "symbol", type: "string", required: false },
        { name: "address", type: "string", required: false },
        { name: "amount", type: "string", required: true },
        { name: "useNative", type: "boolean", required: false },
        { name: "onBehalfOf", type: "string", required: false },
      ],
    },
    {
      name: "Repay",
      description:
        "Repay borrowed assets. Supports 'max', native repay, and permit when supported.",
      params: [
        { name: "tokenSymbol", type: "string", required: false },
        { name: "address", type: "string", required: false },
        {
          name: "amount",
          type: "string",
          description: "Use 'max' for full repayment",
          required: true,
        },
        { name: "useNative", type: "boolean", required: false },
        { name: "usePermit", type: "boolean", required: false },
      ],
    },
    {
      name: "Withdraw",
      description: "Withdraw supplied assets from Aave markets.",
    },
    {
      name: "ToggleCollateral",
      description: "Enable or disable an asset as collateral.",
      params: [
        { name: "tokenSymbol", type: "string", required: true },
        { name: "enable", type: "boolean", required: false },
      ],
    },
    {
      name: "FindHighestApyReserves",
      description: "Find reserves with highest supply or borrow APY.",
      params: [
        { name: "type", type: "'supply' | 'borrow'", required: false },
        { name: "limit", type: "number", required: false },
        { name: "minLiquidity", type: "number", required: false },
      ],
    },
    {
      name: "FindingReserves",
      description: "Find reserves by token symbol across supply/borrow.",
      params: [
        { name: "symbol", type: "string", required: true },
        { name: "type", type: "'supply' | 'borrow' | 'both'", required: false },
      ],
    },
    {
      name: "GetUserPortfolio",
      description: "Get connected user's Aave portfolio summary.",
      params: [{ name: "userAddress", type: "string", required: false }],
    },
    {
      name: "ApproveCreditDelegation",
      description: "Approve a delegatee to borrow against your collateral.",
      params: [
        { name: "tokenSymbol", type: "string", required: true },
        { name: "delegateeAddress", type: "string", required: true },
        { name: "amount", type: "string", required: true },
      ],
    },
  ],
  Uniswap: [
    {
      name: "getUniswapQuote",
      description:
        "Get a Uniswap V2 quote with slippage and price impact info.",
      params: [
        { name: "tokenInSymbol", type: "string", required: true },
        { name: "tokenOutSymbol", type: "string", required: true },
        { name: "amount", type: "string", required: true },
        { name: "platform", type: "string", required: false },
        { name: "slippage", type: "string", required: false },
      ],
    },
    {
      name: "swapTokens",
      description: "Execute a Uniswap V2 swap with a slippage selector UI.",
      params: [
        { name: "tokenInSymbol", type: "string", required: true },
        { name: "tokenOutSymbol", type: "string", required: true },
        { name: "amount", type: "string", required: true },
        { name: "platform", type: "string", required: false },
      ],
    },
    {
      name: "executeSwap",
      description: "Programmatic swap execution with specified slippage.",
      params: [
        { name: "tokenInSymbol", type: "string", required: true },
        { name: "tokenOutSymbol", type: "string", required: true },
        { name: "amount", type: "string", required: true },
        { name: "platform", type: "string", required: false },
        { name: "slippage", type: "string", required: false },
      ],
    },
    {
      name: "WrapETH",
      description: "Wrap ETH to WETH.",
      params: [{ name: "amount", type: "string", required: true }],
    },
    {
      name: "unwrapWETH",
      description: "Unwrap WETH to ETH.",
      params: [{ name: "amount", type: "string", required: true }],
    },
  ],
  KyberSwap: [
    {
      name: "GettingRoutes",
      description: "Get best KyberSwap routes using token symbols.",
      params: [
        { name: "tokenInSymbol", type: "string", required: true },
        { name: "tokenOutSymbol", type: "string", required: true },
        { name: "amount", type: "string", required: true },
        { name: "platform", type: "string", required: false },
      ],
    },
    {
      name: "Swapping",
      description:
        "Execute swap via KyberSwap with token and slippage selection UI.",
      params: [
        { name: "tokenInSymbol", type: "string", required: true },
        { name: "tokenOutSymbol", type: "string", required: true },
        { name: "amount", type: "string", required: true },
        { name: "platform", type: "string", required: false },
      ],
    },
    {
      name: "executeKyberSwap",
      description: "Execute KyberSwap transaction programmatically (internal).",
    },
  ],
  "Lido Finance": [
    {
      name: "stakeETH",
      description: "Stake ETH via Lido (and simulate/estimate).",
      params: [
        {
          name: "operation",
          type: "'stake' | 'simulate' | 'estimateGas' | 'populate'",
          required: true,
          description:
            "Operation to perform: execute stake, simulate, estimate gas, or populate tx",
        },
        {
          name: "amount",
          type: "string",
          required: true,
          description: "Amount of ETH to stake (e.g. '0.1')",
        },
        {
          name: "referralAddress",
          type: "string",
          required: false,
          description: "Optional referral address (0x...)",
        },
      ],
    },
    {
      name: "wrapETH",
      description: "Lido wrapping operations (wrapEth/wrapSteth/unwrap).",
      params: [
        {
          name: "operation",
          type: "'wrapEth' | 'wrapSteth' | 'unwrap' | 'approveSteth' | 'getAllowance'",
          required: true,
          description:
            "Wrap or unwrap operation; approveSteth to set allowance, getAllowance to view",
        },
        {
          name: "amount",
          type: "string",
          required: true,
          description:
            "Amount to wrap/unwrap/approve (ETH/stETH/wstETH as applicable)",
        },
      ],
    },
    {
      name: "getLidoBalances",
      description: "Get ETH/stETH/wstETH/shares balances.",
      params: [
        {
          name: "balanceType",
          type: "'eth' | 'steth' | 'wsteth' | 'shares' | 'all'",
          required: true,
          description: "Which balance(s) to fetch",
        },
        {
          name: "walletAddress",
          type: "string",
          required: false,
          description: "Optional wallet address (defaults to connected wallet)",
        },
      ],
    },
    {
      name: "lidoStatistics",
      description: "Fetch APR and protocol stats (may be limited by RPC).",
      params: [
        {
          name: "statType",
          type: "'lastApr' | 'smaApr' | 'protocolInfo'",
          required: true,
          description: "Statistic to retrieve",
        },
        {
          name: "days",
          type: "number",
          required: false,
          description: "Days for SMA APR (only for 'smaApr')",
        },
      ],
    },
    {
      name: "lidoTokenOperations",
      description: "Transfers/approvals/allowances for stETH/wstETH.",
      params: [
        {
          name: "operation",
          type: "'transferSteth' | 'transferWsteth' | 'approveSteth' | 'approveWsteth' | 'getAllowanceSteth' | 'getAllowanceWsteth'",
          required: true,
          description: "Token operation to perform",
        },
        {
          name: "amount",
          type: "string",
          required: true,
          description:
            "Amount for transfer/approval (ignored for getAllowance*)",
        },
        {
          name: "toAddress",
          type: "string",
          required: true,
          description:
            "Recipient address for transfers or spender address for approvals",
        },
      ],
    },
    {
      name: "withdrawstETH",
      description: "Request withdrawal to Lido queue (permit/allowance).",
      params: [
        {
          name: "mode",
          type: "'permit' | 'allowance'",
          required: true,
          description: "Use signature permit (EOA) or prior allowance",
        },
        {
          name: "token",
          type: "'stETH' | 'wstETH'",
          required: true,
          description: "Token to withdraw",
        },
        {
          name: "amount",
          type: "string",
          required: true,
          description: "Amount to withdraw",
        },
      ],
    },
    {
      name: "lidoWithdrawalApprove",
      description: "Approve withdrawal queue spending.",
      params: [
        {
          name: "token",
          type: "'stETH' | 'wstETH'",
          required: true,
          description: "Token to approve",
        },
        {
          name: "amount",
          type: "string",
          required: true,
          description: "Amount to approve",
        },
      ],
    },
    {
      name: "lidoWithdrawalClaim",
      description: "Claim finalized withdrawal requests.",
      params: [
        {
          name: "requestsIds",
          type: "string",
          required: false,
          description: "Comma-separated request IDs (omit to auto-claim all)",
        },
      ],
    },
    {
      name: "lidoWithdrawalInfo",
      description: "Get withdrawal-related info and utilities.",
      params: [
        {
          name: "infoType",
          type: "string",
          required: true,
          description:
            "'requestsInfo' | 'status' | 'claimable' | 'claimableEthByAccount' | 'pending' | 'waitingTimeByAmount' | 'waitingTimeByIds' | 'constants' | 'allowance' | 'checkAllowance' | 'splitAmount'",
        },
        {
          name: "amount",
          type: "string",
          required: false,
          description:
            "Amount for waiting time by amount, checkAllowance, or splitAmount",
        },
        {
          name: "ids",
          type: "string",
          required: false,
          description:
            "Comma-separated request IDs (for waitingTimeByIds/status subset)",
        },
        {
          name: "token",
          type: "'stETH' | 'wstETH'",
          required: false,
          description: "Token for allowance/checkAllowance/splitAmount",
        },
      ],
    },
  ],
  "Li.Fi": [
    {
      name: "GetBridgeQuote",
      description:
        "Get best bridge route via Li.Fi (with optional slippage/recipient).",
      params: [
        { name: "fromChainId", type: "number", required: true },
        { name: "toChainId", type: "number", required: true },
        { name: "fromToken", type: "string", required: true },
        { name: "toToken", type: "string", required: true },
        { name: "amount", type: "string", required: true },
        { name: "fromTokenDecimals", type: "number", required: true },
        { name: "recipient", type: "string", required: false },
        { name: "slippage", type: "number", required: false },
      ],
    },
    {
      name: "ExecuteBridge",
      description:
        "Execute a Li.Fi route including approvals and transactions.",
    },
  ],
  "Alchemy SDK": [
    {
      name: "getAccountBalance",
      description:
        "Get ERC-20 balance for a wallet using Alchemy. Provide contractAddress; walletAddress defaults to connected wallet.",
      params: [
        {
          name: "contractAddress",
          type: "string",
          required: true,
          description: "ERC-20 contract address",
        },
        {
          name: "walletAddress",
          type: "string",
          required: false,
          description: "Defaults to connected wallet",
        },
      ],
    },
    {
      name: "getAllTokenBalances",
      description:
        "Fetch native ETH and all ERC-20 balances for the connected or provided wallet.",
      params: [
        { name: "walletAddress", type: "string", required: false },
        { name: "includeZeroBalances", type: "boolean", required: false },
        { name: "maxTokens", type: "number", required: false },
      ],
    },
  ],
  Binance: [
    {
      name: "Balance_Binance",
      description: "Get Binance USDT balance (requires API keys).",
    },
    {
      name: "CreateOrder_Binance",
      description:
        "Create futures order with leverage, TP/SL, and confirmation UI.",
      params: [
        {
          name: "symbol",
          type: "string",
          required: true,
          description: "Trading pair, e.g. BTCUSDT",
        },
        {
          name: "side",
          type: "string",
          required: true,
          description: "'BUY' or 'SELL'",
        },
        {
          name: "amount",
          type: "string",
          required: true,
          description: "Investment amount in USDT",
        },
        {
          name: "leverage",
          type: "number",
          required: false,
          description: "1-125x",
        },
        { name: "takeProfitPrice", type: "string", required: false },
        { name: "stopLossPrice", type: "string", required: false },
        { name: "takeProfitPercent", type: "number", required: false },
        { name: "stopLossPercent", type: "number", required: false },
      ],
    },
    {
      name: "ChangeLeverage_Binance",
      description: "Change leverage for a futures symbol.",
      params: [
        { name: "symbol", type: "string", required: true },
        { name: "leverage", type: "number", required: true },
      ],
    },
    {
      name: "PositionInfo_Binance",
      description: "Get detailed futures position info for a symbol.",
      params: [{ name: "symbol", type: "string", required: true }],
    },
  ],
  Bybit: [
    {
      name: "Balance_Bybit",
      description: "Get Bybit balance (requires API keys).",
    },
    {
      name: "CreateOrder_Bybit",
      description:
        "Create derivatives order with leverage and confirmation UI.",
      params: [
        {
          name: "symbol",
          type: "string",
          required: true,
          description: "Trading pair, e.g. BTCUSDT",
        },
        {
          name: "side",
          type: "string",
          required: true,
          description: "'Buy' or 'Sell'",
        },
        {
          name: "amount",
          type: "string",
          required: true,
          description: "Investment amount in USDT",
        },
        {
          name: "leverage",
          type: "number",
          required: false,
          description: "1-100x",
        },
        { name: "takeProfitPrice", type: "string", required: false },
        { name: "stopLossPrice", type: "string", required: false },
        { name: "takeProfitPercent", type: "number", required: false },
        { name: "stopLossPercent", type: "number", required: false },
      ],
    },
    {
      name: "ChangeLeverage_Bybit",
      description: "Change leverage for a contract.",
      params: [
        { name: "symbol", type: "string", required: true },
        { name: "leverage", type: "number", required: true },
      ],
    },
    {
      name: "PositionInfo_Bybit",
      description: "Get position data for a symbol.",
      params: [{ name: "symbol", type: "string", required: true }],
    },
  ],
  CoinGecko: [
    {
      name: "GetTokenPrice",
      description: "Get current token price and market data.",
      params: [
        { name: "symbol", type: "string", required: false },
        { name: "coinId", type: "string", required: false },
      ],
    },
    {
      name: "GetToken",
      description: "Fetch token details by symbol or id.",
      params: [
        { name: "symbol", type: "string", required: false },
        { name: "coinId", type: "string", required: false },
      ],
    },
    {
      name: "getCoinDetails",
      description: "Detailed coin information.",
      params: [{ name: "coinId", type: "string", required: true }],
    },
    {
      name: "searchCoinsByName",
      description: "Search coins by name.",
      params: [{ name: "query", type: "string", required: true }],
    },
    {
      name: "getContractAddress",
      description: "Get contract address by symbol/platform.",
      params: [
        { name: "symbol", type: "string", required: true },
        { name: "platform", type: "string", required: false },
      ],
    },
    {
      name: "getTokenDecimals",
      description: "Resolve token decimals.",
      params: [
        { name: "symbol", type: "string", required: true },
        { name: "platform", type: "string", required: false },
      ],
    },
    {
      name: "getAvailablePlatforms",
      description: "List supported platforms for a token.",
      params: [{ name: "symbol", type: "string", required: true }],
    },
  ],
};
