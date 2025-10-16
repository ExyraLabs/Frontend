"use server";
import clientPromise from "@/lib/mongodb";
import type { Strategy } from "@/types/strategy";
import { STRATS_CARDS } from "@/utils/constants";
import {
  formatAllocationActivity,
  formatWithdrawalActivity,
} from "@/utils/activityFormatter";
import { calculateStrategyAUM } from "@/utils/aumCalculator";

// Interface for user strategy data
interface UserStrategy {
  strategyId: string;
  strategyName: string;
  funds: number;
  selectedExchange: "Bybit" | "Binance";
  dateAllocated: Date;
  status: "active" | "inactive";
  tradeHistory: TradeEntry[];
  performance: {
    totalPnl: number;
    totalTrades: number;
    winRate: number;
  };
}

interface TradeEntry {
  id: string;
  date: Date;
  type: "buy" | "sell";
  amount: number;
  entryPrice: number;
  entryDate: Date;
  qty: number;
  leverage: number;
  exitPrice: number;
  exitDate: Date;
  pnl: number;
  exchange: "Bybit" | "Binance";
  asset: string;
}

/**
 * Fetch user's strategies from database
 */
export async function getUserStrategies(walletAddress: string): Promise<{
  success: boolean;
  strategies?: UserStrategy[];
  message: string;
  error?: string;
}> {
  try {
    if (!walletAddress) {
      return {
        success: false,
        message: "Wallet address is required",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Find user by wallet address
    const user = await usersCollection.findOne({
      address: walletAddress.toLowerCase(),
    });

    if (!user) {
      return {
        success: true,
        strategies: [],
        message: "No strategies found for user",
      };
    }

    return {
      success: true,
      strategies: user.strategies || [],
      message: "Strategies retrieved successfully",
    };
  } catch (error) {
    console.error("Error fetching user strategies:", error);
    return {
      success: false,
      message: "Failed to fetch strategies",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add or update user strategy
 */
export async function allocateUserStrategy({
  walletAddress,
  strategyId,
  strategyName,
  allocatedFunds,
  selectedExchange,
}: {
  walletAddress: string;
  strategyId: string;
  strategyName: string;
  allocatedFunds: number;
  selectedExchange: "Bybit" | "Binance";
}): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    if (
      !walletAddress ||
      !strategyId ||
      !strategyName ||
      !allocatedFunds ||
      !selectedExchange
    ) {
      return {
        success: false,
        message: "Missing required fields",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // 1) Try to increment funds on an existing allocation (same strategyId + selectedExchange)
    const existingUpdate = await usersCollection.updateOne(
      {
        address: walletAddress.toLowerCase(),
        "strategies.strategyId": strategyId,
        "strategies.selectedExchange": selectedExchange,
      },
      {
        $inc: { "strategies.$.funds": Number(allocatedFunds) },
        $set: { "strategies.$.status": "active" },
      }
    );

    // 2) If no existing allocation was updated, push a new strategy entry (and upsert the user)
    if (existingUpdate.matchedCount === 0) {
      const newStrategy: UserStrategy = {
        strategyId,
        strategyName,
        funds: Number(allocatedFunds),
        selectedExchange,
        dateAllocated: new Date(),
        status: "active",
        tradeHistory: [],
        performance: {
          totalPnl: 0,
          totalTrades: 0,
          winRate: 0,
        },
      };

      await usersCollection.updateOne(
        { address: walletAddress.toLowerCase() },
        {
          $push: {
            strategies: newStrategy,
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as unknown as any,
          $setOnInsert: {
            address: walletAddress.toLowerCase(),
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    // Add allocation activity to the strategy
    const allocationActivity = formatAllocationActivity(
      walletAddress,
      Number(allocatedFunds)
    );
    await addActivityToStrategy({
      strategyId,
      activity: allocationActivity,
    });

    return {
      success: true,
      message: "Strategy allocated successfully",
    };
  } catch (error) {
    console.error("Error allocating strategy:", error);
    return {
      success: false,
      message: "Failed to allocate strategy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Deallocate funds from a user strategy
 */
export async function deallocateUserStrategy({
  walletAddress,
  strategyId,
  deallocatedFunds,
}: {
  walletAddress: string;
  strategyId: string;
  deallocatedFunds: number;
}): Promise<{
  success: boolean;
  message: string;
  remainingAllocation?: number;
  error?: string;
}> {
  try {
    if (!walletAddress || !strategyId || !deallocatedFunds) {
      return {
        success: false,
        message: "Missing required fields",
      };
    }

    if (deallocatedFunds <= 0) {
      return {
        success: false,
        message: "Deallocation amount must be greater than 0",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Find user and their strategies
    const user = await usersCollection.findOne({
      address: walletAddress.toLowerCase(),
    });

    if (!user || !user.strategies) {
      return {
        success: false,
        message: "User or strategies not found",
      };
    }

    // Find strategies for the specific strategyId
    const userStrategies = user.strategies.filter(
      (strategy: UserStrategy) => strategy.strategyId === strategyId
    );

    if (userStrategies.length === 0) {
      return {
        success: false,
        message: "No allocation found for this strategy",
      };
    }

    // Calculate total allocated funds for this strategy across all exchanges
    const totalAllocated = userStrategies.reduce(
      (sum: number, strategy: UserStrategy) => sum + (strategy.funds || 0),
      0
    );

    if (deallocatedFunds > totalAllocated) {
      return {
        success: false,
        message: `Cannot deallocate ${deallocatedFunds} USDT. You only have ${totalAllocated} USDT allocated to this strategy`,
      };
    }

    // Remove funds starting from the most recent allocations
    let remainingToRemove = deallocatedFunds;
    const strategiesToUpdate = [...userStrategies].reverse(); // Start with most recent

    for (const strategy of strategiesToUpdate) {
      if (remainingToRemove <= 0) break;

      if (strategy.funds <= remainingToRemove) {
        // Remove entire strategy allocation
        await usersCollection.updateOne(
          { address: walletAddress.toLowerCase() },
          {
            $pull: {
              strategies: {
                strategyId: strategy.strategyId,
                selectedExchange: strategy.selectedExchange,
                dateAllocated: strategy.dateAllocated,
              },
              //eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as unknown as any,
          }
        );
        remainingToRemove -= strategy.funds;
      } else {
        // Partially reduce this strategy allocation
        await usersCollection.updateOne(
          {
            address: walletAddress.toLowerCase(),
            "strategies.strategyId": strategy.strategyId,
            "strategies.selectedExchange": strategy.selectedExchange,
            "strategies.dateAllocated": strategy.dateAllocated,
          },
          {
            $inc: {
              "strategies.$.funds": -remainingToRemove,
            },
          }
        );
        remainingToRemove = 0;
      }
    }

    // Calculate remaining allocation after deallocation
    const updatedUser = await usersCollection.findOne({
      address: walletAddress.toLowerCase(),
    });
    const remainingStrategies =
      updatedUser?.strategies?.filter(
        (strategy: UserStrategy) => strategy.strategyId === strategyId
      ) || [];
    const remainingAllocation = remainingStrategies.reduce(
      (sum: number, strategy: UserStrategy) => sum + (strategy.funds || 0),
      0
    );

    // Add deallocation activity to the strategy
    const deallocationActivity = formatWithdrawalActivity(
      walletAddress,
      Number(deallocatedFunds)
    );
    await addActivityToStrategy({
      strategyId,
      activity: deallocationActivity,
    });

    return {
      success: true,
      message: "Funds deallocated successfully",
      remainingAllocation,
    };
  } catch (error) {
    console.error("Error deallocating strategy:", error);
    return {
      success: false,
      message: "Failed to deallocate strategy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update strategy (e.g., add trade history, update performance)
 */
export async function updateUserStrategy({
  walletAddress,
  strategyId,
  updateType,
  data,
}: {
  walletAddress: string;
  strategyId: string;
  updateType: "addTrade" | "updateStatus";
  data: {
    trade?: TradeEntry;
    status?: "active" | "inactive";
  };
}): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    if (!walletAddress || !strategyId || !updateType) {
      return {
        success: false,
        message: "Missing required fields",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    let updateQuery = {};

    switch (updateType) {
      case "addTrade":
        if (!data.trade) {
          return {
            success: false,
            message: "Trade data is required for addTrade operation",
          };
        }
        updateQuery = {
          $push: {
            "strategies.$.tradeHistory": data.trade,
          },
          $inc: {
            "strategies.$.performance.totalTrades": 1,
            "strategies.$.performance.totalPnl": data.trade.pnl,
          },
        };
        break;
      case "updateStatus":
        updateQuery = {
          $set: {
            "strategies.$.status": data.status,
          },
        };
        break;
      default:
        return {
          success: false,
          message: "Invalid update type",
        };
    }

    await usersCollection.updateOne(
      {
        address: walletAddress.toLowerCase(),
        "strategies.strategyId": strategyId,
      },
      updateQuery
    );

    return {
      success: true,
      message: "Strategy updated successfully",
    };
  } catch (error) {
    console.error("Error updating strategy:", error);
    return {
      success: false,
      message: "Failed to update strategy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a user strategy
 */
export async function deleteUserStrategy({
  walletAddress,
  strategyId,
}: {
  walletAddress: string;
  strategyId: string;
}): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    if (!walletAddress || !strategyId) {
      return {
        success: false,
        message: "Missing required fields",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    const result = await usersCollection.updateOne(
      { address: walletAddress.toLowerCase() },
      {
        $pull: {
          strategies: { strategyId },
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      }
    );

    return {
      success: true,
      message:
        result.modifiedCount > 0
          ? "Strategy deleted successfully"
          : "Strategy not found",
    };
  } catch (error) {
    console.error("Error deleting strategy:", error);
    return {
      success: false,
      message: "Failed to delete strategy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update strategy followers - add user to followers array if not already present
 */
export async function updateStrategyFollowers({
  strategyId,
  walletAddress,
}: {
  strategyId: string;
  walletAddress: string;
}): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    if (!strategyId || !walletAddress) {
      return {
        success: false,
        message: "Strategy ID and wallet address are required",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const strategiesCollection = db.collection("strategies");

    // Add wallet address to followers array if not already present
    const result = await strategiesCollection.updateOne(
      {
        strategyId: strategyId,
        followers: { $ne: walletAddress.toLowerCase() },
      },
      {
        $addToSet: {
          followers: walletAddress.toLowerCase(),
        },
      }
    );

    return {
      success: true,
      message:
        result.modifiedCount > 0 ? "Added to followers" : "Already following",
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

/**
 * Initialize strategies collection with strategies from constants
 */
export async function initializeStrategiesCollection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const strategiesCollection = db.collection("strategies");

    // Clear existing strategies to replace with updated ones
    await strategiesCollection.deleteMany({});

    // Convert strategies from constants to database format
    const strategiesToInsert = STRATS_CARDS.map((strategy) => ({
      strategyId: strategy.title.toLowerCase().replace(/\s+/g, "-"),
      title: strategy.title,
      subtitle: strategy.subtitle,
      category: strategy.category,
      icon: strategy.icon,
      description: strategy.subtitle, // Using subtitle as description
      tradeType: strategy.tradeType,
      riskLevel: strategy.riskLevel,
      status: strategy.status,
      startDate: strategy.startDate,
      endDate: strategy.endDate,
      compatibility: strategy.compatibility,
      exchanges: strategy.exchanges,
      supportedChains: strategy.supportedChains,
      author: strategy.author,
      followers: strategy.followers || [],
      visibility: strategy.visibility,
      features: strategy.features,
      notes: strategy.notes,
      prompts: strategy.prompts,
      chains: strategy.chains,
      tags: strategy.tags,
      history: strategy.history,
      entryCriterias: strategy.entryCriterias,
      exitCriteria: strategy.exitCriteria,
      pnl: strategy.pnl,
      apy: strategy.apy,
      performanceMetrics: {
        ...strategy.performanceMetrics,
      },
      fees: {
        trading: strategy.fees?.trading || 0.1,
        management: strategy.fees?.management || 0.05,
      },
      alerts: strategy.alerts || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert all strategies
    const result = await strategiesCollection.insertMany(strategiesToInsert);

    return {
      success: true,
      message: `Successfully initialized ${result.insertedCount} strategies`,
    };
  } catch (error) {
    console.error("Error initializing strategies collection:", error);
    return {
      success: false,
      message: "Failed to initialize strategies collection",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user's total allocated funds across all strategies and exchanges
 */
export async function getUserTotalAllocation({
  walletAddress,
}: {
  walletAddress: string;
}): Promise<{
  success: boolean;
  totalAllocated?: number;
  totalByExchange?: {
    Bybit: number;
    Binance: number;
  };
  allocationsByStrategy?: Array<{
    strategyId: string;
    strategyName: string;
    totalFunds: number;
    allocations: Array<{
      funds: number;
      exchange: string;
      dateAllocated: Date;
    }>;
  }>;
  message: string;
  error?: string;
}> {
  try {
    if (!walletAddress) {
      return {
        success: false,
        message: "Wallet address is required",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Find user and their strategies
    const user = await usersCollection.findOne({
      address: walletAddress.toLowerCase(),
    });

    if (!user || !user.strategies) {
      return {
        success: true,
        totalAllocated: 0,
        totalByExchange: { Bybit: 0, Binance: 0 },
        allocationsByStrategy: [],
        message: "No allocations found",
      };
    }
    // console.log(user?.strategies, "strats");
    // Calculate total allocation across all strategies
    const totalAllocated = user.strategies.reduce(
      (sum: number, strategy: UserStrategy) => sum + (strategy.funds || 0),
      0
    );

    // Calculate total by exchange
    const totalByExchange = user.strategies.reduce(
      (acc: { Bybit: number; Binance: number }, strategy: UserStrategy) => {
        if (strategy.selectedExchange === "Bybit") {
          acc.Bybit += strategy.funds || 0;
        } else if (strategy.selectedExchange === "Binance") {
          acc.Binance += strategy.funds || 0;
        }
        return acc;
      },
      { Bybit: 0, Binance: 0 }
    );

    // Group by strategy
    const strategiesMap = new Map();
    user.strategies.forEach((strategy: UserStrategy) => {
      const key = strategy.strategyId;
      if (!strategiesMap.has(key)) {
        strategiesMap.set(key, {
          strategyId: strategy.strategyId,
          strategyName: strategy.strategyName,
          totalFunds: 0,
          allocations: [],
        });
      }

      const strategyData = strategiesMap.get(key);
      strategyData.totalFunds += strategy.funds || 0;
      strategyData.allocations.push({
        funds: strategy.funds,
        exchange: strategy.selectedExchange,
        dateAllocated: strategy.dateAllocated,
      });
    });

    const allocationsByStrategy = Array.from(strategiesMap.values());

    return {
      success: true,
      totalAllocated,
      totalByExchange,
      allocationsByStrategy,
      message: "Total allocation retrieved successfully",
    };
  } catch (error) {
    console.error("Error fetching user total allocation:", error);
    return {
      success: false,
      message: "Failed to fetch total allocation",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user's total allocated funds for a specific strategy
 */
export async function getUserStrategyAllocation({
  walletAddress,
  strategyId,
}: {
  walletAddress: string;
  strategyId: string;
}): Promise<{
  success: boolean;
  totalAllocated?: number;
  allocations?: Array<{ funds: number; exchange: string; dateAllocated: Date }>;
  message: string;
  error?: string;
}> {
  try {
    if (!walletAddress || !strategyId) {
      return {
        success: false,
        message: "Wallet address and strategy ID are required",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Find user and their strategies
    const user = await usersCollection.findOne({
      address: walletAddress.toLowerCase(),
    });

    if (!user || !user.strategies) {
      return {
        success: true,
        totalAllocated: 0,
        allocations: [],
        message: "No allocations found for this strategy",
      };
    }

    // Filter strategies by strategyId and sum up the funds
    const strategyAllocations = user.strategies.filter(
      (strategy: UserStrategy) => strategy.strategyId === strategyId
    );

    const totalAllocated = strategyAllocations.reduce(
      (sum: number, strategy: UserStrategy) => sum + (strategy.funds || 0),
      0
    );

    const allocations = strategyAllocations.map((strategy: UserStrategy) => ({
      funds: strategy.funds,
      exchange: strategy.selectedExchange,
      dateAllocated: strategy.dateAllocated,
    }));

    return {
      success: true,
      totalAllocated,
      allocations,
      message: "Strategy allocation retrieved successfully",
    };
  } catch (error) {
    console.error("Error fetching user strategy allocation:", error);
    return {
      success: false,
      message: "Failed to fetch strategy allocation",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user's transaction history for a specific strategy
 */
export async function getUserStrategyTransactions({
  walletAddress,
  strategyId,
}: {
  walletAddress: string;
  strategyId: string;
}): Promise<{
  success: boolean;
  transactions?: TradeEntry[];
  message: string;
  error?: string;
}> {
  try {
    if (!walletAddress || !strategyId) {
      return {
        success: false,
        message: "Wallet address and strategy ID are required",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Find user and their strategies
    const user = await usersCollection.findOne({
      address: walletAddress.toLowerCase(),
    });

    if (!user || !user.strategies) {
      return {
        success: true,
        transactions: [],
        message: "No transactions found for this strategy",
      };
    }

    // Find the specific strategy and get its trade history
    const strategy = user.strategies.find(
      (s: UserStrategy) => s.strategyId === strategyId
    );

    if (!strategy) {
      return {
        success: true,
        transactions: [],
        message: "Strategy not found for this user",
      };
    }

    // Return the trade history (transactions)
    const transactions = strategy.tradeHistory || [];

    return {
      success: true,
      transactions,
      message: "Transactions retrieved successfully",
    };
  } catch (error) {
    console.error("Error fetching user strategy transactions:", error);
    return {
      success: false,
      message: "Failed to fetch transactions",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get strategy by ID
 */
export async function getStrategyById(strategyId: string): Promise<{
  success: boolean;
  strategy?: Strategy;
  message: string;
  error?: string;
}> {
  try {
    if (!strategyId) {
      return {
        success: false,
        message: "Strategy ID is required",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const strategiesCollection = db.collection("strategies");

    const strategy = await strategiesCollection.findOne({
      strategyId: strategyId,
    });

    if (!strategy) {
      return {
        success: false,
        message: "Strategy not found",
      };
    }

    // Remove MongoDB _id field and convert to Strategy type
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...strategyData } = strategy;

    return {
      success: true,
      strategy: strategyData as Strategy,
      message: "Strategy retrieved successfully",
    };
  } catch (error) {
    console.error("Error fetching strategy:", error);
    return {
      success: false,
      message: "Failed to fetch strategy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all strategies from database
 */
export async function getAllStrategies(): Promise<{
  success: boolean;
  strategies?: Strategy[];
  message: string;
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const strategiesCollection = db.collection("strategies");

    const strategies = await strategiesCollection.find({}).toArray();

    // Remove MongoDB _id field and convert to Strategy type
    const formattedStrategies = strategies.map((strategy) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...strategyData } = strategy;
      return strategyData as Strategy;
    });

    return {
      success: true,
      strategies: formattedStrategies,
      message: "Strategies retrieved successfully",
    };
  } catch (error) {
    console.error("Error fetching all strategies:", error);
    return {
      success: false,
      message: "Failed to fetch strategies",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add activity to a strategy's activities array
 */
export async function addActivityToStrategy({
  strategyId,
  activity,
}: {
  strategyId: string;
  activity: string;
}): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    if (!strategyId || !activity) {
      return {
        success: false,
        message: "Strategy ID and activity message are required",
      };
    }

    const client = await clientPromise;
    const db = client.db();
    const strategiesCollection = db.collection("strategies");

    // Add activity to the strategy's activities array
    const result = await strategiesCollection.updateOne(
      { strategyId: strategyId },
      {
        $push: {
          activities: { message: activity, timestamp: new Date() },
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any,
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        message: "Strategy not found",
      };
    }

    return {
      success: true,
      message: "Activity added successfully",
    };
  } catch (error) {
    console.error("Error adding activity to strategy:", error);
    return {
      success: false,
      message: "Failed to add activity",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get total AUM (Assets Under Management) for a specific strategy
 * by summing all users' allocated funds for that strategy
 */
export async function getStrategyAUM(strategyId: string): Promise<{
  success: boolean;
  totalAUM?: number;
  totalUsers?: number;
  message: string;
  error?: string;
}> {
  return await calculateStrategyAUM(strategyId);
}
