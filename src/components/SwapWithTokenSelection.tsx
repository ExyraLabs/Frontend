"use client";
import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import TokenSelector, { TokenOption } from "./TokenSelector";
import SlippageSelector from "./SlippageSelector";
import { useRewardIntegrations } from "@/hooks/useRewardIntegrations";
import { logUserAction } from "@/actions/statistics";

interface SwapWithTokenSelectionProps {
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amount: string;
  platform: string;
  onResult: (result: string) => void;
  onCancel: () => void;
}

const SwapWithTokenSelection = ({
  tokenInSymbol,
  tokenOutSymbol,
  amount,
  platform,
  onResult,
  onCancel,
}: SwapWithTokenSelectionProps) => {
  const { address } = useAppKitAccount();
  const { handleDefiAction } = useRewardIntegrations(address);

  const [selectedTokenIn, setSelectedTokenIn] = useState<TokenOption | null>(
    null
  );
  const [selectedTokenOut, setSelectedTokenOut] = useState<TokenOption | null>(
    null
  );
  const [tokenInOptions, setTokenInOptions] = useState<TokenOption[]>([]);
  const [tokenOutOptions, setTokenOutOptions] = useState<TokenOption[]>([]);
  const [currentSelection, setCurrentSelection] = useState<
    "init" | "input" | "output" | "slippage" | "executing"
  >("init");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initTokenSelection = async () => {
      setIsLoading(true);
      try {
        // Import the handler function dynamically to avoid circular dependencies
        const { getAllContractAddressesWithDecimals } = await import(
          "@/lib/coingecko"
        );

        // Get all token options for both symbols
        const [tokenInOptionsData, tokenOutOptionsData] = await Promise.all([
          getAllContractAddressesWithDecimals(tokenInSymbol, platform),
          getAllContractAddressesWithDecimals(tokenOutSymbol, platform),
        ]);

        if (!tokenInOptionsData || tokenInOptionsData.length === 0) {
          onResult(`❌ Could not find contract addresses for ${tokenInSymbol} on ${platform}.

🔧 Try:
  • Use 'checkTokenPlatforms' to see available platforms
  • Verify token symbols are correct
  • Try different platform (ethereum, polygon-pos, binance-smart-chain, etc.)`);
          return;
        }

        if (!tokenOutOptionsData || tokenOutOptionsData.length === 0) {
          onResult(`❌ Could not find contract addresses for ${tokenOutSymbol} on ${platform}.

🔧 Try:
  • Use 'checkTokenPlatforms' to see available platforms
  • Verify token symbols are correct
  • Try different platform (ethereum, polygon-pos, binance-smart-chain, etc.)`);
          return;
        }

        const tokenInOptions = tokenInOptionsData.map((token) => ({
          ...token,
          platform,
        }));
        const tokenOutOptions = tokenOutOptionsData.map((token) => ({
          ...token,
          platform,
        }));

        console.log(tokenOutOptions, "tokenOutOptions");

        setTokenInOptions(tokenInOptions);
        setTokenOutOptions(tokenOutOptions);

        // Determine the flow based on number of options
        if (tokenInOptions.length === 1 && tokenOutOptions.length === 1) {
          // No selection needed, go directly to slippage
          setSelectedTokenIn(tokenInOptions[0]);
          setSelectedTokenOut(tokenOutOptions[0]);
          setCurrentSelection("slippage");
        } else if (tokenInOptions.length > 1) {
          // Need to select input token first
          setCurrentSelection("input");
        } else if (tokenOutOptions.length > 1) {
          // Auto-select single input token, need to select output token
          setSelectedTokenIn(tokenInOptions[0]);
          setCurrentSelection("output");
        }
      } catch (error) {
        onResult(
          `❌ Error initializing token selection: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    initTokenSelection();
  }, [tokenInSymbol, tokenOutSymbol, platform, onResult]);

  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6 max-w-md w-[90vw] mx-4">
        <div className="flex items-center justify-center gap-3 text-[#A9A0FF] mb-4">
          <div className="w-4 h-4 border-2 border-[#A9A0FF] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white font-medium">Preparing Swap...</div>
        </div>
        <div className="text-gray-400 text-sm text-center">
          Checking available tokens for {tokenInSymbol} → {tokenOutSymbol}
        </div>
      </div>
    );
  }

  if (currentSelection === "input" && tokenInOptions.length > 1) {
    return (
      <TokenSelector
        tokens={tokenInOptions}
        tokenType="input"
        onSelect={(token) => {
          setSelectedTokenIn(token);
          if (tokenOutOptions.length > 1) {
            setCurrentSelection("output");
          } else {
            setSelectedTokenOut(tokenOutOptions[0]);
            setCurrentSelection("slippage");
          }
        }}
        onCancel={onCancel}
      />
    );
  }

  if (currentSelection === "output" && tokenOutOptions.length > 1) {
    return (
      <TokenSelector
        tokens={tokenOutOptions}
        tokenType="output"
        onSelect={(token) => {
          setSelectedTokenOut(token);
          setCurrentSelection("slippage");
        }}
        onCancel={onCancel}
      />
    );
  }

  if (currentSelection === "slippage" && selectedTokenIn && selectedTokenOut) {
    return (
      <SlippageSelector
        tokenInSymbol={selectedTokenIn.symbol}
        tokenOutSymbol={selectedTokenOut.symbol}
        amount={amount}
        platform={platform}
        onConfirm={async (slippageTolerance: number) => {
          setCurrentSelection("executing");
          try {
            // Import the handler function dynamically
            const { handleExecuteKyberSwapBySymbolStandalone } = await import(
              "@/lib/kncUtils"
            );

            const result = await handleExecuteKyberSwapBySymbolStandalone({
              tokenInSymbol,
              tokenOutSymbol,
              amount,
              platform,
              slippageTolerance,
              selectedTokenIn,
              selectedTokenOut,
              address: address || undefined,
              handleDefiAction: address
                ? async (action: string) => {
                    if (action === "swap") {
                      await handleDefiAction("swap");
                    }
                  }
                : undefined,
              logUserAction: address
                ? async (data) => {
                    await logUserAction({
                      address: data.address,
                      agent: data.agent,
                      action: data.action,
                      volume: data.volume,
                      token: data.token,
                      volumeUsd: data.volumeUsd,
                      extra: data.extra,
                    });
                  }
                : undefined,
            });

            if (typeof result === "string") {
              onResult(result);
            } else {
              onResult("❌ Unexpected result format from swap handler");
            }
          } catch (error) {
            onResult(
              `❌ Error executing swap: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }}
        onCancel={onCancel}
      />
    );
  }

  if (currentSelection === "executing") {
    return (
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6 max-w-md w-[90vw] mx-4">
        <div className="flex items-center justify-center gap-3 text-[#A9A0FF] mb-4">
          <div className="w-4 h-4 border-2 border-[#A9A0FF] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white font-medium">Executing Swap...</div>
        </div>
        <div className="text-gray-400 text-sm text-center mb-2">
          {amount} {selectedTokenIn?.name} → {selectedTokenOut?.name}
        </div>
        <div className="text-gray-400 text-xs text-center">
          Platform: {platform}
        </div>
        <button
          onClick={onCancel}
          className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return null;
};

export default SwapWithTokenSelection;
