"use client";
import React, { useState } from "react";
import Image from "next/image";
import { STRATS_CARDS } from "../page";

// Dummy user position data
const dummyPosition = {
  coin: "ETH",
  amount: 2.5,
  entryPrice: 3200,
  currentPrice: 3400,
  pnl: 500,
  status: "open",
};

const StrategyDetailsPage = ({ params }: { params: { id: string } }) => {
  const strategy = STRATS_CARDS[parseInt(params.id, 10)] || STRATS_CARDS[0];
  const [amount, setAmount] = useState(0);
  const [position] = useState(dummyPosition);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  };

  const handleSetStrategy = () => {
    // Here you would trigger backend logic to allocate funds to the strategy
    alert(`Allocated $${amount} to strategy: ${strategy.title}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#232323] rounded-2xl shadow-lg mt-8">
      {/* Strategy Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center">
          {strategy.icon.map((iconSrc: string, idx: number) => (
            <div
              key={idx}
              style={{ zIndex: idx }}
              className={idx === 0 ? "relative" : "relative -ml-5"}
            >
              <Image
                src={iconSrc}
                alt={`${strategy.title} icon ${idx + 1}`}
                width={48}
                height={48}
                className="rounded-full"
              />
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{strategy.title}</h2>
          <div className="text-[#B5B5B5] text-sm">{strategy.subtitle}</div>
          <div className="text-xs text-[#A79EF5] font-semibold mt-1">
            {strategy.category}
          </div>
        </div>
      </div>

      {/* Strategy Stats */}
      <div className="flex flex-wrap gap-6 mb-6">
        {strategy.riskLevel && (
          <div className="text-xs text-[#F5B041]">
            Risk: <span className="font-semibold">{strategy.riskLevel}</span>
          </div>
        )}
        {typeof strategy.pnl === "number" && (
          <div className="text-xs text-green-400">
            PNL: <span className="font-semibold">{strategy.pnl}%</span>
          </div>
        )}
        {typeof strategy.apy === "number" && (
          <div className="text-xs text-green-400">
            APY: <span className="font-semibold">{strategy.apy}%</span>
          </div>
        )}
        {strategy.tags && strategy.tags.length > 0 && (
          <div className="text-xs text-[#A79EF5]">
            Tags: <span>{strategy.tags.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Set Amount Section */}
      <div className="bg-gradient-to-r from-[#232323] via-[#303131] to-[#232323] rounded-lg p-4 mb-6 flex flex-col gap-2">
        <label className="text-[#F5B041] text-sm font-semibold mb-1">
          Set Amount to Use for Strategy
        </label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={handleAmountChange}
          className="bg-[#262727] text-white rounded-lg px-4 py-2 border border-[#474848] focus:outline-none focus:border-[#A79EF5]"
          placeholder="Enter amount in USD"
        />
        <button
          onClick={handleSetStrategy}
          className="mt-2 bg-[#A79EF5] text-white rounded-lg px-4 py-2 font-semibold hover:bg-[#8F7AEF] transition-colors"
        >
          Allocate Funds
        </button>
      </div>

      {/* User Position Section */}
      <div className="bg-gradient-to-r from-[#232323] via-[#303131] to-[#232323] rounded-lg p-4 mb-6">
        <div className="text-[#5DADE2] text-sm font-semibold mb-2">
          Your Position
        </div>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="text-[#F7DC6F]">
            Coin: <span className="font-semibold">{position.coin}</span>
          </div>
          <div className="text-[#ABEBC6]">
            Amount: <span className="font-semibold">{position.amount}</span>
          </div>
          <div className="text-[#B5B5B5]">
            Entry Price:{" "}
            <span className="font-semibold">${position.entryPrice}</span>
          </div>
          <div className="text-[#A79EF5]">
            Current Price:{" "}
            <span className="font-semibold">${position.currentPrice}</span>
          </div>
          <div
            className={position.pnl >= 0 ? "text-green-400" : "text-red-400"}
          >
            PNL: <span className="font-semibold">${position.pnl}</span>
          </div>
          <div className="text-[#B5B5B5]">
            Status: <span className="font-semibold">{position.status}</span>
          </div>
        </div>
      </div>

      {/* Strategy Details Section */}
      <div className="bg-gradient-to-r from-[#232323] via-[#303131] to-[#232323] rounded-lg p-4">
        <div className="text-[#A79EF5] text-sm font-semibold mb-2">
          Strategy Details
        </div>
        <div className="mb-2 text-[#F5F7F7] text-xs">
          <strong>Features:</strong> {strategy.features?.join(", ")}
        </div>
        <div className="mb-2 text-[#F5F7F7] text-xs">
          <strong>Prompts:</strong> {strategy.prompts?.join(" | ")}
        </div>
        <div className="mb-2 text-[#F5F7F7] text-xs">
          <strong>Entry Criteria:</strong> {strategy.entryCriteria}
        </div>
        <div className="mb-2 text-[#F5F7F7] text-xs">
          <strong>Exit Criteria:</strong> {strategy.exitCriteria}
        </div>
        <div className="mb-2 text-[#F5F7F7] text-xs">
          <strong>Notes:</strong> {strategy.notes}
        </div>
        <div className="mb-2 text-[#F5F7F7] text-xs">
          <strong>Author:</strong> {strategy.author}
        </div>
        <div className="mb-2 text-[#F5F7F7] text-xs">
          <strong>Followers:</strong> {strategy.followers}
        </div>
      </div>
    </div>
  );
};

export default StrategyDetailsPage;
