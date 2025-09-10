#!/usr/bin/env tsx

/**
 * Script to initialize the strategies collection in MongoDB
 * Run with: bunx tsx scripts/init-strategies.ts
 */

import { config } from "dotenv";
import { initializeStrategiesCollection } from "../src/actions/strategies";

// Load environment variables
config({ path: ".env" });

async function main() {
  try {
    console.log("Initializing strategies collection...");
    const result = await initializeStrategiesCollection();

    if (result.success) {
      console.log("✅", result.message);
    } else {
      console.error("❌", result.message);
      if (result.error) {
        console.error("Error details:", result.error);
      }
    }
  } catch (error) {
    console.error("Failed to initialize strategies collection:", error);
  }
}

main().catch(console.error);
