import {
  createSlice,
  PayloadAction,
  createSelector,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { RewardTask, TierDefinition } from "../types/rewards";
import {
  getUserRewardsState,
  updateUserRewardsState,
} from "../actions/rewards";

// Static tier definitions
const tiers: TierDefinition[] = [
  { id: "bronze", name: "Bronze", minPoints: 0, icon: "/icons/bronze.svg" },
  { id: "silver", name: "Silver", minPoints: 500, icon: "/icons/silver.svg" },
  { id: "gold", name: "Gold", minPoints: 1500, icon: "/icons/gold.svg" },
];

// Randomized point helper (stable per id in session)
const randomPointCache: Record<string, number> = {};
const randPoints = (id: string, min: number, max: number) => {
  if (randomPointCache[id] != null) return randomPointCache[id];
  const v = Math.floor(Math.random() * (max - min + 1)) + min;
  randomPointCache[id] = v;
  return v;
};

// Two‑phase social tasks: connect (authorize/link) then engage (follow/join). Gmail omitted.
// We keep chat & defi tasks; referral retained.
const baseTasks: RewardTask[] = [
  // X (Twitter)
  {
    id: "social-x-connect",
    title: "Connect X Account",
    description: "Authorize and link your X (Twitter) account.",
    category: "social",
    points: randPoints("social-x-connect", 12, 20),
    socialPlatform: "x",
    socialPhase: "connect",
    actionType: "connect",
  },
  {
    id: "social-x-engage",
    title: "Follow on X",
    description: "Follow the official X account. Updates 00:00 UTC",
    category: "social",
    points: randPoints("social-x-engage", 22, 36),
    socialPlatform: "x",
    socialPhase: "engage",
    actionType: "follow",
  },
  // Discord
  {
    id: "social-discord-connect",
    title: "Connect Discord",
    description: "Link your Discord account.",
    category: "social",
    points: randPoints("social-discord-connect", 12, 20),
    socialPlatform: "discord",
    socialPhase: "connect",
    actionType: "connect",
  },
  {
    id: "social-discord-engage",
    title: "Join Discord Server",
    description: "Join the community Discord server.",
    category: "social",
    points: randPoints("social-discord-engage", 22, 36),
    socialPlatform: "discord",
    socialPhase: "engage",
    actionType: "join",
  },
  // Telegram
  {
    id: "social-telegram-connect",
    title: "Connect Telegram",
    description: "Link your Telegram account.",
    category: "social",
    points: randPoints("social-telegram-connect", 12, 20),
    socialPlatform: "telegram",
    socialPhase: "connect",
    actionType: "connect",
  },
  {
    id: "social-telegram-engage",
    title: "Join Telegram Group",
    description: "Join the official Telegram group.",
    category: "social",
    points: randPoints("social-telegram-engage", 22, 36),
    socialPlatform: "telegram",
    socialPhase: "engage",
    actionType: "join",
  },
  // Chat progression
  {
    id: "chat-first-message",
    title: "Send your first message",
    description: "Ask the agent any question.",
    category: "chat",
    points: 20,
    maxCompletions: 1,
    progress: 0,
    target: 1,
    actionType: "send-message",
  },
  {
    id: "chat-10-messages",
    title: "Engage with 10 messages",
    description: "Have a deeper conversation with the agent.",
    category: "chat",
    points: 70,
    maxCompletions: 1,
    progress: 0,
    target: 10,
    actionType: "send-message",
  },
  // DeFi placeholder tasks
  {
    id: "defi-first-swap",
    title: "Execute first swap",
    description: "Complete one token swap via the platform.",
    category: "defi",
    points: 150,
    maxCompletions: 1,
    progress: 0,
    target: 1,
    actionType: "swap",
  },
  {
    id: "defi-first-stake",
    title: "Stake tokens",
    description: "Stake any supported token.",
    category: "defi",
    points: 200,
    maxCompletions: 1,
    progress: 0,
    target: 1,
    actionType: "stake",
  },
  {
    id: "defi-first-lend",
    title: "Lend tokens",
    description: "Supply tokens to a lending protocol to earn interest.",
    category: "defi",
    points: 180,
    maxCompletions: 1,
    progress: 0,
    target: 1,
    actionType: "lend",
  },
  {
    id: "referral-invite",
    title: "Refer a friend",
    description: "Invite a friend who completes at least one action.",
    category: "referral",
    points: 250,
    maxCompletions: 5,
    progress: 0,
    target: 1,
  },
];

export interface RewardsSliceState {
  points: number;
  tasks: Record<
    string,
    RewardTask & { progress: number; completions: number; claimed: boolean }
  >;
  chatMessageCount: number;
  dailyMessageLimit: number;
  lastResetDate: string | null; // ISO date (yyyy-mm-dd)
  // Guard against accidental double increments within the same instant (e.g., Strict Mode quirks)
  lastIncrementMs?: number | null;
  wallet?: string | null; // current user wallet for persistence
  saving?: boolean;
  lastSaveError?: string | null;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const buildInitialState = (): RewardsSliceState => {
  const tasks: RewardsSliceState["tasks"] = {};
  baseTasks.forEach((t) => {
    tasks[t.id] = {
      ...t,
      progress: t.progress ?? 0,
      completions: 0,
      claimed: false,
    };
  });
  return {
    points: 0,
    tasks,
    chatMessageCount: 0,
    dailyMessageLimit: 30,
    lastResetDate: todayISO(),
    lastIncrementMs: null,
    wallet: null,
    saving: false,
    lastSaveError: null,
  };
};

const initialState: RewardsSliceState = buildInitialState();

interface DefiActionPayload {
  actionType: RewardTask["actionType"];
}

export const rewardsSlice = createSlice({
  name: "rewards",
  initialState,
  reducers: {
    setWallet(state, action: PayloadAction<string | null>) {
      state.wallet = action.payload;
    },
    checkDailyReset(state) {
      const today = todayISO();
      if (state.lastResetDate !== today) {
        state.lastResetDate = today;
        if (!state.wallet) {
          state.chatMessageCount = 0;
        }
        state.lastIncrementMs = null;
        // reset repeatable tasks (progress & claimed if daily?) - for now only progress of chat tasks
        Object.values(state.tasks).forEach((task) => {
          if (task.category === "chat") {
            task.progress = 0;
            task.claimed = false;
            task.completions = 0; // daily tasks reset completions
          }
        });
      }
    },
    recordChatMessage(state) {
      const now = Date.now();
      if (
        typeof state.lastIncrementMs === "number" &&
        now - state.lastIncrementMs <= 200
      ) {
        // Ignore duplicate increments that occur within 200ms window
        return;
      }
      if (state.chatMessageCount >= state.dailyMessageLimit) return; // cap
      state.chatMessageCount += 1;
      state.lastIncrementMs = now;
      // Update chat tasks progress
      Object.values(state.tasks).forEach((task) => {
        if (task.actionType === "send-message" && !task.completed) {
          task.progress = Math.min(
            (task.progress ?? 0) + 1,
            task.target ?? Infinity
          );
          if (task.progress >= (task.target ?? 0)) {
            task.completed = true;
          }
        }
      });
    },
    completeDefiAction(state, action: PayloadAction<DefiActionPayload>) {
      const task = Object.values(state.tasks).find(
        (t) => t.actionType === action.payload.actionType
      );
      if (task && !task.completed) {
        task.completed = true;
      }
    },
    // Utility to hydrate from persisted source later
    hydrate(state, action: PayloadAction<Partial<RewardsSliceState>>) {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadRewardsFromDb.pending, (state) => {
        state.saving = true;
        state.lastSaveError = null;
      })
      .addCase(loadRewardsFromDb.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          // merge persisted minimal structure into runtime tasks
          const persisted = action.payload;
          // Keep the most recent reset date (avoid regressing to an older persisted value)
          if (persisted.lastResetDate) {
            const current = state.lastResetDate ?? todayISO();
            state.lastResetDate =
              new Date(persisted.lastResetDate) >= new Date(current)
                ? persisted.lastResetDate
                : current;
          }
          // Do not decrease the local count if we've already incremented for this session.
          if (typeof persisted.chatMessageCount === "number") {
            state.chatMessageCount = Math.max(
              state.chatMessageCount,
              persisted.chatMessageCount
            );
          }
        }
      })
      .addCase(loadRewardsFromDb.rejected, (state, action) => {
        state.saving = false;
        state.lastSaveError = action.error.message || "Failed to load rewards";
      })
      .addCase(saveRewardsToDb.pending, (state) => {
        state.saving = true;
        state.lastSaveError = null;
      })
      .addCase(saveRewardsToDb.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveRewardsToDb.rejected, (state, action) => {
        state.saving = false;
        state.lastSaveError = action.error.message || "Failed to save";
      });
  },
});

