"use client";
import React, { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { WalletAsset } from "../hooks/useWalletAssets";
import { Icon } from "@iconify/react";
import { useAppKit } from "@reown/appkit/react";

interface WalletManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  totalBalance: number;
  assets: WalletAsset[];
  streakDays: number;
  loading?: boolean;
  error?: string | null;
}

const WalletManagementModal: React.FC<WalletManagementModalProps> = ({
  isOpen,
  onClose,
  address,
  totalBalance = 53.6,
  assets = [],
  streakDays = 0,
  loading = false,
  error = null,
}) => {
  const [searchToken, setSearchToken] = useState("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const { open } = useAppKit();

  const handleImageError = (symbol: string) => {
    setImageErrors((prev) => new Set(prev).add(symbol));
  };

  const filteredAssets = assets.filter((asset) =>
    asset.symbol.toLowerCase().includes(searchToken.toLowerCase())
  );

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(balance);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(price);
  };

  const formatAmount = (amount: number) => {
    if (amount < 0.001) {
      return amount.toExponential(3);
    }
    return amount.toFixed(6);
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="bg-[#303131] absolute top-full mt-2 right-0 rounded-2xl py-6 px-4 w-[350px]">
      {/* Header */}
      <div className="flex h-[56px] px-4 py-3 bg-[#1E1F1F] border-[#d9d9d9] border-[0.5px] rounded-[16px] items-center justify-between mb-6">
        <div className="flex items-center gap-1">
          <Image
            src="/icons/ash_wallet.svg"
            alt="Wallet"
            width={20}
            height={20}
            className="text-white"
          />
          <p className="text-[#9A9C9C] text-base ">
            {address.slice(0, 6)}...{address.slice(-6)}
          </p>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(address);
                toast.success("Address copied to clipboard");
              } catch (err) {
                console.error("Copy failed", err);
                toast.error("Failed to copy address");
              }
            }}
            aria-label="Copy address"
            className="cursor-pointer"
            title="Copy address"
          >
            <Image
              src="/icons/ash_copy.svg"
              alt="Copy"
              width={20}
              height={20}
              className="text-white"
            />
          </button>
        </div>
        <button
          onClick={() => open()}
          className="flex text-white duration-300 hover:text-[#9A9C9C] cursor-pointer  items-center gap-2"
        >
          <Icon
            className=""
            width={24}
            height={24}
            icon="material-symbols-light:power-settings-circle"
          />
        </button>
      </div>

      {/* L()=>oading() State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="text-white ml-2">Loading wallet assets...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">
            Error loading wallet data: {error}
          </p>
        </div>
      )}

      {/* Content - only show when not loading */}
      {!loading && (
        <>
          {/* Balance */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white text-3xl font-bold">
                {formatBalance(totalBalance)}
              </h2>
              <button className="text-gray-400 hover:text-white transition-colors">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              Last updated:{" "}
              {new Date().toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search token"
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Assets Header */}
          <div className="grid grid-cols-3 gap-4 mb-3 text-gray-400 text-sm">
            <div className="whitespace-nowrap">Asset / Amount</div>
            <div className="text-right">Price</div>
            <div className="text-right">USD Value</div>
          </div>

          {/* Assets List */}
          <div className="space-y-4 max-h-[150px] scrollbar-hide overflow-y-scroll  mb-6">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {assets.length === 0
                  ? "No assets found in wallet"
                  : "No assets match your search"}
              </div>
            ) : (
              filteredAssets.map((asset, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 items-center"
                >
                  <div className="flex w-max min-w-max  items-center gap-3">
                    <div className="relative  w-[37px] h-[37px] bg-gray-500 rounded-full flex items-center justify-center">
                      {asset.icon && !imageErrors.has(asset.symbol) ? (
                        <Image
                          src={asset.icon}
                          alt={asset.symbol}
                          fill
                          className="rounded-full object-cover"
                          onError={() => handleImageError(asset.symbol)}
                        />
                      ) : (
                        <span className="text-xs text-white font-bold">
                          {asset.symbol.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="">
                      <p className="text-white  text-sm font-medium">
                        {formatAmount(asset.amount)}
                      </p>
                      <p className="text-gray-400 text-xs">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">
                      {formatPrice(asset.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">
                      {formatPrice(asset.usdValue)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Check-in Section */}
          <div className="bg-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Image
                  src={"/icons/fire.svg"}
                  width={37}
                  height={37}
                  alt="fire"
                />
                <p className="text-white ml-2 mr-1 text-[32px] font-semibold">
                  {streakDays}
                </p>
                <p className="text-white">days</p>
              </div>
              <button className="bg-[#5E4DFD] hover:bg-blue-700 text-white px-4 py-2 rounded-[24px] text-sm transition-colors">
                Check in
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-3">
              Come back everyday to keep your streak!
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletManagementModal;
