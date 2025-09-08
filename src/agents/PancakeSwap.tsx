// import { Native, ChainId, CurrencyAmount, TradeType } from "@pancakeswap/sdk";
// import { InfinityRouter } from "@pancakeswap/smart-router";
// import { bscTokens } from "@pancakeswap/tokens";
// import { bsc } from "viem/chains";
// import { swap } from "@pancakeswap/v3-sdk";
// import {
//   useCopilotAction,
//   useCopilotAdditionalInstructions,
// } from "@copilotkit/react-core";
// import { useAppKitAccount } from "@reown/appkit/react";
// import { ethers } from "ethers";
// import { getContractAddressWithDecimals } from "@/lib/coingecko";
// import SlippageSelector from "@/components/SlippageSelector";
// import { useRewardIntegrations } from "@/hooks/useRewardIntegrations";
// import { logUserAction } from "@/actions/statistics";
// import { getTokenUsdPrice } from "@/lib/pricing";
// import { useCallback, useMemo, useState } from "react";
// import { createPublicClient, http } from "viem";

// const PancakeSwap = () => {
//   const [trade, setTrade] = useState<
//     Awaited<ReturnType<typeof InfinityRouter.getBestTrade>> | undefined
//   >(undefined);
//   const { isConnected, address } = useAppKitAccount();
//   const { handleDefiAction } = useRewardIntegrations(address);
//   const chainId = ChainId.BSC;
//   const swapFrom = Native.onChain(chainId);
//   const swapTo = bscTokens.usdt;
//   const client = createPublicClient({
//     chain: bsc,
//     transport: http("https://bsc-dataseed1.binance.org"),
//     batch: {
//       multicall: {
//         batchSize: 1024 * 200,
//       },
//     },
//   });

//   const amount = useMemo(
//     () => CurrencyAmount.fromRawAmount(swapFrom, 10 ** 16),
//     []
//   );
//   const getBestRoute = useCallback(async () => {
//     const v3Pools = await InfinityRouter.getV3CandidatePools({
//       clientProvider: () => client,
//       currencyA: swapFrom,
//       currencyB: swapTo,
//     });
//     const pools = [...v3Pools];
//     const trade = await InfinityRouter.getBestTrade(
//       amount,
//       swapTo,
//       TradeType.EXACT_INPUT,
//       {
//         gasPriceWei: () => client.getGasPrice(),
//         candidatePools: pools,
//       }
//     );
//     setTrade(trade);
//   }, [amount]);

//   useCopilotAdditionalInstructions({
//     instructions:
//       "Make sure to use the WrapETH function for wrapping ETH to WETH",
//   });

//   return (
//     // <button onClick={handleTest}>Test Swap</button>
//     null
//   );
// };

// export default PancakeSwap;
