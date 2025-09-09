"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { STRATS_CARDS } from "@/utils/constants";
import type { Strategy } from "@/types/strategy";
import StrategyOverviewModal, {
  type TabKey,
} from "@/components/StrategyOverviewModal";

// Helpers
const slugify = (s: string) => s.replace(/\s+/g, "-").toLowerCase();

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col bg-[#262727] border border-[#3A3B3B] rounded-[12px] px-4 py-3 min-w-[130px]">
    <span className="text-[#9B9D9D] text-xs">{label}</span>
    <span className="text-white text-lg font-semibold">{value}</span>
  </div>
);

const SidebarCard = ({ title, icon }: { title: string; icon?: string }) => (
  <div className="flex items-center px-3 py-2 justify-between bg-[#27292B] border border-[#d9d9d9]/40 rounded-[12px] w-full h-[36px]">
    <span className="text-white text-sm font-medium">{title}</span>
    {icon && (
      <Icon icon={icon} className="text-[#ffffff]" width={16} height={16} />
    )}
  </div>
);

const StrategyDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const strategy: Strategy = useMemo(() => {
    const currentId = (params?.id || "") as string;
    const bySlug = STRATS_CARDS.find((s) => slugify(s.title) === currentId);
    return (bySlug as Strategy) || (STRATS_CARDS[0] as Strategy);
  }, [params]);

  // Input state (ETH)
  const [amountEth, setAmountEth] = useState<string>("");
  const minUSDT = 50;
  const [modalTab, setModalTab] = useState<TabKey | null>(null);

  const canAllocate = Number(amountEth || 0) >= minUSDT;

  const handleAllocate = () => {
    alert(`Allocated ${amountEth} ETH to strategy: ${strategy.title}`);
  };

  return (
    <div className="w-full overflow-y-auto scrollbar-hide px-4 md:px-6 lg:px-8 pb-10">
      {/* Back link */}
      <div className="flex items-center gap-2 text-[#9B9D9D] text-sm ">
        <Link href="/strategy" className="hover:underline flex items-center">
          <Icon
            className="mr-1"
            icon={"lets-icons:refund-back-light"}
            width={16}
            height={16}
          />{" "}
          Back to Strategies
        </Link>
      </div>

      <div className="flex flex-col md:flex-row mt-10 items-center gap-6 lg:h-[200px] justify-between">
        {/* Left/Main Column */}
        {/* Header Card */}
        <div className="bg-[#222223] w-full  flex flex-col md:flex-row items-start justify-between py-4 px-8 border h-full flex-1 border-[#474848] rounded-[16px] ">
          <div className=" w-full md:w-[40%]">
            <div className="text-white flex items-start">
              <h6 className="font-semibold text-lg text-white">
                {strategy.title}
              </h6>
              <div className="text-xs w-[57px] h-[24px] bg-[#595656]/17 rounded-[35px] p-2.5 flex items-center justify-center text-[#A79EF5] font-semibold ml-4 my-1">
                {strategy.category}
              </div>
            </div>
            {strategy.subtitle && (
              <div className="text-[#9B9D9D] text-xs">{strategy.subtitle}</div>
            )}
            <div className="flex mt-3 items-center">
              {(Array.isArray(strategy.icon)
                ? strategy.icon
                : [strategy.icon]
              ).map((iconSrc: string, idx: number) => (
                <div
                  key={idx}
                  style={{ zIndex: idx }}
                  className={idx === 0 ? "relative" : "relative -ml-2.5"}
                >
                  <Image
                    src={iconSrc}
                    alt={`${strategy.title} icon ${idx + 1}`}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                </div>
              ))}
            </div>
            <div className="flex  mt-3 relative  justify-between items-center">
              <div className="w-[125px]  md:w-[152px]   p-1 h-[46px] rounded-xl bg-[#1e1f1f] border-[0.5px] border-[#d9d9d9]/40">
                <div className="bg-[#303131] flex items-center justify-center w-full h-full rounded-[10px]">
                  <p className="text-[#ADADAD] text-sm font-medium">
                    PNL:{" "}
                    <span className="text-[#06E574] ml-1 text-[16px] font-medium">
                      23.4%
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex h-[46px]   items-center  gap-4">
                <div className="flex     h-full justify-around flex-col">
                  <p className="text-xs text-[#9B9D9D] ">24h%</p>
                  <p className="text-xs  relative right-[16px] text-[#06E574] flex items-center">
                    <Icon
                      icon={"icon-park-solid:up-one"}
                      width={16}
                      height={16}
                    />
                    {strategy.pnl}%
                  </p>
                </div>
                <div className="flex  h-full justify-around  flex-col">
                  <p className="text-xs text-[#9B9D9D] ">7d%</p>
                  <p className="text-xs  relative right-[16px] text-[#FC5050] flex items-center">
                    <Icon
                      className="rotate-180"
                      icon={"icon-park-solid:up-one"}
                      width={16}
                      height={16}
                    />
                    8.5%
                  </p>
                </div>
              </div>
            </div>
            <div className="flex mt-3 items-center gap-4">
              {strategy.riskLevel && (
                <div className="text-xs flex items-center text-[#06E574]">
                  <Icon
                    icon="material-symbols:info-rounded"
                    width={16}
                    className="mr-1"
                  />
                  Risk:{" "}
                  <span className="font-semibold ml-1 text-[10px]">
                    {strategy.riskLevel}
                  </span>
                </div>
              )}
              {strategy.tradeType && (
                <div className="text-xs flex items-center text-white">
                  <Image
                    src="/icons/casino.svg"
                    alt="trade type"
                    width={16}
                    height={16}
                    className="mr-1"
                  />
                  Trade Type:{" "}
                  <span className="ml-1 font-semibold">
                    {strategy.tradeType}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col mt-6 md:mt-0  lg:items-end gap-4">
            <p className="text-[#F5F7F7] text-sm">Available</p>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 md:w-8 md:h-8 relative">
                <Image src="/icons/usdt.svg" alt="usdt" fill />
              </div>
              <h6 className="text-white whitespace-nowrap text-sm md:text-xl font-semibold">
                4000 USDT
              </h6>
            </div>
            <p className="text-[#9B9D9D] text-xs">
              This strategy is executed using USDT
            </p>
          </div>
        </div>
        {/* Right/Sidebar */}
        <div className="flex bg-[#222223] gap-2.5 w-full md:w-auto min-w-[261px] border h-full  border-[#474848] rounded-[16px] p-2.5 justify-center flex-col">
          <button onClick={() => setModalTab("Overview")} className="text-left">
            <SidebarCard title="Overview" icon="qlementine-icons:key-cmd-16" />
          </button>
          <button
            onClick={() => setModalTab("Activities")}
            className="text-left"
          >
            <SidebarCard
              title="Activities"
              icon="hugeicons:computer-activity"
            />
          </button>
          <button
            onClick={() => setModalTab("Transactions")}
            className="text-left"
          >
            <SidebarCard
              title="Transactions"
              icon="mingcute:transfer-horizontal-line"
            />
          </button>
        </div>
      </div>
      {/* Your Position */}
      <div className=" mt-10 ">
        <div className="text-white font-semibold mb-3">Your Position</div>

        <div className="bg-[#222223] border border-[#474848] rounded-[16px] p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center bg-[#1E1F1F] border-[0.5px] border-[#d9d9d9]/40 rounded-[12px] px-3 h-[52px] min-h-[52px]">
              <div className="flex w-[92px] h-[37px] rounded-[10px] bg-[#303131] items-center justify-center gap-2 mr-3">
                <Image
                  src="/icons/usdt.svg"
                  alt="USDT"
                  width={26}
                  height={26}
                />
                <p className=" text-[#ADADAD]  font-medium ">USDT</p>
              </div>
              <input
                value={amountEth}
                onChange={(e) => setAmountEth(e.target.value)}
                type="number"
                min={0}
                placeholder="Enter Amount"
                className="flex-1 appearance-none bg-transparent outline-none text-white placeholder:text-[#9B9D9D]"
              />
            </div>
            <button
              disabled={!canAllocate}
              onClick={handleAllocate}
              className={`h-[52px] rounded-[12px] px-4 font-semibold transition-colors ${
                canAllocate
                  ? "bg-[#6B5CFF] text-white hover:bg-[#584BFF]"
                  : "bg-[#3A3B3B] text-[#9B9D9D] cursor-not-allowed"
              }`}
            >
              Allocate Funds
            </button>
          </div>

          <div className="text-[10px] text-[#9B9D9D] mt-2">
            Minimum of {minUSDT} USDT is required for this strategy
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            <Metric label="Entry Price" value="$2100" />
            <Metric label="Exit Price" value="$2300" />
            <Metric label="PNL" value="+$200" />
            <Metric label="Slippage Tolerance" value="2.5" />
            <Metric label="Gas Fee" value="$25" />
            <Metric label="Network Cost" value="2%" />
          </div>

          {/* Wallet Compatibility */}
          <div className="mt-6">
            <div className="text-[#E8BF3D] font-medium text-[18px] mb-1 flex items-center gap-2">
              <Icon icon="material-symbols:info-rounded" width={24} />
              Wallet Compatibility
            </div>
            <p className="text-[#9B9D9D] text-xs">
              {strategy.compatibility ||
                "Compatible with all major wallets including MetaMask, Trust Wallet, and Coinbase Wallet."}
            </p>
          </div>
        </div>
      </div>
      <StrategyOverviewModal
        isOpen={modalTab !== null}
        onClose={() => setModalTab(null)}
        strategy={strategy}
        initialTab={modalTab || "Overview"}
      />
    </div>
  );
};

export default StrategyDetailsPage;
