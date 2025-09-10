"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Modal from "./Modal";
import type { Strategy, TradeHistoryEntry } from "@/types/strategy";

interface StrategyOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: Strategy;
  initialTab?: TabKey; // which tab to show when opened
}

export type TabKey = "Overview" | "Activities" | "Transactions";

const TABS: TabKey[] = ["Overview", "Activities", "Transactions"];

// Utility formatting helpers (simple for now, can be extracted later)
const formatDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const StrategyOverviewModal: React.FC<StrategyOverviewModalProps> = ({
  isOpen,
  onClose,
  strategy,
  initialTab = "Overview",
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Reset active tab whenever modal opens with a different requested tab
  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[95%] mx-auto lg:w-[1160px] max-w-[1160px] pt-[40px] h-[80vh] md:h-[560px] md:max-h-[560px] overflow-hidden pb-5 md:pb-0 flex flex-col bg-[#303131] rounded-[24px] px-[24px] lg:px-[53px]">
        {/* Header Tabs */}
        <div className="flex items-center mb-6">
          <div className="flex md:w-[80%] justify-between border border-[#3A3B3B] rounded-[24px] gap-2 h-[52px] p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-[28px] text-sm transition-colors cursor-pointer flex-1 text-center font-medium ${
                  activeTab === tab
                    ? "bg-[#3A3B3B] text-white"
                    : "text-[#99A0AE] hover:bg-[#3A3B3B]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="ml-auto cursor-pointer text-white p-2 rounded-full hover:bg-[#3A3B3B]"
          >
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>

        <div className="flex-1  overflow-y-auto scrollbar-hide">
          {activeTab === "Overview" && (
            <div className="animate-fade-in">
              <h2 className="text-[26px]  font-bold text-primary-light mb-2">
                Overview
              </h2>
              <p className="text-[#ffffff] text-sm max-w-[620px] mb-8">
                Smart insights to help you trade crypto with confidence.
              </p>

              <div className="bg-[#1E1F1F] rounded-[12px] p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-6 items-stretch">
                  {/* Features */}
                  <div className="flex flex-col gap-3 h-full">
                    <div className="text-white  flex items-center gap-2">
                      <Icon
                        icon="pajamas:issue-type-feature"
                        width={16}
                        height={16}
                        className="text-primary-light2"
                      />
                      Features
                    </div>
                    <ul className="bg-[#303131] list-disc rounded-[12px] p-4 text-[#EEE6E6] text-xs h-full">
                      {strategy.features?.map((f, i) => (
                        <li className="mx-2" key={i}>
                          {f}
                        </li>
                      )) || <p>No features listed.</p>}
                    </ul>
                  </div>

                  {/* Entry Criteria */}
                  <div className="flex flex-col gap-3 h-full">
                    <div className="text-white  flex items-center gap-2">
                      <Icon
                        icon="clarity:align-center-line"
                        className="text-[#10B981] w-4 h-4"
                      />
                      Entry Criteria
                    </div>
                    <ul className="bg-[#303131] list-disc rounded-[12px] p-4 text-[#EEE6E6] text-xs h-full">
                      {strategy.entryCriterias?.map((criteria, i) => (
                        <li className="mx-2" key={i}>
                          {criteria}
                        </li>
                      )) || <p>No entry criteria listed.</p>}
                    </ul>
                  </div>

                  {/* Exit Criteria */}
                  <div className="flex flex-col gap-3 h-full">
                    <div className="text-white  flex items-center gap-2">
                      <Icon
                        icon="clarity:align-center-line"
                        className="text-[#EF4444] w-4 h-4 rotate-180"
                      />{" "}
                      Exit Criteria
                    </div>
                    <ul className="bg-[#303131] list-disc rounded-[12px] p-4 text-[#EEE6E6] text-xs h-full">
                      {strategy.exitCriteria?.map((criteria, i) => (
                        <li className="mx-2" key={i}>
                          {criteria}
                        </li>
                      )) || <p>No exit criteria listed.</p>}
                    </ul>
                  </div>

                  {/* Exchange */}
                  <div className="flex flex-col gap-3 h-full">
                    <div className="text-white  flex items-center gap-2">
                      <Icon
                        icon="lucide-lab:coins-exchange"
                        className="text-[#F59E0B] w-4 h-4"
                      />{" "}
                      Exchange
                    </div>
                    <ul className="bg-[#303131] list-disc rounded-[12px] p-4 text-[#EEE6E6] text-xs h-full">
                      {strategy.exchanges?.map((exchange, i) => (
                        <li className="mx-2" key={i}>
                          {exchange}
                        </li>
                      )) || <p>No exchanges listed.</p>}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-6 items-stretch">
                  {/* Notes */}
                  <div className="flex flex-col gap-3 h-full">
                    <div className="text-white flex items-center gap-2">
                      <Icon
                        icon="hugeicons:note"
                        className="text-[#06B6D4] w-4 h-4"
                      />{" "}
                      Notes
                    </div>
                    <div className="bg-[#303131] rounded-[12px] p-4 text-[#EEE6E6] text-xs h-full">
                      {strategy.notes ||
                        strategy.features?.join("\n") ||
                        "No notes added."}
                    </div>
                  </div>
                  {/* Trades count */}
                  <div className="flex flex-col gap-3 h-full">
                    <div className="text-white flex items-center gap-2">
                      <Icon
                        icon="streamline-ultimate:trading-pattern-up"
                        className="text-primary-light w-4 h-4"
                      />{" "}
                      Trades
                    </div>
                    <div className="bg-[#303131] rounded-[12px] p-4 text-[#EEE6E6] text-xs h-full">
                      {strategy.history?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Activities" && (
            <div className="animate-fade-in">
              <h2 className="text-[26px] font-bold text-primary-light mb-2">
                Activities
              </h2>
              <p className="text-white text-sm max-w-[620px] mb-8">
                Monitor how many traders subscribe to this strategy.
              </p>
              <div className="bg-[#1E1F1F] md:h-[320px]  rounded-[12px] p-6 flex flex-col gap-6">
                <div className="text-white font-medium mb-4 text-sm">
                  {strategy.followers?.length || 0} Subscribers
                </div>
                <div className="flex flex-col gap-3  overflow-y-auto pr-2 scrollbar-hide">
                  {Array.from({
                    length: Math.min(strategy.followers?.length || 0, 15),
                  }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 bg-[#222223] border border-[#303131] rounded-[12px] px-4 py-3"
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#303131] text-white text-sm font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                          <Icon
                            icon="tabler:wallet"
                            width={20}
                            height={20}
                            className="text-[#F59E0B]"
                          />{" "}
                          0x8A12X...1f7830
                        </div>
                        <div className="text-[#9B9D9D] text-[10px] mt-1">
                          Started:{" "}
                          {formatDate(
                            strategy.startDate || new Date().toISOString()
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!strategy.followers && (
                    <div className="text-[#9B9D9D] text-sm">
                      No activity yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Transactions" && (
            <div className="animate-fade-in">
              <h2 className="text-[26px] font-bold text-primary-light mb-2">
                Transactions
              </h2>
              <p className="text-white text-sm max-w-[620px] mb-8">
                All your transactions in one clear, reliable view
              </p>
              <div className="bg-[#1E1F1F]  border border-[#303131] rounded-[12px] p-6 overflow-x-auto">
                <div className="max-h-[420px] overflow-y-auto  scrollbar-hide">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="text-[#5B5FF0] text-sm">
                        <th className="py-3 font-medium">Asset</th>
                        <th className="py-3 hidden md:block font-medium">
                          Entry Date
                        </th>
                        <th className="py-3 font-medium">Entry Price</th>
                        <th className="py-3 hidden md:block font-medium">
                          Exit Date
                        </th>
                        <th className="py-3 font-medium">Exit Price</th>
                        <th className="py-3 font-medium">PNL</th>
                        <th className="py-3 font-medium">Wallet</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {(
                        strategy.history as TradeHistoryEntry[] | undefined
                      )?.map((trade, idx) => {
                        const pnlValue = trade.exitPrice
                          ? (trade.exitPrice - trade.entryPrice).toFixed(2)
                          : undefined;
                        const isLoss = pnlValue ? Number(pnlValue) < 0 : false;
                        return (
                          <tr
                            key={idx}
                            className="border-t border-[#303131] text-[#C7C7C7]"
                          >
                            <td className="py-3">{trade.coin}</td>
                            <td className="py-3 hidden md:block">
                              {trade.entryDate || formatDate()}
                            </td>
                            <td className="py-3  items-center gap-1">
                              {trade.entryPrice.toLocaleString()}
                            </td>
                            <td className="py-3 hidden md:block">
                              {trade.exitDate ||
                                (trade.exitPrice
                                  ? formatDate()
                                  : "Ongoing Trade")}
                            </td>
                            <td className="py-3  items-center gap-1">
                              {(
                                trade.exitPrice || trade.entryPrice * 2
                              ).toLocaleString()}{" "}
                            </td>
                            <td
                              className={`py-3 font-medium ${
                                isLoss ? "text-red-500" : "text-green-400"
                              }`}
                            >
                              {pnlValue ? `${Math.abs(Number(pnlValue))}` : "-"}
                            </td>
                            <td className="py-3">0x..30</td>
                          </tr>
                        );
                      })}
                      {!strategy.history?.length && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-[#9B9D9D]"
                          >
                            No transactions yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default StrategyOverviewModal;