export const {
  setWallet,
  recordChatMessage,
  completeDefiAction,
  checkDailyReset,
  hydrate,
} = rewardsSlice.actions;

// Async thunks
export const loadRewardsFromDb = createAsyncThunk(
  "rewards/load",
  async (wallet: string, { rejectWithValue }) => {
    try {
      const data = await getUserRewardsState(wallet);
      return data;
    } catch (e: unknown) {
      const err = e as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const saveRewardsToDb = createAsyncThunk(
  "rewards/save",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { rewards: RewardsSliceState };
      const { wallet } = state.rewards;
      if (!wallet) return;
      // build minimal persisted shape
      const persisted = {
        lastResetDate: state.rewards.lastResetDate || todayISO(),
        chatMessageCount: state.rewards.chatMessageCount,
      };
      await updateUserRewardsState(wallet, persisted);
    } catch (e: unknown) {
      const err = e as Error;
      return rejectWithValue(err.message);
    }
  }
);

// Selectors
export const selectRewardsState = (s: { rewards: RewardsSliceState }) =>
  s.rewards;
export const selectPoints = (s: { rewards: RewardsSliceState }) =>
  s.rewards.points;
export const selectChatMessageCount = (s: { rewards: RewardsSliceState }) =>
  s.rewards.chatMessageCount;
export const selectDailyMessageLimit = (s: { rewards: RewardsSliceState }) =>
  s.rewards.dailyMessageLimit;

export const selectTasksArray = createSelector(selectRewardsState, (state) =>
  Object.values(state.tasks)
);

export const selectTierInfo = createSelector(selectRewardsState, (state) => {
  const points = state.points;
  const current =
    [...tiers].reverse().find((t) => points >= t.minPoints) || tiers[0];
  const next = tiers.find(
    (t) => t.minPoints > current.minPoints && points < t.minPoints
  );
  return { current, next, tiers };
});

export default rewardsSlice.reducer;
