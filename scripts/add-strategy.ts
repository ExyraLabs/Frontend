#!/usr/bin/env tsx

/**
 * Script to add (or update) a single strategy in MongoDB from STRATS_CARDS
 * Usage examples:
 *   bunx tsx scripts/add-strategy.ts --title "Overly Sold"
 *   bunx tsx scripts/add-strategy.ts --title "AI Tokens" --update
 */

import { config } from "dotenv";
import clientPromise from "../src/lib/mongodb";
import { STRATS_CARDS } from "../src/utils/constants";
import type { Strategy } from "../src/types/strategy";

// Load environment variables
config({ path: ".env" });

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function toStrategyId(title: string) {
  return title.toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  const title = getArg("title");
  const updateExisting = hasFlag("update") || hasFlag("upsert");

  if (!title) {
    console.error("❌ Missing required --title <Strategy Title> argument.");
    console.log("Available strategy titles:");
    STRATS_CARDS.forEach((s) => console.log(` - ${s.title}`));
    process.exit(1);
  }

  const card = STRATS_CARDS.find((s) => s.title === title) as
    | Strategy
    | undefined;
  if (!card) {
    console.error(
      `❌ Strategy with title '${title}' not found in STRATS_CARDS.`
    );
    console.log("Did you mean one of:");
    STRATS_CARDS.forEach((s) => console.log(` - ${s.title}`));
    process.exit(1);
  }

  const strategyDoc: Record<string, unknown> = {
    strategyId: toStrategyId(card.title),
    title: card.title,
    subtitle: card.subtitle,
    category: card.category,
    icon: card.icon,
    description: card.subtitle,
    tradeType: card.tradeType,
    riskLevel: card.riskLevel,
    status: card.status,
    startDate: card.startDate,
    endDate: card.endDate,
    compatibility: card.compatibility,
    exchanges: card.exchanges,
    supportedChains: card.supportedChains,
    author: card.author,
    followers: card.followers || [],
    visibility: card.visibility,
    features: card.features,
    notes: card.notes,
    prompts: card.prompts,
    chains: card.chains,
    tags: card.tags,
    history: card.history,
    entryCriterias: card.entryCriterias,
    exitCriteria: card.exitCriteria,
    pnl: card.pnl,
    apy: card.apy,
    performanceMetrics: card.performanceMetrics,
    fees: {
      trading: card.fees?.trading ?? 0.1,
      management: card.fees?.management ?? 0.05,
    },
    alerts: card.alerts || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const client = await clientPromise;
    const db = client.db();
    const strategiesCollection = db.collection("strategies");

    const existing = await strategiesCollection.findOne({
      strategyId: strategyDoc.strategyId,
    });
    if (existing) {
      if (!updateExisting) {
        console.error(
          `❌ Strategy '${strategyDoc.strategyId}' already exists. Use --update to overwrite fields.`
        );
        process.exit(1);
      }
      await strategiesCollection.updateOne(
        { strategyId: strategyDoc.strategyId },
        { $set: { ...strategyDoc, updatedAt: new Date() } }
      );
      console.log(`✅ Updated existing strategy '${strategyDoc.strategyId}'.`);
    } else {
      await strategiesCollection.insertOne(strategyDoc);
      console.log(`✅ Inserted new strategy '${strategyDoc.strategyId}'.`);
    }
  } catch (err) {
    console.error("❌ Failed to add strategy:", err);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
