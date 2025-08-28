"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { logUserAction } from "@/actions/statistics";
import { getRoutes, executeRoute } from "@lifi/sdk";
import type { RoutesRequest } from "@lifi/types";
import type { Route, RouteExtended, ExecutionOptions } from "@lifi/sdk";
import type { LiFiStep } from "@lifi/types";
import { useWalletClient } from "wagmi";
import { parseUnits, type Address } from "viem";

// ========== Extracted, testable handlers ==========

export type GetBridgeQuoteParams = {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  amount: string; // human amount (e.g. "1.25")
  fromTokenDecimals: number;
  recipient?: string;
  slippage?: number; // percent
  account: Address; // wallet address required by LI.FI
};

// Convert human amount to wei string with provided decimals
function toWei(amount: string, decimals: number) {
  return parseUnits(amount, decimals).toString();
}

// Using functional SDK surface (no class instance required)

export default function Bridge() {
  const { data: walletClient } = useWalletClient();

  async function handleGetBridgeQuote({
    fromChainId,
    toChainId,
    fromToken,
    toToken,
    amount,
    fromTokenDecimals,
    recipient,
    slippage,
    account,
  }: GetBridgeQuoteParams) {
    const wei = toWei(amount, Number(fromTokenDecimals));
    const request: RoutesRequest = {
      fromChainId: Number(fromChainId),
      toChainId: Number(toChainId),
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      fromAmount: wei,
      fromAddress: account,
      toAddress: (recipient as Address) || account,
      options: {
        slippage: (slippage as number | undefined) ?? 0.5,
      },
    };

    try {
      const { routes } = await getRoutes(request);
      if (!routes?.length) {
        return {
          success: false,
          message: "No viable bridge route found.",
        } as const;
      }

      const best = routes[0];
      return {
        success: true,
        tool: "LI.FI",
        summary: {
          fromChainId: best.fromChainId,
          toChainId: best.toChainId,
          toAmount: best.toAmount,
          toAmountMin: best.toAmountMin,
          gasCostUSD: best.gasCostUSD,
          steps: best.steps?.map((s: LiFiStep) => ({
            type: s.type,
            tool: s.tool,
            action: s.action,
            estimate: s.estimate,
          })),
        },
        route: best,
      } as const;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to get routes";
      return { error: msg } as const;
    }
  }

  async function handleExecuteBridge({ route }: { route: Route }) {
    const updates: RouteExtended[] = [];
    try {
      const execOptions: ExecutionOptions = {
        updateRouteHook: (updatedRoute) => {
          updates.push(updatedRoute);
        },
        // Note: switchChainHook can be provided by callers if needed
      };
      const result = await executeRoute(route, execOptions);
      const address = walletClient?.account?.address || "";
      const r = route as Route;
      await logUserAction({
        address,
        agent: "Li.Fi",
        action: "Bridge",
        volume:
          Number(r?.fromAmount || 0) /
          Number(10 ** (r?.fromToken?.decimals || 0)),
        volumeUsd: Number(r?.fromAmountUSD || 0),
        token: r?.fromToken?.symbol || "",
        extra: { route: r },
      });
      return { success: true, execution: result } as const;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bridge execution failed";
      console.log("Bridge execution error", msg);
      return { error: msg, updates } as const;
    }
  }

  useCopilotAction({
    name: "GetBridgeQuote",
    description:
      "Get the best cross-chain/ same chain Li.fi route to bridge a token, including swaps if needed.",
    parameters: [
      {
        name: "fromChainId",
        type: "number",
        description: "Source chain ID",
        required: true,
      },
      {
        name: "toChainId",
        type: "number",
        description: "Destination chain ID",
        required: true,
      },
      {
        name: "fromToken",
        type: "string",
        description: "Source token address (use 0xEeee... or native wrapper)",
        required: true,
      },
      {
        name: "toToken",
        type: "string",
        description: "Destination token address",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "Human amount, e.g. '1.25'",
        required: true,
      },
      {
        name: "fromTokenDecimals",
        type: "number",
        description: "Decimals for fromToken (needed to convert to wei)",
        required: true,
      },
      {
        name: "recipient",
        type: "string",
        description: "Recipient on destination chain",
        required: false,
      },
      {
        name: "slippage",
        type: "number",
        description: "Max slippage in % (e.g. 0.5)",
        required: false,
      },
    ],
    handler: async (args: Omit<GetBridgeQuoteParams, "account">) => {
      const account = walletClient?.account?.address as Address | undefined;
      if (!account) return { error: "Connect a wallet to get a bridge quote." };
      return handleGetBridgeQuote({ ...args, account });
    },
  });

  useCopilotAction({
    name: "ExecuteBridge",
    description:
      "Execute a bridge transaction by first fetching the route and then executing it. Requests approvals and sends all required transactions.",
    parameters: [
      {
        name: "fromChainId",
        type: "number",
        description: "Source chain ID",
        required: true,
      },
      {
        name: "toChainId",
        type: "number",
        description: "Destination chain ID",
        required: true,
      },
      {
        name: "fromToken",
        type: "string",
        description: "Source token address (use 0xEeee... or native wrapper)",
        required: true,
      },
      {
        name: "toToken",
        type: "string",
        description: "Destination token address",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "Human amount, e.g. '1.25'",
        required: true,
      },
      {
        name: "fromTokenDecimals",
        type: "number",
        description: "Decimals for fromToken (needed to convert to wei)",
        required: true,
      },
      {
        name: "recipient",
        type: "string",
        description: "Recipient on destination chain",
        required: false,
      },
      {
        name: "slippage",
        type: "number",
        description: "Max slippage in % (e.g. 0.5)",
        required: false,
      },
    ],
    handler: async (args: Omit<GetBridgeQuoteParams, "account">) => {
      if (!walletClient)
        return { error: "Connect a wallet to execute the bridge." };
      const account = walletClient?.account?.address as Address | undefined;
      if (!account) return { error: "Connect a wallet to get a bridge quote." };
      const quote = await handleGetBridgeQuote({ ...args, account });
      if ("error" in quote || !quote.success) {
        return quote;
      }
      if (!quote.route) {
        return { error: "No route in quote" };
      }
      return handleExecuteBridge({ route: quote.route });
    },
  });

  const Test = async () => {
    console.log("testing");
    if (!walletClient)
      return { error: "Connect a wallet to execute the bridge." };
    const account = walletClient?.account?.address as Address | undefined;
    if (!account) return { error: "Connect a wallet to get a bridge quote." };
    const quote = await handleGetBridgeQuote({
      fromChainId: 137,
      toChainId: 1,
      toToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
      fromToken: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // USDC on Polygon
      amount: "2",
      fromTokenDecimals: 6,
      account,
    });
    console.log("Quote", quote);
    if ("error" in quote || !quote.success) {
      return quote;
    }
    if (!quote.route) {
      return { error: "No route in quote" };
    }
    const exec = await handleExecuteBridge({ route: quote.route });
    console.log("Execution", exec);
    return exec;
  };
  return null;
  // <button onClick={Test}>Test</button>;
}
