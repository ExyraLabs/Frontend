"use client";
import Image from "next/image";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  selectTasksArray,
  selectTierInfo,
  selectPoints,
  loadRewardsFromDb,
  setWallet,
  saveRewardsToDb,
} from "../../store/rewardsSlice";
import { useRewardIntegrations } from "../../hooks/useRewardIntegrations";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import telegramAuth from "@use-telegram-auth/client";
import {
  authenticateTwitter,
  authenticateDiscord,
  authenticateTelegram,
  getUserSocial,
} from "../../actions/verify";
import { useAppKitAccount } from "@reown/appkit/react";
import toast from "react-hot-toast";

const TIERS = [
  {
    name: "Bronze",
    url: "/icons/bronze.svg",
  },
  {
    name: "Silver",
    url: "/icons/silver.svg",
  },
  {
    name: "Gold",
    url: "/icons/gold.svg",
  },
];

const CATEGORIES = ["Agent", "Chain", "Others"];

// Removed old static badge arrays; now tasks drive UI.
const Explore = () => {
  // Public envs for client-side use
  const DISCORD_INVITE_URL =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/";
  const TELEGRAM_INVITE_URL =
    process.env.NEXT_PUBLIC_TELEGRAM_INVITE_URL || "https://t.me/";
  const TELEGRAM_GROUP_ID = process.env.NEXT_PUBLIC_TELEGRAM_GROUP_ID;
  // Tab concept removed for now; could be reintroduced for filtering categories.
  const [selectedTier, setSelectedTier] = useState("All Tiers");
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectTasksArray);
  const { current: currentTier, next: nextTier } =
    useAppSelector(selectTierInfo);
  const points = useAppSelector(selectPoints);
  const { address } = useAppKitAccount();
  // const { handleSocialConnected } = useRewardIntegrations(address);
  const { data: session, status } = useSession();
  const params = useSearchParams();

  // Load persisted rewards when wallet connects
  useEffect(() => {
    if (address) {
      dispatch(setWallet(address));
      dispatch(loadRewardsFromDb(address));
    }
  }, [address, dispatch]);

  // Handle return from OAuth (Twitter/Discord) similar to legacy tasks page
  const authHandledRef = useRef(false);
  useEffect(() => {
    const from = params.get("from");
    const processAuth = async () => {
      if (!address || !session || status !== "authenticated") return;
      if (authHandledRef.current) return; // guard against double invoke (StrictMode or re-renders)
      authHandledRef.current = true;
      try {
        let res: { ok: boolean; message: string } | undefined;
        const userSession = session.user as unknown as {
          x_id?: number;
          x_username?: string;
          discord_id?: number;
          discord_username?: string;
        };
        if (userSession?.x_id) {
          res = await authenticateTwitter(
            address,
            userSession.x_id,
            userSession.x_username || ""
          );
        } else if (userSession?.discord_id) {
          res = await authenticateDiscord(
            address,
            userSession.discord_id,
            userSession.discord_username || ""
          );
        }
        if (res) {
          if (res.ok) {
            // Only show toast if it actually newly connected, not if already linked ('Connected')
            if (res.message !== "Connected") {
              toast.success(res.message || "Connected");
            }
            // handleSocialConnected(
            //   userSession?.x_id ? "x" : "discord",
            //   "connect"
            // );
          } else {
            toast.error(res.message || "Connection failed");
          }
        }
      } catch {
        toast.error("Authentication failed");
      } finally {
        // always sign out to clear provider session cache so user can connect next provider
        await signOut({ redirect: false });
      }
    };
    if (from === "external" && status === "authenticated") {
      processAuth();
    }
    return () => undefined;
  }, [session, status, address, params]);

  // Connect helpers
  const startTwitterConnect = () => {
    toast.loading("Connecting X...", { id: "connect-x" });
    signIn("twitter", { callbackUrl: "/rewards?from=external" });
  };
  const startDiscordConnect = () => {
    toast.loading("Connecting Discord...", { id: "connect-discord" });
    signIn("discord", {
      callbackUrl: "/rewards?from=external",
      redirect: true,
    });
  };
  // Validate user membership in Discord guild using server API
  const verifyDiscordMembership = useCallback(async (): Promise<boolean> => {
    // Prefer session values if present (right after OAuth)
    let discord_id: number | undefined;
    let discord_username: string | undefined;

    if (address) {
      // Get stored profile by wallet via server action
      try {
        const payload = await getUserSocial(address);
        if (payload?.ok && payload?.user) {
          discord_id = payload.user.discord_id as unknown as number | undefined;
          discord_username = payload.user.discord_username as
            | string
            | undefined;
        }
      } catch {}
    }

    if (!discord_id && !discord_username) {
      toast.error("Connect Discord first");
      return false;
    }
    try {
      const res = await fetch("/api/discord/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: discord_id,
          username: discord_username,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `Validation failed (${res.status})`;
        toast.error(msg);
        return false;
      }
      return !!data.exists;
    } catch {
      toast.error("Could not validate Discord membership");
      return false;
    }
  }, [address]);
  const startTelegramConnect = async () => {
    if (!address) return;
    if (!TELEGRAM_GROUP_ID) {
      toast.error("Missing Telegram bot id configuration");
      return;
    }
    try {
      const res = await telegramAuth("8370799417", {
        windowFeatures: { popup: true },
      });
      const auth = await authenticateTelegram(address, res.id, res.username);
      if (auth.ok) {
        toast.success(auth.message || "Telegram connected");
      } else {
        toast.error(auth.message || "Telegram connect failed");
      }
    } catch {
      toast.error("Telegram authentication failed");
    }
  };

  // Validate Telegram group membership via server API
  const verifyTelegramMembership = useCallback(async (): Promise<boolean> => {
    if (!address) {
      toast.error("Connect wallet first");
      return false;
    }
    // We rely on stored tg_id from server action getUserSocial
    let tg_id: number | undefined;
    try {
      const payload = await getUserSocial(address);
      if (payload?.ok && payload?.user) {
        tg_id = payload.user.tg_id as unknown as number | undefined;
      }
    } catch {}

    if (!tg_id) {
      toast.error("Connect Telegram first");
      return false;
    }

    try {
      const res = await fetch("/api/telegram/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: tg_id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `Validation failed (${res.status})`;
        toast.error(msg);
        return false;
      }
      return !!data.exists;
    } catch {
      toast.error("Could not validate Telegram membership");
      return false;
    }
  }, [address]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (
        selectedCategory !== "All Categories" &&
        t.category.toLowerCase() !==
          selectedCategory.toLowerCase().replace("s", "")
      )
        return false;
      if (selectedTier !== "All Tiers") {
        // show tasks that could help reach selected tier (simplified)
        if (selectedTier === "Bronze") return true;
        if (selectedTier === "Silver") return true;
        if (selectedTier === "Gold") return true;
      }
      return true;
    });
  }, [tasks, selectedCategory, selectedTier]);

  const agentTasks = filteredTasks.filter(
    (t) => t.category === "defi" || t.category === "chat"
  );
  const socialTasks = filteredTasks.filter((t) => t.category === "social");
  // const referralTasks = filteredTasks.filter((t) => t.category === "referral");

  return (
    <div className="flex  flex-col lg:flex-row flex-1 gap-8 px-4 scrollbar-hide overflow-y-scroll w-full">
      <div className="lg:w-[100%]">
        <div className="flex justify-between mb-4 mt-2 items-center">
          {/* Page Title */}
          <h1 className=" text-[24px] lg:text-[28px] font-bold text-white">
            Rewards
          </h1>
          <p className="text-sm bg-[#262727] rounded-[17px] text-primary px-6 py-2.5 ">
            Reward System
          </p>
        </div>
        <p className="text-[#eee6e6] my-6">
          Earn Exyra Stones by completing tasks: social connections, chatting
          with the agent, and on-chain DeFi actions. Stones determine your tier
          & future reward share. (Coming Soon)
        </p>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-[#262727] rounded-2xl p-4 flex flex-col min-w-[160px]">
            <span className="text-xs text-[#B5B5B5]">Total Points</span>
            <span className="text-2xl font-bold text-primary">{points}</span>
          </div>
          <div className="bg-[#262727] rounded-2xl p-4 flex flex-col min-w-[160px]">
            <span className="text-xs text-[#B5B5B5]">Current Tier</span>
            <span className="text-lg font-semibold text-white flex items-center gap-2">
              <Image
                src={currentTier.icon}
                alt={currentTier.name}
                width={20}
                height={20}
              />{" "}
              {currentTier.name}
            </span>
            {nextTier && (
              <span className="text-[10px] text-[#888] mt-1">
                {nextTier.minPoints - points} pts to {nextTier.name}
              </span>
            )}
          </div>
        </div>
        {/* Filters */}
        {/* <div className="flex items-center">
          <div className="relative  flex flex-col items-center w-full md:w-[180px]">
            <button
              onClick={() => {
                setShowTierDropdown((prev) => !prev);
                if (showCategoryDropdown) {
                  setShowCategoryDropdown(false);
                }
              }}
              className="flex items-center justify-between bg-[#262727] border border-[#3A3B3B] h-[44px] w-full text-[#F5F7F7] px-4 rounded-[40px] text-sm focus:outline-none hover:bg-[#3A3B3B] duration-300 cursor-pointer relative"
            >
              <span className="flex  text-[10px] lg:text-sm items-center gap-2">
                {selectedTier}
              </span>
              <Image
                src={"/icons/arrow-left.svg"}
                alt="arrow"
                className={`${
                  showTierDropdown ? "rotate-180" : ""
                } duration-300 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]`}
                width={11}
                height={11}
              />
            </button>
            {showTierDropdown && (
              <div className="absolute left-0  top-full mt-2 w-[200px] md:w-[232px] bg-[#303131] rounded-[10px] p-5 shadow-lg z-50  max-h-[320px] overflow-y-auto">
                {TIERS.map((tier) => (
                  <div
                    key={tier.name}
                    className="group flex items-center gap-2 px-4 py-2 text-white text-sm cursor-pointer rounded-[14px] w-full text-left transition-colors"
                    onClick={() => {
                      setSelectedTier(tier.name);
                      setShowTierDropdown(false);
                    }}
                  >
                    <Image
                      src={tier.url}
                      alt={tier.name}
                      width={18}
                      height={18}
                    />
                    <span className="flex-1">{tier.name}</span>
                    <span className="relative flex items-center">
                      <span className="w-5 h-5 rounded-[4px] border-[0.5px] border-[#343535] flex items-center justify-center bg-[#262727] group-hover:bg-[#353637] transition-colors">
                        {selectedTier === tier.name && (
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
          <div className="relative ml-4  flex flex-col items-center w-full md:w-[180px]">
            <button
              onClick={() => {
                setShowCategoryDropdown((prev) => !prev);
                if (showTierDropdown) {
                  setShowTierDropdown(false);
                }
              }}
              className="flex items-center justify-between bg-[#262727] border border-[#3A3B3B] h-[44px] w-full text-[#F5F7F7] px-4 rounded-[40px] text-sm focus:outline-none hover:bg-[#3A3B3B] duration-300 cursor-pointer relative"
            >
              <span className="flex text-[10px] lg:text-sm items-center gap-2">
                {selectedCategory}
              </span>
              <Image
                src={"/icons/arrow-left.svg"}
                alt="arrow"
                className={`${
                  showCategoryDropdown ? "rotate-180" : ""
                } duration-300 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]`}
                width={11}
                height={11}
              />
            </button>
            {showCategoryDropdown && (
              <div className="absolute left-0  top-full mt-2 w-[200px] md:w-[232px] bg-[#303131] rounded-[10px] p-5 shadow-lg z-50  max-h-[320px] overflow-y-auto">
                {CATEGORIES.map((category) => (
                  <div
                    key={category}
                    className="group flex items-center gap-2 px-4 py-2 text-white text-sm cursor-pointer rounded-[14px] w-full text-left transition-colors"
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <span className="flex-1">{category}</span>
                    <span className="relative flex items-center">
                      <span className="w-5 h-5 rounded-[4px] border-[0.5px] border-[#343535] flex items-center justify-center bg-[#262727] group-hover:bg-[#353637] transition-colors">
                        {selectedCategory === category && (
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
          <button
            className={`text-xs ml-auto transition-colors w-full md:w-auto text-center ${
              selectedTier === "All Tiers" &&
              selectedCategory === "All Categories"
                ? "text-[#3A3B3B] cursor-default"
                : "text-[#B5B5B5] hover:text-white cursor-pointer"
            }`}
            onClick={() => {
              if (selectedTier !== "All Tiers") {
                setSelectedTier("All Tiers");
              }
              if (selectedCategory !== "All Categories") {
                setSelectedCategory("All Categories");
              }
            }}
            disabled={
              selectedTier === "All Tiers" &&
              selectedCategory === "All Categories"
            }
          >
            Clear Filters
          </button>
        </div> */}
        {/* Social Tasks */}
        <section className="mt-4 max-w-[70%]">
          <h5 className="font-semibold text-[#F5F7F7] mb-2">Social Tasks</h5>
          <div className="flex flex-wrap gap-4">
            {socialTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                // onClaim={() => {
                //   dispatch(claimTask({ taskId: task.id }));
                //   dispatch(saveRewardsToDb());
                //   toast.success("Reward claimed");
                // }}
                // onActivate={() => {
                //   const phase = task.socialPhase;
                //   if (!phase || !task.socialPlatform) return;
                //   if (phase === "engage") {
                //     if (task.socialPlatform === "x") {
                //       window.open("https://x.com/ExyraLabs", "_blank");
                //       handleSocialConnected("x", "engage");
                //       toast.success("Engagement recorded");
                //     } else if (task.socialPlatform === "discord") {
                //       toast.loading("Validating Discord membership...", {
                //         id: "discord-engage",
                //       });
                //       verifyDiscordMembership().then((exists) => {
                //         if (exists) {
                //           toast.success("Discord membership verified", {
                //             id: "discord-engage",
                //           });
                //           handleSocialConnected("discord", "engage");
                //         } else {
                //           toast.dismiss("discord-engage");
                //           window.open(DISCORD_INVITE_URL, "_blank");
                //           toast(
                //             "Join the Discord, then click again to verify."
                //           );
                //         }
                //       });
                //     } else if (task.socialPlatform === "telegram") {
                //       toast.loading("Validating Telegram membership...", {
                //         id: "telegram-engage",
                //       });
                //       verifyTelegramMembership().then((exists) => {
                //         if (exists) {
                //           toast.success("Telegram membership verified", {
                //             id: "telegram-engage",
                //           });
                //           handleSocialConnected("telegram", "engage");
                //         } else {
                //           toast.dismiss("telegram-engage");
                //           window.open(TELEGRAM_INVITE_URL, "_blank");
                //           toast(
                //             "Join the Telegram, then click again to verify."
                //           );
                //         }
                //       });
                //     }
                //   } else if (phase === "connect") {
                //     if (task.socialPlatform === "x") startTwitterConnect();
                //     else if (task.socialPlatform === "discord")
                //       startDiscordConnect();
                //     else if (task.socialPlatform === "telegram")
                //       startTelegramConnect();
                //   }
                // }}
              />
            ))}
            {socialTasks.length === 0 && (
              <p className="text-xs text-[#888]">No tasks</p>
            )}
          </div>
        </section>
        {/* Defi Tasks */}
        <section className="mt-6 max-w-[70%] pb-6   ">
          <h5 className="font-semibold text-[#F5F7F7] mb-2">
            Chat & DeFi Tasks
          </h5>
          <div className="flex flex-wrap gap-4">
            {agentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                // onClaim={() => {
                //   dispatch(claimTask({ taskId: task.id }));
                //   dispatch(saveRewardsToDb());
                // }}
              />
            ))}
            {agentTasks.length === 0 && (
              <p className="text-xs text-[#888]">No tasks</p>
            )}
          </div>
        </section>
        {/* <section className="mt-6">
          <h5 className="font-semibold text-[#F5F7F7] mb-2">Referral Tasks</h5>
          <div className="flex flex-wrap gap-4">
            {referralTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClaim={() => {
                  dispatch(claimTask({ taskId: task.id }));
                  dispatch(saveRewardsToDb());
                }}
              />
            ))}
            {referralTasks.length === 0 && (
              <p className="text-xs text-[#888]">No tasks</p>
            )}
          </div>
        </section> */}
      </div>
      {/* <div className="flex-1 bg-[#303131] flex flex-col justify-center items-center rounded-[20px] h-[596px]">
        <div className="w-[173px] h-[173px] relative">
          <Image src={"/images/illustration.svg"} fill alt="ill" />
        </div>
        <h5 className="font-bold mt-4 text-[#F5F7F7]">
          Select a Badge to view details.
        </h5>
        <p className="text-[#EEE6E6] max-w-[341px] text-sm text-center mt-2">
          Learn how to earn each badge, unlock higher tiers and increase your
          reward
        </p>
      </div> */}
    </div>
  );
};

