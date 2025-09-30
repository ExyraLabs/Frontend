"use client";
import React, { useMemo, useState, useEffect } from "react";
import Modal from "./Modal";
import { useExchangeKeys } from "@/hooks/useExchangeKeys";
import { useAppKitAccount } from "@reown/appkit/react";
import Image from "next/image";

interface APIKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputBase =
  "w-full rounded-xl border border-[#2a2a2a] bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200";

const cardBase =
  "rounded-xl border border-[#2a2a2a] bg-gradient-to-br from-[#0f0f0f]/50 to-[#1a1a1a]/30 backdrop-blur-sm";

// Utility function to mask API keys
const maskApiKey = (key: string): string => {
  if (!key || key.length <= 8) return key;
  const firstFour = key.slice(0, 4);
  const lastFour = key.slice(-4);
  const middleAsterisks = "*".repeat(Math.max(8, key.length - 8));
  return `${firstFour}${middleAsterisks}${lastFour}`;
};

export default function APIKeysModal({ isOpen, onClose }: APIKeysModalProps) {
  const { address } = useAppKitAccount();
  const { keys, update, clear, isLoading } = useExchangeKeys(address);
  const [binanceApiKey, setBinanceApiKey] = useState(keys.binance.apiKey);
  const [binanceSecretKey, setBinanceSecretKey] = useState(
    keys.binance.secretKey
  );
  const [bybitApiKey, setBybitApiKey] = useState(keys.bybit.apiKey);
  const [bybitSecretKey, setBybitSecretKey] = useState(keys.bybit.secretKey);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    binance: boolean;
    bybit: boolean;
  }>({ binance: true, bybit: true });

  // Sync form state with loaded keys
  useEffect(() => {
    setBinanceApiKey(keys.binance.apiKey);
    setBinanceSecretKey(keys.binance.secretKey);
    setBybitApiKey(keys.bybit.apiKey);
    setBybitSecretKey(keys.bybit.secretKey);
  }, [keys]);

  // Keep local state in sync when opening
  React.useEffect(() => {
    if (!isOpen) return;
    setBinanceApiKey(keys.binance.apiKey);
    setBinanceSecretKey(keys.binance.secretKey);
    setBybitApiKey(keys.bybit.apiKey);
    setBybitSecretKey(keys.bybit.secretKey);
  }, [isOpen, keys]);

  const canSave = useMemo(() => {
    return (
      binanceApiKey !== keys.binance.apiKey ||
      binanceSecretKey !== keys.binance.secretKey ||
      bybitApiKey !== keys.bybit.apiKey ||
      bybitSecretKey !== keys.bybit.secretKey
    );
  }, [binanceApiKey, binanceSecretKey, bybitApiKey, bybitSecretKey, keys]);

  const toggleSection = (section: "binance" | "bybit") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const onSave = async () => {
    if (!address) return;

    setIsSaving(true);
    try {
      await update({
        binance: { apiKey: binanceApiKey, secretKey: binanceSecretKey },
        bybit: { apiKey: bybitApiKey, secretKey: bybitSecretKey },
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const onClear = async () => {
    await clear();
    setBinanceApiKey("");
    setBinanceSecretKey("");
    setBybitApiKey("");
    setBybitSecretKey("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[95vw] z-50 max-h-[95vh] max-w-[900px] rounded-2xl border border-[#2b2b2b] bg-gradient-to-br from-[#0b0b0b] via-[#111111] to-[#0f0f0f] p-8 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="mb-8 flex items-center  justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              API Keys Management
            </h3>
            <p className="text-sm text-gray-400">
              Securely connect your exchange accounts for automated trading
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1  lg:grid-cols-3 gap-8">
          {/* Left Column - API Keys */}
          <div className="lg:col-span-2 space-y-6">
            {address && isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="text-sm text-gray-400">
                    Loading your API keys...
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Binance Section */}
                <div
                  className={`${cardBase} overflow-hidden transition-all duration-200`}
                >
                  <div
                    className="flex items-center gap-3 p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleSection("binance")}
                  >
                    <div className="w-8 h-8 rounded-full relative flex items-center justify-center">
                      <Image
                        src="https://assets.coingecko.com/markets/images/52/small/binance.jpg"
                        alt="Binance Logo"
                        fill
                        className="rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">
                        Binance
                      </h4>
                      <p className="text-xs text-gray-400">
                        World&apos;s largest crypto exchange
                      </p>
                    </div>
                    <a
                      href="https://www.binance.com/en/support/faq/detail/360002502072"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary/80 underline transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Setup Guide →
                    </a>
                    <div
                      className={`ml-2 transform transition-transform duration-200 ${
                        expandedSections.binance ? "rotate-180" : ""
                      }`}
                    >
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {expandedSections.binance && (
                    <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          API Key
                        </label>
                        <input
                          className={inputBase}
                          placeholder="Enter your Binance API key"
                          value={
                            editingField === "binanceApiKey"
                              ? binanceApiKey
                              : maskApiKey(binanceApiKey)
                          }
                          onChange={(e) => setBinanceApiKey(e.target.value)}
                          onFocus={() => setEditingField("binanceApiKey")}
                          onBlur={() => setEditingField(null)}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Secret Key
                        </label>
                        <input
                          className={inputBase}
                          placeholder="Enter your Binance secret key"
                          value={
                            editingField === "binanceSecretKey"
                              ? binanceSecretKey
                              : maskApiKey(binanceSecretKey)
                          }
                          onChange={(e) => setBinanceSecretKey(e.target.value)}
                          onFocus={() => setEditingField("binanceSecretKey")}
                          onBlur={() => setEditingField(null)}
                          autoComplete="off"
                          type={
                            editingField === "binanceSecretKey"
                              ? "text"
                              : "password"
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bybit Section */}
                <div
                  className={`${cardBase} overflow-hidden transition-all duration-200`}
                >
                  <div
                    className="flex items-center gap-3 p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleSection("bybit")}
                  >
                    <div className="w-8 h-8 rounded-full relative flex items-center justify-center">
                      <Image
                        src="https://assets.coingecko.com/markets/images/698/small/bybit_spot.png"
                        alt="Bybit Logo"
                        fill
                        className="rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">
                        Bybit
                      </h4>
                      <p className="text-xs text-gray-400">
                        Professional crypto derivatives exchange
                      </p>
                    </div>
                    <a
                      href="https://www.bybitglobal.com/en/help-center/article/How-to-create-your-API-key"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary/80 underline transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Setup Guide →
                    </a>
                    <div
                      className={`ml-2 transform transition-transform duration-200 ${
                        expandedSections.bybit ? "rotate-180" : ""
                      }`}
                    >
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {expandedSections.bybit && (
                    <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          API Key
                        </label>
                        <input
                          className={inputBase}
                          placeholder="Enter your Bybit API key"
                          value={
                            editingField === "bybitApiKey"
                              ? bybitApiKey
                              : maskApiKey(bybitApiKey)
                          }
                          onChange={(e) => setBybitApiKey(e.target.value)}
                          onFocus={() => setEditingField("bybitApiKey")}
                          onBlur={() => setEditingField(null)}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Secret Key
                        </label>
                        <input
                          className={inputBase}
                          placeholder="Enter your Bybit secret key"
                          value={
                            editingField === "bybitSecretKey"
                              ? bybitSecretKey
                              : maskApiKey(bybitSecretKey)
                          }
                          onChange={(e) => setBybitSecretKey(e.target.value)}
                          onFocus={() => setEditingField("bybitSecretKey")}
                          onBlur={() => setEditingField(null)}
                          autoComplete="off"
                          type={
                            editingField === "bybitSecretKey"
                              ? "text"
                              : "password"
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={onClear}
                    className="rounded-xl border border-red-800/60 bg-gradient-to-br from-red-900/20 to-red-800/10 px-6 py-3 text-sm font-medium text-red-300 hover:from-red-900/30 hover:to-red-800/20 transition-all duration-200"
                  >
                    Clear All Keys
                  </button>

                  <div className="space-x-3">
                    <button
                      onClick={onClose}
                      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] px-6 py-3 text-sm font-medium text-gray-200 hover:from-white/10 hover:to-white/5 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSave}
                      disabled={!canSave || isSaving || !address}
                      className="rounded-xl bg-gradient-to-br from-primary to-primary/80 px-6 py-3 text-sm font-semibold text-black hover:from-primary/90 hover:to-primary/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-primary disabled:hover:to-primary/80 transition-all duration-200"
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </span>
                      ) : (
                        "Save Keys"
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!address && (
              <div className={`${cardBase} p-8 text-center`}>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Wallet Connection Required
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Connect your wallet to securely save and manage your API keys
                  across devices.
                </p>
                <button className="rounded-xl bg-gradient-to-br from-primary to-primary/80 px-6 py-3 text-sm font-semibold text-black hover:from-primary/90 hover:to-primary/70 transition-all duration-200">
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Security Info */}
          <div className="space-y-6">
            {/* Security Tips */}
            <div className={`${cardBase} p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔐</span>
                <h4 className="text-lg font-semibold text-white">
                  Security Tips
                </h4>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-300 font-medium mb-1">
                      IP Whitelist Required
                    </p>
                    <p className="text-gray-400 text-xs">
                      Add{" "}
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-primary">
                        172.86.68.67
                      </code>{" "}
                      to your API whitelist
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-300 font-medium mb-1">
                      Disable Withdrawals
                    </p>
                    <p className="text-gray-400 text-xs">
                      Never enable withdrawal permissions for enhanced security
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-300 font-medium mb-1">
                      Read-Only Access
                    </p>
                    <p className="text-gray-400 text-xs">
                      Only enable spot trading and futures trading permissions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Info */}
            {/* <div className={`${cardBase} p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">⚙️</span>
                <h4 className="text-lg font-semibold text-white">
                  Required Permissions
                </h4>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Read Account Info</span>
                  <span className="text-green-400 text-xs">✓ Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Spot Trading</span>
                  <span className="text-green-400 text-xs">✓ Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Futures Trading</span>
                  <span className="text-blue-400 text-xs">◯ Optional</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Withdrawals</span>
                  <span className="text-red-400 text-xs">✗ Disable</span>
                </div>
              </div>
            </div> */}

            {/* Storage Info */}
            <div className={`${cardBase} p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🛡️</span>
                <h4 className="text-lg font-semibold text-white">
                  Data Protection
                </h4>
              </div>
              <div className="space-y-3 text-xs text-gray-400">
                <p>
                  Your API keys are encrypted using industry-standard AES-256
                  encryption before storage.
                </p>
                <p>
                  Keys are securely stored in our database and synced across
                  your devices when you connect your wallet.
                </p>
                <p>We never store withdrawal-enabled keys or private keys.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
