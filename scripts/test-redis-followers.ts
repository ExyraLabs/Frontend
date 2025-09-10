#!/usr/bin/env tsx

/**
 * Test script to verify Redis followers functionality
 * Run with: bunx tsx scripts/test-redis-followers.ts
 */

import { config } from "dotenv";
import redisDemo from "../src/utils/redisDemo";

// Load environment variables
config({ path: ".env" });

async function testRedisFollowersSystem() {
  console.log("🧪 Testing Redis followers functionality...\n");

  try {
    // Run the complete demo workflow
    await redisDemo.demoWorkflow();

    console.log("\n🎉 Redis followers system test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testRedisFollowersSystem().catch(console.error);
