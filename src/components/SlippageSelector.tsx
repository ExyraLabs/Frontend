"use client";
import React, { useState } from "react";
import Image from "next/image";

interface SlippageSelectorProps {
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amount: string;
  platform: string;
  onConfirm: (slippageTolerance: number) => void | Promise<void>;
  onCancel: () => void;
}

const SlippageSelector: React.FC<SlippageSelectorProps> = ({
  tokenInSymbol,
  tokenOutSymbol,
  amount,
  platform,
  onConfirm,
  onCancel,
}) => {
  const [slippage, setSlippage] = useState(50); // Default 0.5% (50 bips)
  const [customSlippage, setCustomSlippage] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined slippage options in bips (1 bip = 0.01%)
  const presetSlippages = [
    { label: "0.1%", value: 10 },
    { label: "0.5%", value: 50 },
    { label: "1.0%", value: 100 },
    { label: "2.0%", value: 200 },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSlippage(value);
    setUseCustom(false);
    setCustomSlippage("");
  };

  const handleCustomSlippageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCustomSlippage(value);
    if (value) {
      const numValue = parseFloat(value) * 100; // Convert percentage to bips
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 5000) {
        setSlippage(numValue);
        setUseCustom(true);
      }
    }
  };

  const handlePresetClick = (value: number) => {
    setSlippage(value);
    setUseCustom(false);
    setCustomSlippage("");
  };

  const getSlippageColor = () => {
    if (slippage <= 50) return "text-green-400";
    if (slippage <= 100) return "text-yellow-400";
    if (slippage <= 300) return "text-orange-400";
    return "text-red-400";
  };

  const getSlippageWarning = () => {
    if (slippage <= 50) return null;
    if (slippage <= 100) return "⚠️ Medium slippage - May reduce output";
    if (slippage <= 300) return "⚠️ High slippage - Significant price impact";
    return "🚨 Very high slippage - Risk of sandwich attacks";
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-[20px] p-6 max-w-md w-[90vw] mx-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A9A0FF] rounded-full flex items-center justify-center">
            <Image src="/icons/swap.svg" alt="Swap" width={16} height={16} />
          </div>
          <h3 className="text-white text-lg font-semibold">
            Set Slippage Tolerance
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 cursor-pointer active:scale-95 hover:text-white transition-colors"
        >
          <Image src="/icons/close.svg" alt="Close" width={20} height={20} />
        </button>
      </div>

      {/* Swap Details */}
      <div className="bg-[#2E2E2E] rounded-[12px] p-4 mb-6">
        <div className="text-gray-400 text-sm mb-2">Swap Details</div>
        <div className="text-white font-medium">
          {amount} {tokenInSymbol.toUpperCase()} →{" "}
          {tokenOutSymbol.toUpperCase()}
        </div>
        <div className="text-gray-400 text-sm capitalize">
          Network: {platform}
        </div>
      </div>

      {/* Preset Slippage Options */}
      <div className="mb-6">
        <div className="text-gray-300 text-sm mb-3">Quick Select</div>
        <div className="grid grid-cols-4 gap-2">
          {presetSlippages.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              disabled={isSubmitting}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition duration-150 hover:scale-[1.04] active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-[#A9A0FF]/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                slippage === preset.value && !useCustom
                  ? "bg-[#A9A0FF] text-white shadow-md shadow-[#A9A0FF]/20"
                  : "bg-[#2E2E2E] text-gray-300 hover:bg-[#3E3E3E]"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-300 text-sm">Slippage Tolerance</div>
          <div className={`text-sm font-bold ${getSlippageColor()}`}>
            {(slippage / 100).toFixed(2)}%
          </div>
        </div>
        <div className="relative">
          <input
            type="range"
            min="1"
            max="500"
            value={slippage}
            onChange={handleSliderChange}
            className="w-full h-2 bg-[#2E2E2E] rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #A9A0FF 0%, #A9A0FF ${
                (slippage / 500) * 100
              }%, #2E2E2E ${(slippage / 500) * 100}%, #2E2E2E 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.01%</span>
            <span>5.00%</span>
          </div>
        </div>
      </div>

      {/* Custom Slippage Input */}
      <div className="mb-6">
        <div className="text-gray-300 text-sm mb-2">Custom Slippage (%)</div>
        <input
          type="number"
          placeholder="0.50"
          value={customSlippage}
          onChange={handleCustomSlippageChange}
          step="0.01"
          min="0.01"
          max="50"
          className="w-full bg-[#2E2E2E] border border-[#3E3E3E] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#A9A0FF]"
        />
      </div>

      {/* Warning */}
      {getSlippageWarning() && (
        <div className="bg-[#2E2E2E] border border-yellow-500/20 rounded-lg p-3 mb-6">
          <div className="text-yellow-400 text-sm">{getSlippageWarning()}</div>
        </div>
      )}

      {/* Info */}
      <div className="bg-[#2E2E2E] rounded-lg p-3 mb-6">
        <div className="text-gray-400 text-xs">
          Slippage tolerance is the maximum amount you&apos;re willing to lose
          due to price changes during the swap. Lower values reduce slippage but
          may cause transaction failures in volatile markets.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-[#2E2E2E] text-gray-300 py-3 rounded-[12px] font-medium hover:bg-[#3E3E3E] transition duration-150 hover:scale-[1.02] active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-[#3E3E3E]/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Please wait" : "Cancel"}
        </button>
        <button
          onClick={async () => {
            if (isSubmitting) return;
            try {
              setIsSubmitting(true);
              await Promise.resolve(onConfirm(slippage));
            } finally {
              // Don't reset isSubmitting here; component will unmount when parent status changes.
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          className="relative flex-1 bg-[#A9A0FF] text-white py-3 rounded-[12px] font-medium hover:bg-[#9A8FFF] transition duration-150 hover:scale-[1.03] active:scale-[0.94] focus:outline-none focus:ring-2 focus:ring-[#A9A0FF]/50 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#A9A0FF]/20"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              Executing...
            </span>
          ) : (
            "Continue Swap"
          )}
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #a9a0ff;
          cursor: pointer;
          border: 2px solid #1a1a1a;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #a9a0ff;
          cursor: pointer;
          border: 2px solid #1a1a1a;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default SlippageSelector;
