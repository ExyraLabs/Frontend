// import "server-only";
"use server";
import Redis from "ioredis";
import type {
  Strategy,
  StrategyCore,
  StrategyDynamic,
  TradeHistoryEntry,
} from "@/types/strategy";
import { STRATS_CARDS } from "./constants";

// Create a new Redis instance
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Basic Redis operations
export async function get(
  key: string,
  namespace: string = ""
): Promise<string | null> {
  const redisKey = namespace ? `${namespace}:${key}` : key;
  return redis.get(redisKey);
}

export async function getAll(
  namespace: string = ""
): Promise<Record<string, string> | null> {
  const pattern = namespace ? `${namespace}:*` : "*";
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return {};

  const values = await redis.mget(keys);
  const result: Record<string, string> = {};

  keys.forEach((key, index) => {
    const value = values[index];
    if (value !== null) {
      const cleanKey = namespace ? key.replace(`${namespace}:`, "") : key;
      result[cleanKey] = value;
    }
  });

  return result;
}

export async function set(
  key: string,
  value: string,
  namespace: string = ""
): Promise<string> {
  const redisKey = namespace ? `${namespace}:${key}` : key;
  return redis.set(redisKey, value);
}

export async function del(
  key: string,
  namespace: string = ""
): Promise<number> {
  const redisKey = namespace ? `${namespace}:${key}` : key;
  return redis.del(redisKey);
}

export async function exists(
  key: string,
  namespace: string = ""
): Promise<boolean> {
  const redisKey = namespace ? `${namespace}:${key}` : key;
  const result = await redis.exists(redisKey);
  return result === 1;
}

// Strategy-specific operations
const STRATEGY_NAMESPACE = "strategies";
const STRATEGY_HISTORY_NAMESPACE = "strategy-history";

STRATEGY_NAMESPACE; // Set strategy core data
export async function setStrategyCore(
  strategyId: string,
  strategyCore: StrategyCore
): Promise<string> {
  return set(strategyId, JSON.stringify(strategyCore), STRATEGY_NAMESPACE);
}

// Get strategy core data
export async function getStrategyCore(
  strategyId: string
): Promise<StrategyCore | null> {
  const data = await get(strategyId, STRATEGY_NAMESPACE);
  if (!data) return null;
  try {
    return JSON.parse(data) as StrategyCore;
  } catch (error) {
    console.error("Error parsing strategy core data:", error);
    return null;
  }
}

// Set strategy dynamic data
export async function setStrategyDynamic(
  strategyId: string,
  strategyDynamic: StrategyDynamic
): Promise<string> {
  return set(
    strategyId,
    JSON.stringify(strategyDynamic),
    STRATEGY_HISTORY_NAMESPACE
  );
}

// Get strategy dynamic data
export async function getStrategyDynamic(
  strategyId: string
): Promise<StrategyDynamic | null> {
  const data = await get(strategyId, STRATEGY_HISTORY_NAMESPACE);
  if (!data) return null;
  try {
    return JSON.parse(data) as StrategyDynamic;
  } catch (error) {
    console.error("Error parsing strategy dynamic data:", error);
    return null;
  }
}

// Get complete strategy (combines core and dynamic data)
export async function getCompleteStrategy(
  strategyId: string
): Promise<Strategy | null> {
  const [coreData, dynamicData] = await Promise.all([
    getStrategyCore(strategyId),
    getStrategyDynamic(strategyId),
  ]);

  if (!coreData) return null;

  return {
    ...coreData,
    ...dynamicData,
  } as Strategy;
}

// Set complete strategy (splits into core and dynamic)
export async function setCompleteStrategy(
  strategyId: string,
  strategy: Strategy
): Promise<void> {
  const {
    pnl,
    apy,
    history,
    performanceMetrics,
    followers,
    alerts,
    ...coreData
  } = strategy;

  const dynamicData: StrategyDynamic = {
    pnl,
    apy,
    history,
    performanceMetrics,
    followers,
    alerts,
  };

  await Promise.all([
    setStrategyCore(strategyId, coreData),
    setStrategyDynamic(strategyId, dynamicData),
  ]);
}

// Update strategy history (most frequently updated)
export async function updateStrategyHistory(
  strategyId: string,
  newTrade: TradeHistoryEntry
): Promise<void> {
  const dynamicData = (await getStrategyDynamic(strategyId)) || {};
  const currentHistory = dynamicData.history || [];

  const updatedHistory = [...currentHistory, newTrade];

  await setStrategyDynamic(strategyId, {
    ...dynamicData,
    history: updatedHistory,
  });
}

// Update strategy performance metrics
export async function updateStrategyMetrics(
  strategyId: string,
  metrics: Partial<StrategyDynamic>
): Promise<void> {
  const dynamicData = (await getStrategyDynamic(strategyId)) || {};

  await setStrategyDynamic(strategyId, {
    ...dynamicData,
    ...metrics,
  });
}

