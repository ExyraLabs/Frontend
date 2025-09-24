"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { fetchCoinImageById, fetchMultipleCoinImages } from "@/lib/coingecko";

export interface TokenOption {
  id: string;
  symbol: string;
  name: string;
  address: string;
  decimals?: number;
  platform: string;
  image?: string;
}

interface TokenSelectorProps {
  tokens: TokenOption[];
  tokenType: "input" | "output";
  onSelect: (token: TokenOption) => void;
  onCancel: () => void;
}

const TokenSelector = ({
  tokens,
  tokenType,
  onSelect,
  onCancel,
}: TokenSelectorProps) => {
  const [selectedToken, setSelectedToken] = useState<TokenOption | null>(null);
  const [tokensWithImages, setTokensWithImages] = useState<TokenOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log(tokens, "tokens");

  // Fetch images for all tokens using their unique coin IDs
  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        // Extract unique coin IDs from tokens
        const coinIds = tokens.map((token) => token.id);

        // Fetch all images in parallel using the robust function
        const imageMap = await fetchMultipleCoinImages(coinIds);

        // Map the images back to tokens
        const tokensWithImagesResult = tokens.map((token) => ({
          ...token,
          image: imageMap[token.id] || undefined,
        }));

        setTokensWithImages(tokensWithImagesResult);
      } catch (error) {
        console.error("Error fetching token images:", error);
        // Fallback: try individual fetching for each token
        try {
          const tokensWithImagesResult = await Promise.all(
            tokens.map(async (token) => {
              try {
                const image = await fetchCoinImageById(token.id);
                return { ...token, image: image || undefined };
              } catch (error) {
                console.warn(
                  `Failed to fetch image for ${token.name} (${token.id}):`,
                  error
                );
                return { ...token, image: undefined };
              }
            })
          );
          setTokensWithImages(tokensWithImagesResult);
        } catch (fallbackError) {
          console.error("Fallback image fetching also failed:", fallbackError);
          setTokensWithImages(tokens);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [tokens]);

  const handleConfirm = () => {
    if (selectedToken) {
      onSelect(selectedToken);
    }
  };

  const truncateAddress = (address: string) => {
    if (
      address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ||
      address === "0x0000000000000000000000000000000000000000"
    ) {
      return "Native Token";
    }
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const formatPlatform = (platform: string) => {
    const platformMap: Record<string, string> = {
      ethereum: "Ethereum",
      "binance-smart-chain": "BSC",
      "polygon-pos": "Polygon",
      "arbitrum-one": "Arbitrum",
      "optimistic-ethereum": "Optimism",
      avalanche: "Avalanche",
      base: "Base",
    };
    return (
      platformMap[platform] ||
      platform.charAt(0).toUpperCase() + platform.slice(1)
    );
  };

  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6 max-w-md w-[90vw] mx-4">
        <div className="flex items-center justify-center gap-3 text-[#A9A0FF] mb-4">
          <div className="w-4 h-4 border-2 border-[#A9A0FF] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white font-medium">Loading Token Options...</div>
        </div>
        <div className="text-gray-400 text-sm text-center">
          Fetching token details and images...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[20px] p-6 max-w-lg w-[90vw] mx-4">
      <div className="text-white font-semibold text-lg mb-4 text-center">
        Select {tokenType === "input" ? "Input" : "Output"} Token
      </div>

      <div className="text-gray-400 text-sm mb-4 text-center">
        Multiple {tokens[0]?.symbol.toUpperCase()} tokens found. Please select
        the correct one:
      </div>

      <div className="space-y-3 max-h-80 scrollbar-hide overflow-y-auto mb-6">
        {tokensWithImages.map((token, index) => (
          <div
            key={`${token.id}-${index}`}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedToken?.id === token.id
                ? "border-[#A9A0FF] bg-[#A9A0FF]/10"
                : "border-gray-600 hover:border-gray-500 bg-[#2A2A2A]"
            }`}
            onClick={() => setSelectedToken(token)}
          >
            <div className="flex items-center gap-3">
              {/* Token Image */}
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden relative">
                {token.image ? (
                  <Image
                    src={token.image}
                    alt={token.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (
                        e.target as HTMLImageElement
                      ).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`text-xs text-gray-400 font-mono absolute inset-0 flex items-center justify-center ${
                    token.image ? "hidden" : ""
                  }`}
                >
                  {token.symbol.toUpperCase()}
                </div>
              </div>

              {/* Token Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium truncate">
                    {token.name}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({token.symbol.toUpperCase()})
                  </span>
                </div>

                <div className="text-gray-400 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs">
                      {truncateAddress(token.address)}
                    </span>
                    <span className="px-2 py-0.5 bg-[#A9A0FF]/20 text-[#A9A0FF] text-xs rounded">
                      {formatPlatform(token.platform)}
                    </span>
                  </div>

                  {token.decimals && (
                    <div className="text-xs text-gray-500">
                      Decimals: {token.decimals}
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedToken?.id === token.id
                    ? "border-[#A9A0FF] bg-[#A9A0FF]"
                    : "border-gray-500"
                }`}
              >
                {selectedToken?.id === token.id && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedToken}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            selectedToken
              ? "bg-[#A9A0FF] hover:bg-[#9990FF] text-white"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
};

export default TokenSelector;
