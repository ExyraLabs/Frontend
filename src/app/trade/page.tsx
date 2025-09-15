"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { chainImageMapping } from "@/utils/constants";
import { useCopilotMessagesContext } from "@copilotkit/react-core";
import StratCard from "@/components/StratsCard";
import type { Strategy } from "@/types/strategy";
import { getAllStrategies } from "@/actions/strategies";

const TABS = [
  "All",
  "DEX",
  "CEX",
  "Swing Trade",
  "Scalping",
  "Arbitrage",
  "HODL",
  "DeFi",
];

const CHAINS = [
  "Ethereum",
  "BNB Smart Chain",
  "Arbitrum",
  "Optimism",
  "Solana",
  "Monad",
  "Berachain",
];

// Card data

const Explore = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedChain, setSelectedChain] = useState("All Chains");
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setMessages } = useCopilotMessagesContext();

  // Fetch strategies from database
  const fetchStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllStrategies();

      if (result.success && result.strategies) {
        setStrategies(result.strategies);
        setLoading(false);
      } else {
        setError(result.message || "Failed to fetch strategies");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching strategies:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Filter strategies based on active tab and selected chain
  const filteredStrategies = strategies.filter((strategy) => {
    // Filter by category/tab
    const matchesTab = activeTab === "All" || strategy.category === activeTab;

    // Filter by chain
    const matchesChain =
      selectedChain === "All Chains" ||
      (strategy.chains && strategy.chains.includes(selectedChain));

    return matchesTab && matchesChain;
  });

  useEffect(() => {
    setMessages([]);
    fetchStrategies();
    //eslint-disable-next-line
  }, []);

  return (
    <div className="flex flex-col px-4 scrollbar-hide  overflow-y-scroll w-full">
      {/* Page Title */}
      <div className="w-full flex flex-col items-start px-[58px] justify-center  h-[293px] mx-auto  mb-6 rounded-[14px] relative">
        <Image
          src={"/images/strategy_bg.svg"}
          fill
          alt="bg"
          quality={100}
          className="rounded-[14px] absolute object-cover"
        />
        <h3 className="text-white z-40 text-[22px] font-semibold lg:text-[34px]">
          Discover Intelligent DeFi & CeFi Strategies
        </h3>
        <p className="text-white z-40 font-medium mt-4">
          Leverage AI-Powered Insights For Optimised Returns
        </p>
      </div>

      {/* Tabs and Filters Row */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 lg:gap-2 border border-[#3A3B3B] rounded-[24px] p-1 w-full md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-0 py-2 cursor-pointer rounded-[24px] text-xs lg:text-sm min-w-[75px] lg:min-w-[93px] transition-colors
                ${
                  activeTab === tab
                    ? "bg-[#3A3B3B] font-semibold text-white"
                    : "text-[#99A0AE] hover:bg-[#3A3B3B]"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex  gap-2 w-full md:flex-row md:items-center md:gap-4 md:w-auto">
          {/* Chain Dropdown */}
          <div className="relative flex flex-col items-center w-full md:w-[180px]">
            <button
              onClick={() => setShowChainDropdown((prev) => !prev)}
              className="flex items-center justify-between bg-[#262727] border border-[#3A3B3B] h-[44px] w-full text-[#F5F7F7] px-4 rounded-[40px] text-sm focus:outline-none hover:bg-[#3A3B3B] duration-300 cursor-pointer relative"
            >
              <span className="flex items-center gap-2">{selectedChain}</span>
              <Image
                src={"/icons/arrow-left.svg"}
                alt="arrow"
                className={`${
                  showChainDropdown ? "rotate-180" : ""
                } duration-300 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]`}
                width={11}
                height={11}
              />
            </button>
            {showChainDropdown && (
              <div className="absolute top-full mt-2 w-[200px] md:w-[232px] bg-[#303131] rounded-[10px] shadow-lg z-20 max-h-[320px] overflow-y-auto">
                {CHAINS.map((chain) => (
                  <div
                    key={chain}
                    className="group flex items-center gap-2 px-4 py-2 text-white text-sm cursor-pointer rounded-[14px] w-full text-left transition-colors"
                    onClick={() => {
                      setSelectedChain(chain);
                      setShowChainDropdown(false);
                    }}
                  >
                    {chainImageMapping[chain] && (
                      <Image
                        src={chainImageMapping[chain]}
                        alt={chain}
                        width={18}
                        height={18}
                      />
                    )}
                    <span className="flex-1">{chain}</span>
                    <span className="relative flex items-center">
                      <span className="w-5 h-5 rounded-[4px] border-[0.5px] border-[#343535] flex items-center justify-center bg-[#262727] group-hover:bg-[#353637] transition-colors">
                        {selectedChain === chain && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <rect
                              width="12"
                              height="12"
                              rx="3"
                              fill="#262727"
                            />
                            <path
                              d="M3 6.5L5.5 9L9 4.5"
                              stroke="#fff"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Clear Filters */}
          <button
            className={`text-xs transition-colors w-full md:w-auto text-center ${
              selectedChain === "All Chains" && activeTab === "All"
                ? "text-[#3A3B3B] cursor-default"
                : "text-[#B5B5B5] hover:text-white cursor-pointer"
            }`}
            onClick={() => {
              if (selectedChain !== "All Chains")
                setSelectedChain("All Chains");
              if (activeTab !== "All") setActiveTab("All");
            }}
            disabled={selectedChain === "All Chains" && activeTab === "All"}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1  md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          // Loading state
          <div className="col-span-full text-center py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#6B5CFF] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[#99A0AE] text-lg">Loading strategies...</p>
              <p className="text-[#99A0AE] text-sm mt-2">
                Fetching the latest trading strategies
              </p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="col-span-full text-center py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-[#FC5050] rounded-full flex items-center justify-center mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-[#FC5050] text-lg">
                Failed to load strategies
              </p>
              <p className="text-[#99A0AE] text-sm mt-2">{error}</p>
              <button
                onClick={fetchStrategies}
                className="mt-4 px-4 py-2 bg-[#6B5CFF] text-white rounded-lg hover:bg-[#584BFF] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredStrategies.length > 0 ? (
          filteredStrategies.map((strategy, idx) => (
            <StratCard key={strategy.title || idx} {...strategy} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-[#99A0AE] text-lg">
              No strategies found matching your filters.
            </p>
            <p className="text-[#99A0AE] text-sm mt-2">
              Try adjusting your category or chain selection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;

// Strategy type now imported from '@/types/strategy'
