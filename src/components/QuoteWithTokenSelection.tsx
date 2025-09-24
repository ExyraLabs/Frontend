"use client";
import { useState, useEffect } from "react";
import TokenSelector, { TokenOption } from "./TokenSelector";

interface QuoteWithTokenSelectionProps {
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amount: string;
  platform: string;
  onResult: (result: string) => void;
  onCancel: () => void;
}

const QuoteWithTokenSelection = ({
  tokenInSymbol,
  tokenOutSymbol,
  amount,
  platform,
  onResult,
  onCancel,
}: QuoteWithTokenSelectionProps) => {
  const [selectedTokenIn, setSelectedTokenIn] = useState<TokenOption | null>(
    null
  );
  const [selectedTokenOut, setSelectedTokenOut] = useState<TokenOption | null>(
    null
  );
  const [tokenInOptions, setTokenInOptions] = useState<TokenOption[]>([]);
  const [tokenOutOptions, setTokenOutOptions] = useState<TokenOption[]>([]);
  const [currentSelection, setCurrentSelection] = useState<
    "init" | "input" | "output" | "complete"
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

        setTokenInOptions(tokenInOptions);
        setTokenOutOptions(tokenOutOptions);

        // Determine the flow based on number of options
        if (tokenInOptions.length === 1 && tokenOutOptions.length === 1) {
          // No selection needed, execute directly
          setSelectedTokenIn(tokenInOptions[0]);
          setSelectedTokenOut(tokenOutOptions[0]);
          setCurrentSelection("complete");
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

  useEffect(() => {
    if (
      currentSelection === "complete" &&
      selectedTokenIn &&
      selectedTokenOut
    ) {
      const executeQuote = async () => {
        try {
          // Import the handler function dynamically
          const { handleGetKyberSwapQuoteBySymbolStandalone } = await import(
            "@/lib/kncUtils"
          );

          const result = await handleGetKyberSwapQuoteBySymbolStandalone({
            tokenInSymbol,
            tokenOutSymbol,
            amount,
            platform,
            selectedTokenIn,
            selectedTokenOut,
          });

          if (typeof result === "string") {
            onResult(result);
          } else {
            onResult("❌ Unexpected result format from quote handler");
          }
        } catch (error) {
          onResult(
            `❌ Error getting quote: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      };

      executeQuote();
    }
  }, [
    currentSelection,
    selectedTokenIn,
    selectedTokenOut,
    tokenInSymbol,
    tokenOutSymbol,
    amount,
    platform,
    onResult,
  ]);

  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6 max-w-md w-[90vw] mx-4">
        <div className="flex items-center justify-center gap-3 text-[#A9A0FF] mb-4">
          <div className="w-4 h-4 border-2 border-[#A9A0FF] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white font-medium">Initializing Quote...</div>
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
            setCurrentSelection("complete");
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
          setCurrentSelection("complete");
        }}
        onCancel={onCancel}
      />
    );
  }

  if (currentSelection === "complete" && selectedTokenIn && selectedTokenOut) {
    return (
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6 max-w-md w-[90vw] mx-4">
        <div className="flex items-center justify-center gap-3 text-[#A9A0FF] mb-4">
          <div className="w-4 h-4 border-2 border-[#A9A0FF] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white font-medium">Getting Quote...</div>
        </div>
        <div className="text-gray-400 text-sm text-center mb-2">
          {amount} {selectedTokenIn.name} → {selectedTokenOut.name}
        </div>
        <div className="text-gray-400 text-xs text-center">
          Platform: {platform}
        </div>
      </div>
    );
  }

  return null;
};

export default QuoteWithTokenSelection;