export default Explore;

import type { RewardTask } from "../../types/rewards";
interface TaskCardProps {
  task: RewardTask & {
    progress?: number;
    claimed?: boolean;
    completed?: boolean;
    target?: number;
  };
  onClaim?: () => void;
  onActivate?: () => void; // click to perform action (social connect/engage)
}
const TaskCard = ({ task, onClaim, onActivate }: TaskCardProps) => {
  const completed = task.completed;
  const claimable = completed && !task.claimed;
  const progress = task.target
    ? Math.min(task.progress || 0, task.target)
    : undefined;
  return (
    <div
      className="w-[180px] relative h-[170px] rounded-2xl bg-[#262727] p-3 flex flex-col justify-between hover:bg-[#303131] transition-colors"
      onClick={() => {
        if (!claimable && onActivate) onActivate();
      }}
    >
      <div>
        <h6 className="text-white text-sm font-semibold leading-snug line-clamp-2">
          {task.title}
        </h6>
        <p className="text-[10px] mt-1 text-[#AAA] line-clamp-3">
          {task.description}
        </p>
      </div>
      {progress !== undefined && (
        <div className="w-full h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-primary"
            style={{
              width: `${task.target ? (progress / task.target) * 100 : 0}%`,
            }}
          />
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-primary text-xs font-bold">+{task.points}</span>
        {claimable && (
          <button
            onClick={onClaim}
            className="text-[10px] cursor-pointer bg-primary/80 hover:bg-primary px-2 py-1 rounded-full text-white"
          >
            Claim
          </button>
        )}
        {task.claimed && (
          <span
            className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-emerald-500/90 shadow-md"
            title="Task completed"
          >
            <svg
              className="w-2.5 h-2.5 text-white"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3.5 8.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
};
