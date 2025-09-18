"use client";
import ConnectWalletModal from "@/components/ConnectWalletModal";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Toast from "@/components/Toast";
import { ToolRenderer } from "@/components/ToolRenderer";
import { useChatRoomsMessages } from "@/hooks/useChatRoomsMessages";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useSavedPrompts } from "@/hooks/useSavedPrompts";
import {
  useCopilotAdditionalInstructions,
  useCopilotChat,
  // internal context gives access to registered actions & their render fns
  useCopilotContext,
  useCopilotMessagesContext,
} from "@copilotkit/react-core";
import {
  ActionExecutionMessage,
  ResultMessage,
  Role,
  TextMessage,
} from "@copilotkit/runtime-client-gql";
import { useAppKitAccount } from "@reown/appkit/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { BaseMessage, CombinedToolCall } from "../../../../types";
import dynamic from "next/dynamic";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  checkDailyReset,
  loadRewardsFromDb,
  recordChatMessage,
  selectChatMessageCount,
  selectDailyMessageLimit,
  setWallet,
} from "@/store/rewardsSlice";
import Uniswap from "@/agents/Uniswap";
import Aave from "@/agents/Aave";
import Knc from "@/agents/Knc";
import AlchemyAgent from "@/agents/Alchemy";
import Binance from "@/agents/Binance";
import Bybit from "@/agents/Bybit";
import { getToolIcon } from "@/utils/constants";

const Lido = dynamic(() => import("@/agents/Lido"), {
  ssr: false,
});
const Bridge = dynamic(() => import("@/agents/Bridge"), {
  ssr: false,
});

