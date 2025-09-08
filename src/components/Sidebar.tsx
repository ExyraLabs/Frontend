"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useChatRoomsMessages } from "../hooks/useChatRoomsMessages";
import { useSavedPrompts, SavedPrompt } from "../hooks/useSavedPrompts";
import { useState, useMemo, useEffect } from "react";
import { Message } from "@copilotkit/runtime-client-gql";
import GradientLine from "./GradientLine";
import { socialLinks } from "@/utils/constants";
import { getChatRelativeTime } from "@/utils/timeUtils";
import Uniswap from "@/agents/Uniswap";
import Lido from "@/agents/Lido";
import Knc from "@/agents/Knc";
import AlchemyAgent from "@/agents/Alchemy";
import Aave from "@/agents/Aave";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Extract current chat ID from pathname
  const currentChatId = pathname?.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  const navItems = [
    {
      name: "Search",
      imgSrc: "/icons/searchs.svg",
      width: 32,
      height: 32,
      href: "/search",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
        >
          <path
            d="M14.916 22.1c4.372 0 7.916-3.38 7.916-7.55S19.288 7 14.916 7 7 10.38 7 14.55s3.544 7.55 7.916 7.55zM26 25.12l-5.489-5.234"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "Discover Agents",
      imgSrc: "/icons/explore.svg",
      width: 32,
      href: "/discover",
      height: 32,
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
        >
          <rect x="6.5" y="6.5" width="19" height="19" rx="9.5" stroke="#fff" />
          <circle cx="13" cy="13" r="2" stroke="#D9D9D9" />
          <circle cx="19" cy="13" r="2" stroke="#D9D9D9" />
          <circle cx="13" cy="19" r="2" stroke="#D9D9D9" />
          <circle cx="19" cy="19" r="2" stroke="#D9D9D9" />
        </svg>
      ),
    },
    {
      name: "Saved Prompts",
      imgSrc: "/icons/saved.svg",
      width: 32,
      height: 32,
      href: "/saved",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M6 19.5V5.616c0-.46.154-.845.463-1.153A1.57 1.57 0 017.616 4h8.769c.46 0 .844.154 1.153.463.309.309.463.693.462 1.153V19.5l-6-2.577L6 19.5zm1-1.55l5-2.15 5 2.15V5.616a.591.591 0 00-.192-.424.584.584 0 00-.424-.192H7.616a.591.591 0 00-.424.192.584.584 0 00-.192.424V17.95z"
            fill="#fff"
          />
        </svg>
      ),
    },
    {
      name: "Rewards",
      imgSrc: "/icons/reward.min.svg",
      width: 32,
      height: 32,
      href: "/strategy",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
        >
          <g transform="translate(5, 6)">
            <path
              d="M12 16.111a.555.555 0 00-.556-.556H8.111a.556.556 0 000 1.112h3.333A.556.556 0 0012 16.11zM12.522 13.333H9.19a.556.556 0 000 1.111h3.333a.556.556 0 000-1.11zM12.222 17.778H8.89a.555.555 0 100 1.11h3.333a.556.556 0 100-1.11zM18.167 17.778h-3.89a.556.556 0 100 1.11h3.89a.555.555 0 100-1.11zM18.722 15.556h-3.889a.556.556 0 000 1.11h3.89a.556.556 0 000-1.11z"
              fill="#fff"
            />
            <path
              d="M18.744 14.444a15.557 15.557 0 00-1.566-5.622 11.244 11.244 0 00-3.511-3.983L15 1.9a.556.556 0 00-.039-.556.555.555 0 00-.444-.233H5.444a.555.555 0 00-.505.789L6.3 4.85a11.278 11.278 0 00-3.489 3.972c-1.194 2.222-1.567 4.94-1.667 6.823A2 2 0 001.7 17.15a2.111 2.111 0 001.522.595h3.445v-1.078h-3.49a.933.933 0 01-.869-.605.9.9 0 01-.052-.368c.077-1.45.383-4.21 1.533-6.36a10 10 0 013.478-3.778h.555c-.376.52-.723 1.062-1.039 1.622-.32.596-.594 1.216-.816 1.855l.76.511c.226-.663.502-1.307.829-1.927.4-.721.855-1.41 1.36-2.061h.556c.373.89.636 1.823.784 2.777.12.709.18 1.426.177 2.145l.878-.617a13.316 13.316 0 00-.178-1.667 13.89 13.89 0 00-.71-2.638h.433l.505-1.112H7.34L6.31 2.222h7.339l-1.389 3.04c.238.127.466.272.683.432a10.333 10.333 0 013.256 3.65c.78 1.6 1.263 3.328 1.428 5.1h1.116z"
              fill="#fff"
            />
          </g>
        </svg>
      ),
    },
    // {
    //   name: "History",
    //   imgSrc: "/icons/history.min.svg",
    //   width: 32,
    //   height: 32,
    //   href: "/history",
    //   icon: (
    //     <svg
    //       width="24"
    //       height="24"
    //       fill="none"
    //       xmlns="http://www.w3.org/2000/svg"
    //       viewBox="6 6 28 28"
    //     >
    //       <g filter="url(#prefix__filter0_d_3308_4755)">
    //         <path
    //           fillRule="evenodd"
    //           clipRule="evenodd"
    //           d="M14.14 10.224c3.163-3.158 8.305-3.125 11.486.058 3.184 3.183 3.217 8.327.054 11.49-3.163 3.162-8.307 3.13-11.49-.054a8.174 8.174 0 01-2.332-6.9.625.625 0 111.24.17 6.923 6.923 0 001.975 5.847c2.704 2.703 7.057 2.72 9.724.053 2.665-2.666 2.65-7.019-.054-9.723-2.702-2.702-7.052-2.72-9.719-.057l.623.003a.624.624 0 11-.005 1.25l-2.122-.01a.625.625 0 01-.622-.623l-.01-2.12a.624.624 0 111.25-.006l.003.622zm5.767 1.817a.625.625 0 01.625.625v3.075l1.901 1.9a.626.626 0 11-.883.884l-2.267-2.267v-3.591a.625.625 0 01.625-.625"
    //           fill="#fff"
    //         />
    //       </g>
    //       <defs>
    //         <filter
    //           id="prefix__filter0_d_3308_4755"
    //           x="0"
    //           y="0"
    //           width="39.769"
    //           height="40"
    //           filterUnits="userSpaceOnUse"
    //           colorInterpolationFilters="sRGB"
    //         >
    //           <feFlood floodOpacity="0" result="BackgroundImageFix" />
    //           <feColorMatrix
    //             in="SourceAlpha"
    //             values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
    //             result="hardAlpha"
    //           />
    //           <feOffset dy="4" />
    //           <feGaussianBlur stdDeviation="2" />
    //           <feComposite in2="hardAlpha" operator="out" />
    //           <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
    //           <feBlend
    //             in2="BackgroundImageFix"
    //             result="effect1_dropShadow_3308_4755"
    //           />
    //           <feBlend
    //             in="SourceGraphic"
    //             in2="effect1_dropShadow_3308_4755"
    //             result="shape"
    //           />
    //         </filter>
    //       </defs>
    //     </svg>
    //   ),
    // },
  ];

  const { loadChatRooms, deleteChatRoom, getChatTitle } =
    useChatRoomsMessages();
  const { loadSavedPrompts, deletePrompt } = useSavedPrompts();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSavedPromptsModal, setShowSavedPromptsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [promptSearchQuery, setPromptSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Fix hydration by ensuring we only render client-specific content after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const chatRoomsObj = isClient ? loadChatRooms() : {};
  const chatRooms = Object.entries(chatRoomsObj);

  // Utility function to get the first message date from a chat room (chat creation time)
  const getFirstMessageDate = (messages: Message[]): Date | null => {
    if (messages.length === 0) return null;

    // Find the message with the earliest createdAt timestamp (first message)
    const firstMessage = messages.reduce((earliest, current) => {
      const currentDate = new Date(current.createdAt);
      const earliestDate = new Date(earliest.createdAt);
      return currentDate < earliestDate ? current : earliest;
    });

    return new Date(firstMessage.createdAt);
  };

  // Utility function to get the most recent message date from a chat room
  const getMostRecentMessageDate = (messages: Message[]): Date | null => {
    if (messages.length === 0) return null;

    // Find the message with the most recent createdAt timestamp
    const mostRecentMessage = messages.reduce((latest, current) => {
      const currentDate = new Date(current.createdAt);
      const latestDate = new Date(latest.createdAt);
      return currentDate > latestDate ? current : latest;
    });

    return new Date(mostRecentMessage.createdAt);
  };

  // Recalculate grouped chat rooms when refresh changes
  const groupedChatRooms = useMemo(() => {
    // Return empty groups if not on client yet
    if (!isClient) {
      return {
        today: [] as [string, Message[]][],
        yesterday: [] as [string, Message[]][],
        previous7Days: [] as [string, Message[]][],
        previous30Days: [] as [string, Message[]][],
      };
    }

    // Utility function to categorize chat rooms by time periods
    const groupChatRoomsByTime = (chatRoomsToGroup: [string, Message[]][]) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const groups = {
        today: [] as [string, Message[]][],
        yesterday: [] as [string, Message[]][],
        previous7Days: [] as [string, Message[]][],
        previous30Days: [] as [string, Message[]][],
      };

      chatRoomsToGroup.forEach(([chatId, messages]) => {
        const mostRecentDate = getMostRecentMessageDate(messages);
        if (!mostRecentDate) return;

        // Group by most recent activity
        if (mostRecentDate >= today) {
          groups.today.push([chatId, messages]);
        } else if (mostRecentDate >= yesterday) {
          groups.yesterday.push([chatId, messages]);
        } else if (mostRecentDate >= sevenDaysAgo) {
          groups.previous7Days.push([chatId, messages]);
        } else if (mostRecentDate >= thirtyDaysAgo) {
          groups.previous30Days.push([chatId, messages]);
        }
      });

      // Sort each group by chat creation time (first message) - most recent creation first
      // This ensures stable ordering that doesn't change when you interact with chats
      Object.values(groups).forEach((group) => {
        group.sort(([, messagesA], [, messagesB]) => {
          const dateA = getFirstMessageDate(messagesA);
          const dateB = getFirstMessageDate(messagesB);
          if (!dateA || !dateB) return 0;
          return dateB.getTime() - dateA.getTime(); // Most recent chat creation first
        });
      });

      return groups;
    };

    return groupChatRoomsByTime(chatRooms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRooms, refresh, isClient]);

  // Filter chat rooms based on search query
  const filteredChatRooms = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedChatRooms;
    }

    const query = searchQuery.toLowerCase().trim();
    const filterChatGroup = (chats: [string, Message[]][]) => {
      return chats.filter(([chatId, messages]) => {
        // Search in chat ID
        if (chatId.toLowerCase().includes(query)) {
          return true;
        }

        // Search in message content
        return messages.some((message) => {
          if (message.type === "TextMessage" && "content" in message) {
            const content = message.content as string;
            return content.toLowerCase().includes(query);
          }
          return false;
        });
      });
    };

    return {
      today: filterChatGroup(groupedChatRooms.today),
      yesterday: filterChatGroup(groupedChatRooms.yesterday),
      previous7Days: filterChatGroup(groupedChatRooms.previous7Days),
      previous30Days: filterChatGroup(groupedChatRooms.previous30Days),
    };
  }, [groupedChatRooms, searchQuery]);

  // Filter saved prompts based on search query
  const filteredSavedPrompts = useMemo(() => {
    if (!isClient) return [];

    const savedPrompts = loadSavedPrompts();

    if (!promptSearchQuery.trim()) {
      return savedPrompts;
    }

    const query = promptSearchQuery.toLowerCase().trim();
    return savedPrompts.filter((prompt: SavedPrompt) => {
      return (
        prompt.content.toLowerCase().includes(query) ||
        (prompt.title && prompt.title.toLowerCase().includes(query))
      );
    });
  }, [loadSavedPrompts, promptSearchQuery, isClient]);

  const handleDelete = (chatId: string) => {
    deleteChatRoom(chatId);
    setRefresh((r) => r + 1); // force re-render
    router.push("/");
  };

  const handleDeletePrompt = (promptId: string) => {
    deletePrompt(promptId);
    setRefresh((r) => r + 1); // force re-render
  };

  // Reusable ChatItem component
  const ChatItem: React.FC<{
    chatId: string;
    showInModal?: boolean;
    isMobile?: boolean;
    highlightSearchQuery?: string;
  }> = ({
    chatId,
    showInModal = false,
    isMobile = false,
    highlightSearchQuery,
  }) => {
    const displayText = getChatTitle(chatId);
    const isActive = currentChatId === chatId;

    // Get the chat messages to calculate relative time
    const chatMessages = isClient ? chatRoomsObj[chatId] || [] : [];
    const relativeTime = getChatRelativeTime(chatMessages);

    // Highlight matching text for search results
    const highlightText = (text: string, query: string) => {
      if (!query?.trim()) return text;
      const regex = new RegExp(
        `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
      );
      const parts = text.split(regex);
      return parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-yellow-300 text-black px-1 rounded">
            {part}
          </span>
        ) : (
          part
        )
      );
    };

    return (
      <li
        key={chatId}
        className={`text-xs w-full text-white cursor-pointer flex items-center duration-200 transition-all justify-between group px-3 py-2 ${
          showInModal ? "my-4" : ""
        } ${
          isActive
            ? "bg-appDark rounded-[8px]"
            : "hover:bg-appDark/50 hover:rounded-[8px]"
        }`}
        onClick={() => {
          router.push(`/chat/${chatId}`);
          if (showInModal) {
            setShowSearchModal(false);
            setSearchQuery("");
          }
        }}
        // only set this if showInModal is false
        onMouseEnter={showInModal ? undefined : () => setHoveredChatId(chatId)}
        onMouseLeave={showInModal ? undefined : () => setHoveredChatId(null)}
      >
        <div className="flex  gap-6 items-center flex-1 min-w-0">
          <span
            className={`truncate text-white ${
              showInModal ? "text-sm min-w-[75%]" : "text-xs"
            }`}
          >
            {highlightSearchQuery
              ? highlightText(displayText, highlightSearchQuery)
              : displayText}
          </span>
          {showInModal && relativeTime && (
            <span className="text-gray-400 whitespace-nowrap text-xs mt-1">
              {relativeTime}
            </span>
          )}
        </div>
        {hoveredChatId === chatId && !showInModal && (
          <button
            className="duration-500 cursor-pointer hover:scale-125 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(chatId);
            }}
            title="Delete chat"
          >
            <Image
              src="/icons/delete.svg"
              alt="Delete"
              width={isMobile ? 18 : 16}
              height={isMobile ? 18 : 16}
            />
          </button>
        )}
      </li>
    );
  };

  // Helper component to render a group of chat rooms
  const renderChatGroup = (
    title: string,
    chats: [string, Message[]][],
    showInModal = false
  ) => {
    if (chats.length === 0) return null;

    return (
      <div className={showInModal ? " px-2.5 lg:px-5 mt-6" : ""}>
        <p className="text-[#9A9C9C] font-medium text-sm tracking-[-0.6%] mb-3">
          {title}
        </p>
        <div className={showInModal ? "px-1.5 lg:px-3" : ""}>
          {chats.map(([chatId]) => (
            <ChatItem key={chatId} chatId={chatId} showInModal={showInModal} />
          ))}
        </div>
      </div>
    );
  };

  // Mobile overlay logic
  // Sidebar is always visible on md+ screens, toggled on mobile
  return (
    <>
      {/* Overlay for mobile */}
      {typeof open === "boolean" && (
        <div
          className={`fixed bg-black inset-0 z-40 opacity-80 md:hidden ${
            open ? "block" : "hidden"
          }`}
          onClick={onClose}
        />
      )}
      {showSavedPromptsModal && (
        <>
          {/* Overlay for saved prompts modal */}
          <div
            className="fixed inset-0 z-[100] bg-opacity-50 transition-opacity"
            onClick={() => {
              setShowSavedPromptsModal(false);
              setPromptSearchQuery("");
            }}
          />
          <div className="w-[515px] shadow-[2px_2px_10px] shadow-appGray/30 p-4 fixed left-[50%] -translate-x-1/2 top-[50%] -translate-y-1/2 z-[110] h-[616px] rounded-[20px] flex flex-col bg-[#303131] mx-auto">
            <div className="flex items-center border-b-[0.5px] border-[#D9D9D9]/40 px-5">
              <svg
                width="20"
                height="20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="mr-3 flex-shrink-0 text-[#ADADAD]"
              >
                <path
                  d="M6 19.5V5.616c0-.46.154-.845.463-1.153A1.57 1.57 0 017.616 4h8.769c.46 0 .844.154 1.153.463.309.309.463.693.462 1.153V19.5l-6-2.577L6 19.5zm1-1.55l5-2.15 5 2.15V5.616a.591.591 0 00-.192-.424.584.584 0 00-.424-.192H7.616a.591.591 0 00-.424.192.584.584 0 00-.192.424V17.95z"
                  fill="currentColor"
                />
              </svg>
              <input
                placeholder="Search saved prompts..."
                value={promptSearchQuery}
                onChange={(e) => setPromptSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowSavedPromptsModal(false);
                    setPromptSearchQuery("");
                  }
                }}
                className="w-full h-[64px] text-[#ADADAD] text-lg font-medium bg-transparent focus:outline-none placeholder:text-[#ADADAD] focus:text-white"
                autoFocus
              />
              {promptSearchQuery && (
                <button
                  onClick={() => setPromptSearchQuery("")}
                  className="mr-3 p-1 hover:bg-gray-600 rounded-full transition-colors"
                  title="Clear search"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#ADADAD]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              <Image
                src={"/icons/close.svg"}
                width={24}
                height={24}
                alt="close"
                className="cursor-pointer flex-shrink-0"
                onClick={() => {
                  setShowSavedPromptsModal(false);
                  setPromptSearchQuery("");
                }}
              />
            </div>

            {/* Saved Prompts List */}
            <div className="flex-1  scrollbar-hide overflow-y-auto">
              {filteredSavedPrompts.length === 0 ? (
                <div className="px-5 mt-6">
                  <p className="text-[#9A9C9C] font-medium text-sm tracking-[-0.6%]">
                    {promptSearchQuery.trim()
                      ? "Search Results"
                      : "Saved Prompts"}
                  </p>
                  <div className="px-3 mt-4">
                    <p className="text-xs text-gray-400">
                      {promptSearchQuery.trim()
                        ? `No prompts found matching "${promptSearchQuery}"`
                        : "No saved prompts yet."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-5 mt-6">
                  <p className="text-[#9A9C9C] font-medium text-sm tracking-[-0.6%]">
                    {promptSearchQuery.trim()
                      ? `Search Results (${filteredSavedPrompts.length})`
                      : `Saved Prompts (${filteredSavedPrompts.length})`}
                  </p>
                  <div className="px-3">
                    {filteredSavedPrompts.map((prompt) => {
                      // Highlight matching text
                      const highlightText = (text: string, query: string) => {
                        if (!query.trim()) return text;
                        const regex = new RegExp(
                          `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                          "gi"
                        );
                        const parts = text.split(regex);
                        return parts.map((part, index) =>
                          regex.test(part) ? (
                            <span
                              key={index}
                              className="bg-yellow-300 text-black px-1 rounded"
                            >
                              {part}
                            </span>
                          ) : (
                            part
                          )
                        );
                      };

                      const displayTitle =
                        prompt.title ||
                        prompt.content.slice(0, 50) +
                          (prompt.content.length > 50 ? "..." : "");

                      return (
                        <div
                          key={prompt.id}
                          className="my-4 w-full text-white cursor-pointer p-3 rounded-lg hover:bg-[#1E1F1F] transition-colors group"
                          onClick={() => {
                            // Copy prompt content to clipboard or navigate to new chat with this prompt
                            navigator.clipboard.writeText(prompt.content);
                            setShowSavedPromptsModal(false);
                            setPromptSearchQuery("");
                            // You could also create a new chat with this prompt
                            // router.push(`/?prompt=${encodeURIComponent(prompt.content)}`);
                          }}
                          onMouseEnter={() => setHoveredPromptId(prompt.id)}
                          onMouseLeave={() => setHoveredPromptId(null)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {promptSearchQuery.trim()
                                  ? highlightText(
                                      displayTitle,
                                      promptSearchQuery
                                    )
                                  : displayTitle}
                              </p>
                              <p
                                className="text-xs text-gray-400 mt-1 overflow-hidden"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {promptSearchQuery.trim()
                                  ? highlightText(
                                      prompt.content,
                                      promptSearchQuery
                                    )
                                  : prompt.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(
                                  prompt.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            {hoveredPromptId === prompt.id && (
                              <button
                                className="duration-500 cursor-pointer hover:scale-125 ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePrompt(prompt.id);
                                }}
                                title="Delete prompt"
                              >
                                <Image
                                  src="/icons/delete.svg"
                                  alt="Delete"
                                  width={14}
                                  height={14}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {showSearchModal && (
        <>
          {/* Overlay for search modal */}
          <div
            className="fixed  inset-0 z-[100] bg-black  opacity-50 transition-opacity"
            onClick={() => {
              setShowSearchModal(false);
              setSearchQuery("");
            }}
          />
          <div className=" w-[90%] lg:w-[515px] shadow-[2px_2px_10px] shadow-appGray/30 p-4 fixed left-[50%] -translate-x-1/2 top-[50%] -translate-y-1/2 z-[110] lg:h-[616px] flex flex-col  rounded-[20px] bg-[#303131] mx-auto ">
            <div className="flex items-center border-b-[0.5px]  border-[#D9D9D9]/40  px-5">
              <svg
                width="20"
                height="20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                className="mr-3 flex-shrink-0 text-[#ADADAD]"
              >
                <path
                  d="M14.916 22.1c4.372 0 7.916-3.38 7.916-7.55S19.288 7 14.916 7 7 10.38 7 14.55s3.544 7.55 7.916 7.55zM26 25.12l-5.489-5.234"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowSearchModal(false);
                    setSearchQuery("");
                  }
                }}
                className="w-full h-[64px] text-[#ADADAD] text-lg font-medium bg-transparent focus:outline-none placeholder:text-[#ADADAD] focus:text-white"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mr-3 p-1 hover:bg-gray-600 rounded-full transition-colors"
                  title="Clear search"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#ADADAD]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              <Image
                src={"/icons/close.svg"}
                width={24}
                height={24}
                alt="close"
                className="cursor-pointer flex-shrink-0"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery(""); // Clear search when closing modal
                }}
              />
            </div>
            <div className="lg:px-5 mt-6">
              <p className="text-[#9A9C9C] font-medium text-sm tracking-[-0.6%]">
                Actions
              </p>
              {/* New Chat Button */}

              <button
                onClick={() => {
                  router.push("/");
                  setShowSearchModal(false);
                  setSearchQuery("");
                  if (onClose) {
                    onClose();
                  }
                }}
                className="flex cursor-pointer flex-1 justify-start px-5 items-center gap-3.5 w-full  min-h-[56px] mt-3 rounded-[18px] bg-[#1E1F1F]"
              >
                <Image
                  src="/icons/edit.svg"
                  alt="New"
                  width={15}
                  height={15}
                  className=""
                />
                <p className="text-sm font-semibold">Create New Chat</p>
              </button>
            </div>

            {/* Search Results or Default Groups */}
            <div className="flex-1  scrollbar-hide overflow-y-auto">
              {searchQuery.trim() ? (
                // Show search results
                <>
                  {(() => {
                    const allFilteredChats = [
                      ...filteredChatRooms.today,
                      ...filteredChatRooms.yesterday,
                      ...filteredChatRooms.previous7Days,
                      ...filteredChatRooms.previous30Days,
                    ];

                    if (allFilteredChats.length === 0) {
                      return (
                        <div className="px-5 mt-6">
                          <p className="text-[#9A9C9C] font-medium text-sm tracking-[-0.6%]">
                            Search Results
                          </p>
                          <div className="px-3 mt-4">
                            <p className="text-xs text-gray-400">
                              No chats found matching &quot;{searchQuery}&quot;
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="px-5 mt-6">
                        <p className="text-[#9A9C9C] font-medium text-sm tracking-[-0.6%]">
                          Search Results ({allFilteredChats.length})
                        </p>
                        <div className="px-3">
                          {allFilteredChats.map(([chatId]) => (
                            <ChatItem
                              key={chatId}
                              chatId={chatId}
                              showInModal={true}
                              highlightSearchQuery={searchQuery}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                // Show default grouped chats
                <>
                  {renderChatGroup("Today", groupedChatRooms.today, true)}
                  {renderChatGroup(
                    "Yesterday",
                    groupedChatRooms.yesterday,
                    true
                  )}
                  {renderChatGroup(
                    "Previous 7 Days",
                    groupedChatRooms.previous7Days,
                    true
                  )}
                  {renderChatGroup(
                    "Previous 30 Days",
                    groupedChatRooms.previous30Days,
                    true
                  )}

                  {chatRooms.length === 0 && (
                    <div className="px-5 mt-6">
                      <p className="text-[#9A9C9C] font-medium text-sm tracking-[-0.6%]">
                        Recent Chats
                      </p>
                      <div className="px-3">
                        <li
                          suppressHydrationWarning
                          className="text-xs text-gray-400"
                        >
                          No chats yet.
                        </li>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
      <div
        className={`m-4 flex flex-1 flex-col rounded-[14px] bg-appGray z-50 transition-transform duration-200 md:static md:translate-x-0 fixed top-0 left-0  bottom-0  w-72 md:w-auto h-auto ${
          open === undefined
            ? ""
            : open
            ? "translate-x-0"
            : "-translate-x-[120%]"
        } md:block`}
        style={{ maxWidth: "320px" }}
      >
        {/* Close button for mobile */}

        {/* New Chat Button */}
        <div className="w-full gap-3 lg:gap-0   p-6 flex overflow-visible relative items-center">
          <Image
            src="/icons/marker.svg"
            alt="marker"
            width={14}
            height={47}
            className="absolute top-4 left-[1px]"
          />
          <button
            onClick={() => {
              if (showSearchModal) {
                setShowSearchModal(false);
              }
              if (showSavedPromptsModal) {
                setShowSavedPromptsModal(false);
              }

              router.push("/");
              if (onClose) {
                onClose();
              }
            }}
            className="flex cursor-pointer flex-1 justify-start px-5 items-center gap-3.5 min-h-[42px] rounded-[18px] bg-appDark"
          >
            <Image
              src="/icons/edit.svg"
              alt="New"
              width={15}
              height={15}
              className=""
            />
            <p className="text-sm  text-white font-semibold">New Chat</p>
          </button>
          {typeof open === "boolean" && (
            <button
              className="md:hidden  z-50 p-2 rounded-full bg-white text-black"
              aria-label="Close sidebar"
              onClick={onClose}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l8 8M6 14L14 6"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col flex-1 pl-8.5">
          {/* Navigation Items */}
          <nav className="mb-4 lg:mb-6">
            <ul className="space-y-1 lg:space-y-3">
              {navItems.map((item, index) => (
                // <button key={index} onClick={onClose}>
                <Link
                  className="flex py-1 items-center gap-2 rounded-lg hover:bg-[#1E1F1F] mr-2 cursor-pointer group"
                  href={
                    item.name === "Search" || item.name === "Saved Prompts"
                      ? "#"
                      : item.href
                  }
                  onClick={(e) => {
                    if (item.name === "Search") {
                      if (onClose) {
                        onClose();
                      }
                      e.preventDefault();
                      setShowSavedPromptsModal(false);
                      setShowSearchModal(!showSearchModal);
                    } else if (item.name === "Saved Prompts") {
                      if (onClose) {
                        onClose();
                      }
                      e.preventDefault();
                      setShowSearchModal(false);
                      setShowSavedPromptsModal(!showSavedPromptsModal);
                    } else {
                      setShowSearchModal(false);
                      setShowSavedPromptsModal(false);
                      if (onClose) {
                        onClose();
                      }
                    }
                  }}
                  key={index}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm text-white font-medium">
                    {item.name}
                  </span>
                </Link>
                // </button>
              ))}
            </ul>
          </nav>

          {/* Chat History Section */}
          <div className="relative h-max lg:mb-6 flex flex-col items-start py-2 pl-9">
            {/* Custom SVG Line with Rounded Ends */}
            <GradientLine />

            <ul
              suppressHydrationWarning
              className="hidden lg:flex w-[95%] flex-col gap-1"
            >
              {isClient && chatRooms.length > 0 ? (
                (() => {
                  let totalShown = 0;
                  const maxItems = 5;

                  return (
                    <>
                      {groupedChatRooms.today.length > 0 &&
                        totalShown < maxItems && (
                          <>
                            <div
                              suppressHydrationWarning
                              className="text-[9px] text-[#8A8A8A] mb-2"
                            >
                              Today
                            </div>
                            {groupedChatRooms.today
                              .slice(0, maxItems - totalShown)
                              .map(([chatId]) => {
                                totalShown++;
                                return (
                                  <ChatItem key={chatId} chatId={chatId} />
                                );
                              })}
                          </>
                        )}
                      {groupedChatRooms.yesterday.length > 0 &&
                        totalShown < maxItems && (
                          <>
                            <div className="text-[9px] text-[#8A8A8A] mb-2 mt-4">
                              Yesterday
                            </div>
                            {groupedChatRooms.yesterday
                              .slice(0, maxItems - totalShown)
                              .map(([chatId]) => {
                                totalShown++;
                                return (
                                  <ChatItem key={chatId} chatId={chatId} />
                                );
                              })}
                          </>
                        )}
                      {groupedChatRooms.previous7Days.length > 0 &&
                        totalShown < maxItems && (
                          <>
                            <div className="text-[9px] text-[#8A8A8A] mb-2 mt-4">
                              Previous 7 Days
                            </div>
                            {groupedChatRooms.previous7Days
                              .slice(0, maxItems - totalShown)
                              .map(([chatId]) => {
                                totalShown++;
                                return (
                                  <ChatItem key={chatId} chatId={chatId} />
                                );
                              })}
                          </>
                        )}
                      {groupedChatRooms.previous30Days.length > 0 &&
                        totalShown < maxItems && (
                          <>
                            <div className="text-[9px] text-[#8A8A8A] mb-2 mt-4">
                              Previous 30 Days
                            </div>
                            {groupedChatRooms.previous30Days
                              .slice(0, maxItems - totalShown)
                              .map(([chatId]) => {
                                totalShown++;
                                return (
                                  <ChatItem key={chatId} chatId={chatId} />
                                );
                              })}
                          </>
                        )}
                    </>
                  );
                })()
              ) : (
                <li suppressHydrationWarning className="text-xs text-gray-400">
                  {isClient ? "No chats yet." : "Loading..."}
                </li>
              )}
            </ul>
            <ul suppressHydrationWarning className="flex lg:hidden flex-col">
              {isClient && chatRooms.length > 0 ? (
                [
                  ...groupedChatRooms.today,
                  ...groupedChatRooms.yesterday,
                  ...groupedChatRooms.previous7Days,
                  ...groupedChatRooms.previous30Days,
                ]
                  .sort((a, b) => {
                    const aDate =
                      getMostRecentMessageDate(a[1])?.getTime() ?? 0;
                    const bDate =
                      getMostRecentMessageDate(b[1])?.getTime() ?? 0;
                    return bDate - aDate; // newest first
                  })
                  .slice(0, 3)
                  .map(([chatId]) => (
                    <ChatItem key={chatId} chatId={chatId} isMobile={true} />
                  ))
              ) : (
                <li suppressHydrationWarning className="text-xs text-gray-400">
                  {isClient ? "No chats yet." : "Loading..."}
                </li>
              )}
            </ul>
            {/* See all button for mobile - show only if there are more than 3 chats */}
            <div className="flex lg:hidden">
              {isClient && chatRooms.length > 3 && (
                <button
                  className="text-[10px] text-[#D9D9D9] hover:text-white mt-3 underline"
                  onClick={() => setShowSearchModal(true)}
                >
                  See all
                </button>
              )}
            </div>
            {/* See all button for desktop - show only if there are more than 5 chats */}
            <div className="hidden lg:block">
              {isClient && chatRooms.length > 5 && (
                <button
                  className="text-[10px] text-[#D9D9D9] hover:text-white mt-3 underline"
                  onClick={() => setShowSearchModal(true)}
                >
                  See all
                </button>
              )}
            </div>
          </div>

          {/* Bottom Links Section */}
          <div className=" bg-appDark absolute w-[80%] lg:w-auto bottom-2.5 lg:bottom-5 lg:mr-6 rounded-[12px] p-4 ">
            <Link href={"https://exyra.ai"} className="flex py-2 items-center">
              <p className="text-xs text-white">About Exyra</p>
              <Image src="/icons/arrow.svg" alt="arr" width={20} height={20} />
            </Link>
            <Link
              href={"https://docs.exyra.ai"}
              className="flex py-2 items-center"
            >
              <p className="text-xs text-white">Exyra Docs</p>
              <Image src="/icons/arrow.svg" alt="arr" width={20} height={20} />
            </Link>
            <div className="flex py-2 gap-[29px] items-center">
              <p className="text-xs text-white">Connect</p>
              <div className="flex gap-3   items-center">
                {socialLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Image
                      src={link.icon}
                      alt={`${link.name} icon`}
                      width={14}
                      height={14}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
