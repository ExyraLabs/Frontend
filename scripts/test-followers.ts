#!/usr/bin/env tsx

/**
 * Test script to verify followers functionality
 * Run with: MONGODB_CONNECTION_STRING="..." bunx tsx scripts/test-followers.ts
 */

import { config } from "dotenv";
import {
  getStrategyById,
  updateStrategyFollowers,
} from "../src/actions/strategies";

// Load environment variables
config({ path: ".env" });

async function testFollowersSystem() {
  try {
    console.log("🧪 Testing followers functionality...\n");

    // Test 1: Get Extended Creep strategy
    console.log("1. Getting Extended Creep strategy...");
    const strategyResult = await getStrategyById("extended-creep");

    if (!strategyResult.success) {
      console.error("❌ Failed to get strategy:", strategyResult.message);
      return;
    }

    console.log("✅ Strategy found:", strategyResult.strategy?.title);
    console.log(
      "   Current followers:",
      strategyResult.strategy?.followers?.length || 0
    );

    // Test 2: Add a test follower
    console.log("\n2. Adding test follower...");
    const testWalletAddress = "0x1234567890123456789012345678901234567890";

    const updateResult = await updateStrategyFollowers({
      strategyId: "extended-creep",
      walletAddress: testWalletAddress,
    });

    if (!updateResult.success) {
      console.error("❌ Failed to add follower:", updateResult.message);
      return;
    }

    console.log("✅ Follower update:", updateResult.message);

    // Test 3: Verify follower was added
    console.log("\n3. Verifying follower was added...");
    const verifyResult = await getStrategyById("extended-creep");

    if (verifyResult.success && verifyResult.strategy) {
      const followers = verifyResult.strategy.followers || [];
      const hasTestFollower = followers.includes(
        testWalletAddress.toLowerCase()
      );

      console.log("✅ Total followers:", followers.length);
      console.log("✅ Test follower added:", hasTestFollower ? "Yes" : "No");

      if (hasTestFollower) {
        console.log("🎉 Followers system working correctly!");
      } else {
        console.log("❌ Test follower not found in followers array");
      }
    }

    // Test 4: Try adding same follower again (should not duplicate)
    console.log("\n4. Testing duplicate prevention...");
    const duplicateResult = await updateStrategyFollowers({
      strategyId: "extended-creep",
      walletAddress: testWalletAddress,
    });

    console.log("✅ Duplicate test result:", duplicateResult.message);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testFollowersSystem().catch(console.error);
