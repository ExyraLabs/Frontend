"use server";

import {
  initializeExtendedCreepStrategy,
  initializeStrategyFromConstants,
  initializeAllStrategiesFromConstants,
  getCompleteStrategy,
  updateStrategyHistory,
  updateStrategyMetrics,
  updateStrategyFollowers,
  getStrategyFollowersCount,
  testRedisConnection,
} from "@/utils/redis";
import type { TradeHistoryEntry } from "@/types/strategy";

export async function initializeStrategy() {
  try {
    const isConnected = await testRedisConnection();
    if (!isConnected) {
      return { success: false, error: "Redis connection failed" };
    }

    await initializeExtendedCreepStrategy();
    return {
      success: true,
      message: "Extended Creep strategy initialized successfully!",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getStrategy(strategyId: string) {
  try {
    const strategy = await getCompleteStrategy(strategyId);
    if (!strategy) {
      return { success: false, error: "Strategy not found" };
    }
    return { success: true, data: strategy };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function addTrade(strategyId: string, trade: TradeHistoryEntry) {
  try {
    await updateStrategyHistory(strategyId, trade);
    return { success: true, message: "Trade added successfully!" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateMetrics(
  strategyId: string,
  metrics: {
    pnl?: number;
    apy?: number;
    followers?: string[]; // Array of wallet addresses
    performanceMetrics?: Record<string, number>;
  }
) {
  try {
    await updateStrategyMetrics(strategyId, metrics);
    return { success: true, message: "Metrics updated successfully!" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function initializeStrategyFromConstantsAction(
  strategyTitle: string,
  customId?: string
) {
  try {
    const isConnected = await testRedisConnection();
    if (!isConnected) {
      return { success: false, error: "Redis connection failed" };
    }

    await initializeStrategyFromConstants(strategyTitle, customId);
    return {
      success: true,
      message: `Strategy "${strategyTitle}" initialized successfully!`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function initializeAllStrategies() {
  try {
    const isConnected = await testRedisConnection();
    if (!isConnected) {
      return { success: false, error: "Redis connection failed" };
    }

    await initializeAllStrategiesFromConstants();
    return {
      success: true,
      message: "All strategies initialized successfully!",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function addFollowerToStrategy(
  strategyId: string,
  walletAddress: string
) {
  try {
    const result = await updateStrategyFollowers(strategyId, walletAddress);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getFollowersCount(strategyId: string) {
  try {
    const count = await getStrategyFollowersCount(strategyId);
    return { success: true, count };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      count: 0,
    };
  }
}
