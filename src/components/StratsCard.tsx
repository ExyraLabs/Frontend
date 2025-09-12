import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getRiskLevelColor } from "@/utils/constants";
import { useChatRoomsMessages } from "../hooks/useChatRoomsMessages";
import { Icon } from "@iconify/react";
import type { TradeHistoryEntry } from "@/types/strategy";

interface StratsCardProps {
  icon: string | string[];
  title: string;
  subtitle?: string;
  followers?: string[]; // Array of wallet addresses
  category: string;
  features?: string[];
  prompts?: string[];
  chains?: string[];
  tradeType?: string;
  pnl?: number;
  apy?: number;
  riskLevel?: string;
  history?: TradeHistoryEntry[];
  tags?: string[];
}

const StratCard: React.FC<StratsCardProps> = ({
  icon,
  title,
  subtitle,
  category,
  followers,
  features = [],
  prompts = [],
  chains = [],
  tradeType,
  pnl,
  apy,
  riskLevel,
  history = [],
  tags = [],
}) => {
  const router = useRouter();
  const { createChatRoom, loadChatRooms } = useChatRoomsMessages();

  // Helper to generate a proper uuid (RFC4122 v4)
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  const handlePromptClick = (prompt: string) => {
    let chatId = generateUUID();
    const chatRooms = loadChatRooms();
    // Ensure unique chatId
    while (chatRooms[chatId]) {
      chatId = generateUUID();
    }

    // Create empty chat room without any messages
    createChatRoom(chatId, "");

    // Navigate to chat with prompt as URL parameter
    router.push(`/chat/${chatId}?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="bg-[#222223] hover:border-white duration-1000 rounded-[16px] p-4 flex flex-col justify-between min-h-[219px] shadow-md border-[0.5px] border-[#303131]">
      {/* Header: Title, Category, Icons */}
      <div className="flex items-start justify-between border-b border-[#474848] pb-2 ">
        <div className="flex items-center gap-3">
          {/* <div className="flex items-center">
            {Array.isArray(icon) ? (
              icon.map((iconSrc, idx) => (
                <div
                  key={idx}
                  style={{ zIndex: idx }}
                  className={idx === 0 ? "relative" : "relative -ml-5"}
                >
                  <div className="w-8 h-8 relative flex items-center justify-center rounded-full">
                    <Image
                      src={iconSrc}
                      alt={`${title} icon ${idx + 1}`}
                      className="rounded-full"
                      fill
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="w-8 h-8 relative flex items-center justify-center rounded-full">
                <Image
                  src={icon as string}
                  alt={title}
                  className="rounded-full"
                  fill
                />
              </div>
            )}
          </div> */}
          <div>
            <div className="text-white  font-semibold">
              <button
                className="hover:underline cursor-pointer text-left"
                onClick={() =>
                  router.push(
                    `/strategy/${title.replace(/\s+/g, "-").toLowerCase()}`
                  )
                }
              >
                {title}
              </button>
            </div>
            {subtitle && (
              <div className="text-[#9B9D9D] text-xs ">
                {subtitle.length > 40
                  ? `${subtitle.slice(0, 40)}...`
                  : subtitle}
              </div>
            )}
            <div className="flex mt-2 items-center">
              {Array.isArray(icon) ? (
                icon.map((item: string, idx: number) => (
                  <div
                    key={idx.toString()}
                    style={{ zIndex: idx }}
                    className={idx === 0 ? "relative" : "relative -ml-2.5"}
                  >
                    <Image
                      src={item}
                      alt={idx.toString()}
                      width={24}
                      height={24}
                      className="inline-block rounded-full"
                    />
                  </div>
                ))
              ) : (
                <div className="relative">
                  <Image
                    src={icon}
                    alt="strategy icon"
                    width={24}
                    height={24}
                    className="inline-block rounded-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between h-full">
          <div className="text-xs w-[57px] h-[24px] bg-[#595656]/17 rounded-[35px] p-2.5 flex items-center justify-center text-[#A79EF5] font-semibold mt-1">
            {category}
          </div>
          {(followers?.length || 0) > 0 && (
            <div className="text-[#F5B041]/80   text-[10px] flex items-center font-semibold mb-1">
              +{followers?.length || 0}{" "}
              <Icon
                icon="fa7-solid:users-line"
                width={16}
                height={16}
                className="ml-1"
              />
            </div>
          )}
        </div>
      </div>
      {/* Features */}
      <div className="flex   justify-between items-center">
        <div className="w-[152px]   p-1 h-[46px] rounded-xl bg-[#1e1f1f] border-[0.5px] border-[#d9d9d9]/40">
          <div className="bg-[#303131] flex items-center justify-center w-full h-full rounded-[10px]">
            <p className="text-[#ADADAD] text-sm font-medium">
              PNL:{" "}
              <span className="text-[#06E574] ml-1 text-[18px] font-medium">
                {pnl}%
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex     h-full justify-around flex-col">
            <p className="text-xs text-[#9B9D9D] ">24h%</p>
            <p className="text-xs  relative right-[16px] text-[#06E574] flex items-center">
              <Icon icon={"icon-park-solid:up-one"} width={16} height={16} />
              {pnl}%
            </p>
          </div>
          <div className="flex  h-full justify-around flex-col">
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

      {/* Trade History */}
      {/* {history.length > 0 && (
        <div className="my-2  rounded-lg ">
          <div className="text-[#5DADE2] text-xs font-semibold mb-1">
            History
          </div>
          <div className="overflow-x-auto p-2">
            <table className="min-w-full text-[10px] text-[#F5F7F7]">
              <thead>
                <tr className="text-[#B5B5B5]">
                  <th className="px-2 py-1">Coin</th>
                  <th className="px-2 py-1">Entry</th>
                  <th className="px-2 py-1">Exit</th>
                  <th className="px-2 py-1">Entry Date</th>
                  <th className="px-2 py-1">Exit Date</th>
                  <th className="px-2 py-1">PNL</th>
                </tr>
              </thead>
              <tbody>
                {history.map((trade, idx) => (
                  <tr
                    key={idx}
                    // className={  idx % 2 === 0 ? "bg-[#262727]" : "bg-[#303131]"}
                  >
                    <td className="px-2 py-1 text-[#F7DC6F]">{trade.coin}</td>
                    <td className="px-2 py-1 text-[#ABEBC6]">
                      {trade.entryPrice}
                    </td>
                    <td className="px-2 py-1 text-[#F1948A]">
                      {trade.exitPrice ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-[#B5B5B5]">
                      {trade.entryDate ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-[#B5B5B5]">
                      {trade.exitDate ?? "-"}
                    </td>

                    <td
                      className={`px-2 py-1 ${
                        typeof trade.pnl === "number"
                          ? trade.pnl >= 0
                            ? "text-green-400"
                            : "text-red-400"
                          : "text-[#B5B5B5]"
                      }`}
                    >
                      {typeof trade.pnl === "number" ? trade.pnl : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}
      {/* Strategy Stats */}
      <div className="flex flex-wrap gap-4">
        {riskLevel && (
          <div
            className={`text-xs flex items-center ${getRiskLevelColor(
              riskLevel
            )}`}
          >
            <Icon
              icon={"material-symbols:info-rounded"}
              width={16}
              height={16}
              className="mr-2"
            />
            Risk:{" "}
            <span className="font-semibold ml-1 text-[10px]">{riskLevel}</span>
          </div>
        )}

        {/* {typeof apy === "number" && (
          <div className="text-xs text-[#B5B5B5]">
            APY:{" "}
            <span
              className={`font-semibold text-[10px] ${
                apy >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {apy}%
            </span>
          </div>
        )} */}
        {/* {tags.length > 0 && (
          <div className="text-xs text-[#B5B5B5]">
            Tags:{" "}
            <span className="text-[#A79EF5] text-[12px]">
              {tags.join(", ")}
            </span>
          </div>
        )} */}
        {tradeType && (
          <div className="text-xs flex items-center text-white">
            <Image
              src={"/icons/casino.svg"}
              alt="trade type"
              className="mr-1"
              width={16}
              height={16}
            />
            Trade Type:{" "}
            <span className="text-[#F5F7F7] ml-1 font-semibold">
              {tradeType}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StratCard;