const Page = () => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { address } = useAppKitAccount();
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const promptFromUrl = searchParams.get("prompt");
  const { getMessages, saveChatRoomMessages } = useChatRoomsMessages();
  const { savePrompt, isPromptSaved, loadSavedPrompts, deletePromptByContent } =
    useSavedPrompts();
  const [, setSavedPrompts] = useState<Set<string>>(new Set());
  const [copiedMessages, setCopiedMessages] = useState<Set<string>>(new Set());
  const { copyToClipboard, isError, message } = useCopyToClipboard({
    timeout: 2000,
    successMessage: "Copied to clipboard!",
  });
  const messages = getMessages(id);
  const { visibleMessages, appendMessage, isLoading } = useCopilotChat({
    id: id,
    makeSystemMessage: () =>
      `You are Agent Exyra, a specialized assistant for guiding users in their DeFi journey. 
     Always check if one of the available DeFi tools can be used to answer the user’s request. 
     - If a relevant tool is available, use it directly and explain the result clearly. 
     - If no matching tool is available, explain that this feature is not yet supported and guide the user toward other trusted DeFi resources (e.g., CoinGecko, Uniswap, Lido, Aave, KyberSwap official docs). 
     Stay accurate, concise, and transparent about what you can and cannot do.`,

    // initialMessages: messages,
  });
  // Rewards / daily limit state
  const dispatch = useAppDispatch();
  const count = useAppSelector(selectChatMessageCount);
  const limit = useAppSelector(selectDailyMessageLimit);
  const effectiveCount = Math.min(count, limit);
  // Access actions registry (includes render / renderAndWait transformed actions)
  // Access registered actions (casting to any since internal types not exported fully)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { actions: registeredActions } = useCopilotContext() as any;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { setMessages } = useCopilotMessagesContext();
  // Track whether we've hydrated the Copilot context for the current chat id
  const [isHydratedForId, setIsHydratedForId] = useState(false);
  // Guard to ensure initial prompt from URL is processed only once (React Strict Mode runs effects twice in dev)
  const initialPromptProcessedRef = useRef(false);

  // const handleSendMessage = () => {
  //   console.log(id, "Chat-Id");
  // };

  const sendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    // Enforce daily limit here to keep logic in one place
    if (effectiveCount >= limit) return;
    appendMessage(new TextMessage({ content: trimmed, role: Role.User }));
    setInputValue("");
    // Single source of truth for counting
    dispatch(recordChatMessage());
  };

  const handleSendMessage = () => {
    // sendMessage performs limit check and increments count
    sendMessage(inputValue);
  };

  // Create a display-only version of messages that combines tool calls for UI
  const getDisplayMessages = () => {
    const displayMessages: BaseMessage[] = [];
    const toolCallsMap = new Map<
      string,
      {
        action?: ActionExecutionMessage;
        result?: ResultMessage;
      }
    >();

    // Process messages for display only
    for (const message of visibleMessages) {
      const messageType =
        (message as BaseMessage)?.type || message.constructor.name;

      if (messageType === "ActionExecutionMessage") {
        const actionMsg = message as unknown as ActionExecutionMessage;
        if (!toolCallsMap.has(actionMsg.id)) {
          toolCallsMap.set(actionMsg.id, {});
        }
        toolCallsMap.get(actionMsg.id)!.action = actionMsg;
        // Debug: log tool call arguments
        // console.log(
        //   "[TOOL CALL] ActionExecutionMessage:",
        //   actionMsg.name,
        //   "Arguments:",
        //   actionMsg.arguments
        // );
      } else if (messageType === "ResultMessage") {
        const resultMsg = message as unknown as ResultMessage;
        const actionId = resultMsg.actionExecutionId;
        if (!toolCallsMap.has(actionId)) {
          toolCallsMap.set(actionId, {});
        }
        toolCallsMap.get(actionId)!.result = resultMsg;
        // console.log(
        //   "[TOOL CALL] ResultMessage:",
        //   "ActionExecutionId:",
        //   actionId,
        //   "Response:",
        //   resultMsg.result
        // );
      } else if (messageType === "TextMessage") {
        // Add text messages directly
        displayMessages.push(message as BaseMessage);
      }
    }

    // Add combined tool calls for display
    toolCallsMap.forEach((toolCall) => {
      if (toolCall.action) {
        displayMessages.push({
          ...toolCall.action,
          type: "CombinedToolCall",
          result: toolCall.result,
          createdAt: toolCall.action.createdAt,
        } as CombinedToolCall);
      }
    });

    // Sort by creation time
    return displayMessages.sort((a, b) => {
      const aTime = new Date((a as BaseMessage).createdAt || "0").getTime();
      const bTime = new Date((b as BaseMessage).createdAt || "0").getTime();
      return aTime - bTime;
    });
  };

  const displayMessages = getDisplayMessages();

  // Identify the single currently active (latest) pending interactive action (renderAndWaitForResponse)
  const activeInteractiveActionId = React.useMemo(() => {
    let candidate: string | null = null;
    for (const msg of displayMessages) {
      const mType =
        (msg as BaseMessage)?.type || (msg as any).constructor?.name; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (mType === "CombinedToolCall" && !(msg as CombinedToolCall).result) {
        const actionEntry = Object.values(registeredActions || {}).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (a: any) => a.name === (msg as any).name
        ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (actionEntry?._isRenderAndWait) {
          // Because displayMessages is time-sorted ascending, keep updating to get latest pending
          candidate = (msg as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      }
    }
    return candidate;
  }, [displayMessages, registeredActions]);

  const renderToolMessage = (message: BaseMessage, index: number) => {
    const messageType =
      (message as BaseMessage)?.type || message.constructor.name;

    if (messageType === "CombinedToolCall") {
      const toolCall = message as CombinedToolCall;
      // console.log(toolCall, " Tool Call");
      const toolIcon = getToolIcon(toolCall.name);
      const name = toolCall.name.split("_")[0];
      // Attempt to find the corresponding registered action by name (actions keyed by internal id)
      const actionEntry = Object.values(registeredActions || {}).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a.name === toolCall.name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;

      let interactiveElement: React.ReactElement | null = null;
      const isPending = !toolCall.result;
      const isInteractive = actionEntry?._isRenderAndWait;
      const isActive =
        isPending && isInteractive && toolCall.id === activeInteractiveActionId;
      if (isActive && typeof actionEntry?.render === "function") {
        try {
          // Only the active pending interactive action gets executed with 'executing' status
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const args = (toolCall as any).arguments || {};
          interactiveElement = actionEntry.render({
            name: name, // strip any suffixes
            args,
            status: "executing",
            result: undefined,
            messageId: toolCall.id,
          });
        } catch (e) {
          console.warn(
            "Failed to render interactive action UI for",
            toolCall.name,
            e
          );
        }
      }

      // Check if the result contains error indicators
      const resultContent = toolCall.result?.result || "";
      let isError = false;

      if (typeof resultContent === "string") {
        // Check for our backend error patterns - comprehensive coverage
        isError =
          resultContent.includes("❌") ||
          resultContent.includes("Error") ||
          resultContent.includes("error") ||
          resultContent.includes("timeout") ||
          resultContent.includes("failed") ||
          resultContent.includes("not found") ||
          resultContent.includes("couldn't find") ||
          resultContent.includes("unable to");
      } else if (typeof resultContent === "object" && resultContent !== null) {
        // Check if it's an error object with error: true or success: false
        isError =
          (resultContent as Record<string, unknown>)?.error === true ||
          (resultContent as Record<string, unknown>)?.success === false;
      }

      const isSuccess = toolCall.result?.status?.code === "Success" && !isError;
      const hasResult = !!toolCall.result;

      // console.log(toolCall.result, " Tool Call Result");

      // Show loading state or result
      if (!hasResult) {
        return (
          <div
            key={`tool-${message.id}-${index}`}
            className="flex  relative items-center gap-2 mb-2 text-gray-400 text-sm"
          >
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            {toolIcon && (
              <Image
                src={toolIcon}
                alt={`${name} icon`}
                width={16}
                height={16}
                className="rounded-sm"
              />
            )}
            <span>{name}...</span>
            {interactiveElement && (
              <div className="mt-10 absolute left-0 top-full w-max z-50">
                {interactiveElement}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={`tool-${message.id}-${index}`}
          className="flex relative items-center gap-2 mb-2 text-gray-300 text-sm"
        >
          <span
            className={
              isSuccess
                ? "text-green-400 text-[8px]"
                : "text-red-400 text-[8px]"
            }
          >
            {isSuccess ? "✓" : "✗"}
          </span>
          {toolIcon && (
            <Image
              src={toolIcon}
              alt={`${name} icon`}
              width={16}
              height={16}
              className="rounded-sm"
            />
          )}
          <span className="text-xs text-[#d9d9d9]">{name}</span>
          {/* Completed actions do not render interactive UI */}
        </div>
      );
    }

    return null;
  };

  const renderTextMessage = (message: BaseMessage, index: number) => {
    const textMessage = message as TextMessage;
    const isUser = textMessage.role === Role.User;
    const messageContent = textMessage.content || "";
    const promptIsSaved = isUser && isPromptSaved(messageContent);
    const messageId = message.id || `message-${index}`;
    const isMessageCopied = copiedMessages.has(messageId);

    const handleSavePrompt = () => {
      if (promptIsSaved) {
        // Remove prompt from saved prompts
        deletePromptByContent(messageContent);
        setSavedPrompts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(messageContent.trim());
          return newSet;
        });
        console.log("Prompt removed from saved!");
      } else {
        savePrompt(messageContent);
        setSavedPrompts((prev) => new Set([...prev, messageContent.trim()]));
        console.log("Prompt saved!");
      }
    };

    const handleCopyMessage = async () => {
      await copyToClipboard(messageContent);
      // Add this message to copied messages set
      setCopiedMessages((prev) => new Set([...prev, messageId]));
      // Remove from copied messages after 2 seconds
      setTimeout(() => {
        setCopiedMessages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }, 2000);
    };

    return (
      <div
        key={`text-${message.id}-${index}`}
        className={`flex flex-col  w-max max-w-[90vw] mb-4 lg:mb-0 lg:max-w-[600px]  relative ${
          isUser ? "self-end" : "self-start"
        }`}
      >
        <div
          className={`rounded-bl-[20px]  rounded-br-[20px] rounded-tl-[20px]  ${
            isUser ? "px-4 py-[15px] " : ""
          }  ${isUser ? "bg-[#2e2e2e] " : ""} text-[#D9D9D9]`}
        >
          {isUser ? (
            <p className="text-sm">{messageContent}</p>
          ) : (
            <MarkdownRenderer content={messageContent} />
          )}
        </div>
        <div
          className={`gap-2 mt-2 w-full ${
            isUser ? "justify-end" : "justify-start"
          }  flex items-center`}
        >
          {isUser && (
            <button
              className={`cursor-pointer relative flex items-center justify-center hover:opacity-70 transition-opacity`}
              onClick={handleSavePrompt}
              title={promptIsSaved ? "Prompt already saved" : "Save prompt"}
            >
              {promptIsSaved ? (
                <Image
                  src={"/icons/save-filled.svg"}
                  width={16}
                  height={16}
                  alt="save"
                />
              ) : (
                <Image
                  src={"/icons/save.svg"}
                  width={16}
                  height={16}
                  alt="save"
                />
              )}
            </button>
          )}
          {!isLoading && (
            <button
              className="cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center relative w-4 h-4"
              onClick={handleCopyMessage}
              title="Copy message"
            >
              {isMessageCopied ? (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    duration: 0.3,
                  }}
                  className="text-green-400 text-xs font-bold flex items-center justify-center"
                  style={{ fontSize: "12px" }}
                >
                  ✓
                </motion.div>
              ) : (
                <Image
                  src={"/icons/copy.svg"}
                  width={16}
                  height={16}
                  alt="copy"
                />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };
  // console.log(messages, " Messages");
  // console.log(visibleMessages, "Visible Messages");
  // console.log(displayMessages, "Display Messages");

  // Debug: Log message types to understand the structure
  // console.log(
  //   "Message types:",
  //   visibleMessages.map((msg, i) => ({
  //     index: i,
  //     id: msg.id,
  //     type: (msg as BaseMessage)?.type || msg.constructor.name,
  //     role: (msg as TextMessage)?.role,
  //     actionId: (msg as unknown as ActionExecutionMessage)?.id,
  //     resultActionId: (msg as unknown as ResultMessage)?.actionExecutionId,
  //   }))
  // );
  // console.log(ContextMessages, "Context Messages");

  // Ensure message context is scoped per chat room id to avoid cross-room overwrites
  useEffect(() => {
    // On id change, clear current visible messages to avoid saving them under the new id
    setIsHydratedForId(false);
    setMessages([]);
    // Reset the initial prompt processed guard when navigating to a new chat id
    initialPromptProcessedRef.current = false;

    // If we have stored messages for this chat id and no prompt in URL, hydrate them
    if (messages.length > 0 && !promptFromUrl) {
      const cleanMessages = messages.filter((msg) => {
        const messageType = (msg as BaseMessage)?.type || msg.constructor.name;
        return messageType === "TextMessage";
      });
      console.log(
        `Hydrating chat ${id} messages: ${messages.length} -> ${cleanMessages.length}`
      );
      if (cleanMessages.length > 0) {
        setMessages(cleanMessages);
      }
      setIsHydratedForId(true);
    }
    // If promptFromUrl exists, another effect will handle sending; we'll set hydrated there
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Ensure daily reset runs on mount/render
    dispatch(checkDailyReset());
    // Load saved prompts state on mount
    const savedPromptsData = loadSavedPrompts();
    const savedContents = new Set(
      savedPromptsData.map((p) => p.content.trim())
    );
    setSavedPrompts(savedContents);
  }, [loadSavedPrompts, dispatch]);

  useEffect(() => {
    // Only save if we have messages for the current chat id and after hydration
    // Add a debounce to prevent too frequent saves
    if (isHydratedForId && !isLoading && visibleMessages.length > 0) {
      const saveTimeout = setTimeout(() => {
        // Only save TextMessages to prevent any tool call corruption
        const cleanMessagesToSave = visibleMessages.filter((msg) => {
          const messageType =
            (msg as BaseMessage)?.type || msg.constructor.name;
          // Only keep TextMessages - completely avoid saving tool calls
          return messageType === "TextMessage";
        });

        console.log(
          `Saving chat ${id} only text messages: ${visibleMessages.length} -> ${cleanMessagesToSave.length}`
        );
        saveChatRoomMessages(id, cleanMessagesToSave);
      }, 500); // Debounce saves by 500ms

      return () => clearTimeout(saveTimeout);
    }
    //eslint-disable-next-line
  }, [isHydratedForId, isLoading, visibleMessages.length, id]);

  useEffect(() => {
    // Handle initial prompt from URL (for new chats)
    if (
      promptFromUrl &&
      !initialPromptProcessedRef.current &&
      isHydratedForId
    ) {
      // Mark as processed immediately to avoid duplicate sends in Strict Mode
      initialPromptProcessedRef.current = true;
      console.log(
        `Sending initial prompt from URL for chat ${id}: ${promptFromUrl}`
      );
      // Ensure we start fresh for this id
      setMessages([]);
      // sendMessage will enforce limit and increment
      sendMessage(promptFromUrl);
      setIsHydratedForId(true);
      // Clean up URL parameter after sending the message
      router.replace(`/chat/${id}`, { scroll: false });
      return;
    }
    // If there's no prompt and we didn't hydrate from storage (no messages), mark as hydrated to allow saving new user messages
    if (visibleMessages.length === 0 && !isHydratedForId) {
      setIsHydratedForId(true);
    }
    //eslint-disable-next-line
  }, [promptFromUrl, id, isHydratedForId]);

  // Ensure rewards persistence works on chat page: set wallet when available
  useEffect(() => {
    if (address) {
      dispatch(setWallet(address));
      dispatch(loadRewardsFromDb(address));
    }
  }, [address, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  useCopilotAdditionalInstructions({
    instructions: `Whenever you are asked about swap routes and information, use the GettingRoutes tool.
    ${
      address
        ? `The connected wallet address is: ${address}. When using Balance_Bybit or Balance_Binance actions, always use this address as the user_address parameter.`
        : "No wallet is currently connected. Prompt the user to connect their wallet before using exchange balance actions."
    }`,
  });

  return (
    <div className="  h-[88vh] mb-4 px-4 pt-4 relative flex flex-col">
      <ConnectWalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      {/* Toast for copy error feedback */}
      <Toast
        isVisible={isError}
        message={message || "Failed to copy"}
        type="error"
        position="top"
      />

      <div
        className="flex flex-col h-[78vh] scrollbar-hide   overflow-y-auto pr-2"
        style={{ minHeight: 0 }}
      >
        {displayMessages.map((message, idx) => {
          const messageType =
            (message as BaseMessage)?.type || message.constructor.name;

          // Render combined tool messages
          if (messageType === "CombinedToolCall") {
            return renderToolMessage(message, idx);
          }

          // Render text messages (User and Assistant)
          if (messageType === "TextMessage" || (message as TextMessage).role) {
            return renderTextMessage(message, idx);
          }

          // Skip other message types (individual ActionExecution and Result messages are now combined)
          return null;
        })}

        {/* AI Thinking Animation */}
        {isLoading && (
          <div className="flex flex-col  w-max max-w-[600px] self-start">
            <div className="flex items-center gap-3 py-4">
              <div className="flex items-center gap-1">
                <motion.div
                  className="w-2 h-2 bg-[#A9A0FF] rounded-full"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-[#A9A0FF] rounded-full"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-[#A9A0FF] rounded-full"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input section */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="bg-[#303131] w-full mt-5 lg:mt-1 lg:w-full rounded-[24px] p-5"
      >
        <textarea
          className="w-full min-h-[10px] bg-transparent text-white placeholder:text-[#DAD0D0] font-medium border-none focus:outline-none resize-none"
          value={inputValue}
          placeholder="Ask anything ..."
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!address) {
                setShowModal(true);
                return;
              } else {
                handleSendMessage();
              }
            }
          }}
        ></textarea>
        <div className="flex w-full justify-end items-center">
          <div className="flex items-center gap-3 relative">
            {/* Message Counter and Tooltip */}
            <div className="flex items-center gap-1 relative">
              <span className="text-[#888888] text-[8px] lg:text-xs font-medium select-none">
                {effectiveCount} / {limit} messages
              </span>
              <div className="relative flex items-center group">
                <button
                  className="focus:outline-none"
                  tabIndex={0}
                  aria-label="Message limit info"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                  }}
                >
                  <div className="relative w-[12px] lg:w-[14px] h-[12px] lg:h-[14px]">
                    <Image src={"/icons/help.svg"} fill alt="info" />
                  </div>
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-[120%] right-1/2 translate-x-1/2 z-20 hidden group-hover:flex group-focus-within:flex flex-col items-center">
                  <div className="bg-[#282A2E] -translate-x-[30%] text-[#d9d9d9] text-xs lg:text-sm rounded-[12px] px-4 lg:px-8 py-3 lg:py-6 shadow-lg w-[250px] lg:w-[342px] text-center font-medium whitespace-pre-line">
                    Daily message limit: 30 messages per wallet.Resets daily at
                    midnight UTC
                  </div>
                  {/* Tooltip pointer */}
                  <svg
                    width="32"
                    height="16"
                    viewBox="0 0 32 16"
                    className="-mt-1"
                    style={{ display: "block" }}
                  >
                    <polygon points="16,16 0,0 32,0" fill="#282A2E" />
                  </svg>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!address) {
                  setShowModal(true);
                  return;
                } else {
                  handleSendMessage();
                }
              }}
              className="bg-[#A9A0FF] cursor-pointer active:scale-90 hover:bg-primary duration-500 w-[32px] h-[32px] lg:w-[42px] lg:h-[42px] rounded-full flex justify-center items-center"
            >
              <div className="relative w-[22px] lg:w-[24px] h-[22px] lg:h-[24px]">
                <Image
                  src={"/icons/arrow-right.svg"}
                  alt="arrow"
                  width={24}
                  height={24}
                />
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      <ToolRenderer />
      <Uniswap />
      <Aave />
      <Knc />
      <Lido />
      <Bridge />
      <AlchemyAgent />
      <Binance />
      <Bybit />
      {/* <PancakeSwap /> */}

      {/* <Curve /> */}
    </div>
  );
};

export default Page;
