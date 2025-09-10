// Example usage of Redis utilities
// This file demonstrates how to use the Redis utility functions

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

// Example: Initialize the Extended Creep strategy
export async function setupExtendedCreep() {
  try {
    // Test Redis connection first
    const isConnected = await testRedisConnection();
    if (!isConnected) {
      throw new Error("Redis connection failed");
    }

    // Initialize the strategy
    await initializeExtendedCreepStrategy();
    console.log("✅ Extended Creep strategy set up successfully!");

    return true;
  } catch (error) {
    console.error("❌ Failed to set up strategy:", error);
    return false;
  }
}

// Example: Get the complete strategy
export async function getExtendedCreepStrategy() {
  try {
    const strategy = await getCompleteStrategy("extended-creep");
    if (strategy) {
      console.log("📊 Extended Creep Strategy:", {
        title: strategy.title,
        pnl: strategy.pnl,
        followers: strategy.followers,
        totalTrades: strategy.history?.length || 0,
      });
      return strategy;
    } else {
      console.log("❌ Strategy not found");
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching strategy:", error);
    return null;
  }
}

// Example: Add a new trade to the strategy
export async function addNewTrade() {
  try {
    const newTrade: TradeHistoryEntry = {
      coin: "BTC",
      entryPrice: 45000,
      exitPrice: 47000,
      entryDate: new Date().toLocaleDateString(),
      exitDate: new Date().toLocaleDateString(),
      pnl: 4.44,
    };

    await updateStrategyHistory("extended-creep", newTrade);
    console.log("✅ New trade added successfully!");

    return true;
  } catch (error) {
    console.error("❌ Failed to add trade:", error);
    return false;
  }
}

// Example: Update strategy performance metrics
export async function updatePerformance() {
  try {
    await updateStrategyMetrics("extended-creep", {
      pnl: 15.2,
      apy: 5.1,
      followers: [], // Now an array of wallet addresses
      performanceMetrics: {
        sharpeRatio: 1.3,
        winRate: 78,
        maxDrawdown: 7.2,
      },
    });

    console.log("✅ Performance metrics updated!");
    return true;
  } catch (error) {
    console.error("❌ Failed to update metrics:", error);
    return false;
  }
}

// Example: Add a follower to a strategy
export async function addFollowerDemo() {
  try {
    const testWalletAddress = "0x1234567890123456789012345678901234567890";

    const result = await updateStrategyFollowers(
      "extended-creep",
      testWalletAddress
    );

    if (result.success) {
      console.log("✅ Follower added:", result.message);

      // Get updated followers count
      const followersCount = await getStrategyFollowersCount("extended-creep");
      console.log("📊 Total followers:", followersCount);

      return true;
    } else {
      console.error("❌ Failed to add follower:", result.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Error adding follower:", error);
    return false;
  }
}

// Example: Get followers information
export async function getFollowersInfo(strategyId: string = "extended-creep") {
  try {
    const strategy = await getCompleteStrategy(strategyId);
    const followersCount = await getStrategyFollowersCount(strategyId);

    console.log(`📊 Strategy: ${strategy?.title}`);
    console.log(`👥 Followers count: ${followersCount}`);
    console.log(`📋 Followers list:`, strategy?.followers || []);

    return {
      strategy: strategy?.title,
      followersCount,
      followersList: strategy?.followers || [],
    };
  } catch (error) {
    console.error("❌ Error getting followers info:", error);
    return null;
  }
}

// Example: Complete workflow
export async function demoWorkflow() {
  console.log("🚀 Starting Redis Strategy Demo...\n");

  // 1. Set up the strategy
  await setupExtendedCreep();

  // 2. Get the strategy
  await getExtendedCreepStrategy();

  // 3. Add a new trade
  await addNewTrade();

  // 4. Update performance metrics
  await updatePerformance();

  // 5. Add a follower
  await addFollowerDemo();

  // 6. Get followers information
  await getFollowersInfo();

  // 7. Get updated strategy
  console.log("\n📈 Updated Strategy:");
  await getExtendedCreepStrategy();

  console.log("\n✨ Demo completed!");
}

// Example: Initialize any strategy from constants
export async function setupStrategyFromConstants(
  strategyTitle: string,
  customId?: string
) {
  try {
    const isConnected = await testRedisConnection();
    if (!isConnected) {
      throw new Error("Redis connection failed");
    }

    await initializeStrategyFromConstants(strategyTitle, customId);
    console.log(`✅ ${strategyTitle} strategy set up successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set up ${strategyTitle} strategy:`, error);
    return false;
  }
}

// Example: Initialize all strategies at once
export async function setupAllStrategies() {
  try {
    const isConnected = await testRedisConnection();
    if (!isConnected) {
      throw new Error("Redis connection failed");
    }

    await initializeAllStrategiesFromConstants();
    console.log("✅ All strategies set up successfully!");
    return true;
  } catch (error) {
    console.error("❌ Failed to set up all strategies:", error);
    return false;
  }
}

const redisDemo = {
  setupExtendedCreep,
  getExtendedCreepStrategy,
  addNewTrade,
  updatePerformance,
  addFollowerDemo,
  getFollowersInfo,
  demoWorkflow,
  setupStrategyFromConstants,
  setupAllStrategies,
};

export default redisDemo;
