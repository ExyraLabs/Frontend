import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { chainImageMapping } from "@/utils/constants";
import { useChatRoomsMessages } from "../hooks/useChatRoomsMessages";

interface TradeHistoryEntry {
  coin: string;
  entryPrice: number;
  exitPrice?: number;
  entryDate?: string;
  exitDate?: string;
}

interface StratsCardProps {
  icon: string[];
  title: string;
  subtitle?: string;
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
    <div className="bg-[#303131] hover:border-white duration-1000 rounded-[16px] p-4 flex flex-col min-h-[300px] shadow-md border-[0.5px] border-[#303131]">
      {/* Header: Title, Category, Icons */}
      <div className="flex items-center justify-between border-b border-[#474848] pb-2 mb-2">
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
            <div className="text-white text-lg font-semibold leading-tight">
              <button
                className="hover:underline text-left"
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
              <div className="text-[#B5B5B5] text-xs leading-tight">
                {subtitle.length > 30
                  ? `${subtitle.slice(0, 30)}...`
                  : subtitle}
              </div>
            )}
            <div className="text-xs text-[#A79EF5] font-semibold mt-1">
              {category}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          {icon.map((item, idx) => (
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
          ))}
        </div>
      </div>
      {/* Strategy Stats */}
      <div className="flex flex-wrap gap-4 mb-2">
        {/* {tradeType && (
          <div className="text-xs text-[#B5B5B5]">
            Type:{" "}
            <span className="text-[#F5F7F7] font-semibold text-[10px]">
              {tradeType}
            </span>
          </div>
        )} */}
        {riskLevel && (
          <div className="text-xs text-[#B5B5B5]">
            Risk:{" "}
            <span className="text-[#F5F7F7] font-semibold text-[10px]">
              {riskLevel}
            </span>
          </div>
        )}
        {typeof pnl === "number" && (
          <div className="text-xs text-[#B5B5B5]">
            PNL:{" "}
            <span
              className={`font-semibold text-[10px] ${
                pnl >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {pnl}%
            </span>
          </div>
        )}
        {typeof apy === "number" && (
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
        )}
        {/* {tags.length > 0 && (
          <div className="text-xs text-[#B5B5B5]">
            Tags:{" "}
            <span className="text-[#A79EF5] text-[12px]">
              {tags.join(", ")}
            </span>
          </div>
        )} */}
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="mb-2  rounded-lg p-2">
          <div className="text-[#F5B041] text-xs font-semibold mb-1">
            Features
          </div>
          <ul className="list-disc pl-5 text-[#F5F7F7] text-xs space-y-1">
            {features.map((feature, idx) => (
              <li key={idx} className="text-[#F7DC6F]">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Trade History */}
      {history.length > 0 && (
        <div className="mb-2  rounded-lg p-2">
          <div className="text-[#5DADE2] text-xs font-semibold mb-1">
            History
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[10px] text-[#F5F7F7]">
              <thead>
                <tr className="text-[#B5B5B5]">
                  <th className="px-2 py-1">Coin</th>
                  <th className="px-2 py-1">Entry</th>
                  <th className="px-2 py-1">Exit</th>
                  <th className="px-2 py-1">Entry Date</th>
                  <th className="px-2 py-1">Exit Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((trade, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-[#262727]" : "bg-[#303131]"}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StratCard;