// Get all strategy IDs
export async function getAllStrategyIds(): Promise<string[]> {
  const allData = await getAll(STRATEGY_NAMESPACE);
  if (!allData) return [];
  return Object.keys(allData);
}

// Delete strategy
export async function deleteStrategy(strategyId: string): Promise<void> {
  await Promise.all([
    del(strategyId, STRATEGY_NAMESPACE),
    del(strategyId, STRATEGY_HISTORY_NAMESPACE),
  ]);
}

// Initialize Extended Creep strategy
export async function initializeExtendedCreepStrategy(): Promise<void> {
  const strategyId = "extended-creep";

  // Get the Extended Creep strategy from constants
  const extendedCreepStrategy = STRATS_CARDS.find(
    (strategy) => strategy.title === "Extended Creep"
  );

  if (!extendedCreepStrategy) {
    throw new Error("Extended Creep strategy not found in constants");
  }

  // Split the strategy data into core and dynamic parts
  const {
    pnl,
    apy,
    history,
    performanceMetrics,
    followers,
    alerts,
    ...coreData
  } = extendedCreepStrategy;

  // Core data (rarely changes)
  const strategyCore: StrategyCore = {
    ...coreData,
    visibility: coreData.visibility as "public" | "private" | undefined,
  };

  // Dynamic data (frequently updated)
  const dynamicData: StrategyDynamic = {
    pnl,
    apy,
    history,
    performanceMetrics,
    followers,
    alerts,
  };

  await Promise.all([
    setStrategyCore(strategyId, strategyCore),
    setStrategyDynamic(strategyId, dynamicData),
  ]);

  console.log("Extended Creep strategy initialized successfully!");
}

// Generic function to initialize any strategy from constants
export async function initializeStrategyFromConstants(
  strategyTitle: string,
  strategyId?: string
): Promise<void> {
  const strategy = STRATS_CARDS.find((s) => s.title === strategyTitle);

  if (!strategy) {
    throw new Error(`Strategy "${strategyTitle}" not found in constants`);
  }

  const id = strategyId || strategyTitle.toLowerCase().replace(/\s+/g, "-");

  // Split the strategy data into core and dynamic parts
  const {
    pnl,
    apy,
    history,
    performanceMetrics,
    followers,
    alerts,
    ...coreData
  } = strategy;

  // Core data (rarely changes)
  const strategyCore: StrategyCore = {
    ...coreData,
    visibility: coreData.visibility as "public" | "private" | undefined,
  };

  // Dynamic data (frequently updated)
  const dynamicData: StrategyDynamic = {
    pnl,
    apy,
    history,
    performanceMetrics,
    followers,
    alerts,
  };

  await Promise.all([
    setStrategyCore(id, strategyCore),
    setStrategyDynamic(id, dynamicData),
  ]);

  console.log(
    `Strategy "${strategyTitle}" initialized successfully with ID: ${id}`
  );
}

// Initialize all strategies from constants
export async function initializeAllStrategiesFromConstants(): Promise<void> {
  try {
    const initPromises = STRATS_CARDS.map((strategy) =>
      initializeStrategyFromConstants(strategy.title)
    );

    await Promise.all(initPromises);
    console.log(
      `Successfully initialized ${STRATS_CARDS.length} strategies from constants`
    );
  } catch (error) {
    console.error("Error initializing strategies:", error);
    throw error;
  }
}

// Update strategy followers - add user to followers array if not already present
export async function updateStrategyFollowers(
  strategyId: string,
  walletAddress: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    if (!strategyId || !walletAddress) {
      return {
        success: false,
        message: "Strategy ID and wallet address are required",
      };
    }

    // Get current dynamic data
    const dynamicData = (await getStrategyDynamic(strategyId)) || {};
    const currentFollowers = dynamicData.followers || [];

    // Check if already following
    const normalizedAddress = walletAddress.toLowerCase();
    if (currentFollowers.includes(normalizedAddress)) {
      return {
        success: true,
        message: "Already following",
      };
    }

    // Add to followers array
    const updatedFollowers = [...currentFollowers, normalizedAddress];

    await setStrategyDynamic(strategyId, {
      ...dynamicData,
      followers: updatedFollowers,
    });

    return {
      success: true,
      message: "Added to followers",
    };
  } catch (error) {
    console.error("Error updating strategy followers:", error);
    return {
      success: false,
      message: "Failed to update followers",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get strategy followers count
export async function getStrategyFollowersCount(
  strategyId: string
): Promise<number> {
  try {
    const dynamicData = await getStrategyDynamic(strategyId);
    return dynamicData?.followers?.length || 0;
  } catch (error) {
    console.error("Error getting followers count:", error);
    return 0;
  }
}

// Utility function to check Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    console.log("redis connected");
    return true;
  } catch (error) {
    console.error("Redis connection failed:", error);
    return false;
  }
}
