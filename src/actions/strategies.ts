"use server";
import clientPromise from "@/lib/mongodb";
import type { Strategy } from "@/types/strategy";

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
  price: number;
  pnl: number;
  exchange: "Bybit" | "Binance";
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

    // Create or update user strategy
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

    // Add user to strategy followers if not already following
    await updateStrategyFollowers({
      strategyId,
      walletAddress,
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
 * Initialize strategies collection with the Extended Creep strategy
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

    // Check if Extended Creep strategy already exists
    const existingStrategy = await strategiesCollection.findOne({
      strategyId: "extended-creep",
    });

    if (existingStrategy) {
      return {
        success: true,
        message: "Extended Creep strategy already exists",
      };
    }

    // Create the Extended Creep strategy
    const extendedCreepStrategy = {
      strategyId: "extended-creep",
      title: "Extended Creep",
      subtitle: "Long-term momentum trading strategy",
      category: "Momentum",
      icon: ["/icons/eth.svg", "/icons/usdt.svg"],
      description:
        "A sophisticated momentum-based trading strategy that identifies and capitalizes on extended price movements across multiple timeframes.",
      tradeType: "Swing Trading",
      riskLevel: "Medium",
      status: "active",
      startDate: "2024-01-01",
      compatibility:
        "Compatible with all major wallets including MetaMask, Trust Wallet, and Coinbase Wallet.",
      exchanges: ["Bybit", "Binance"],
      supportedChains: ["Ethereum", "Binance Smart Chain"],
      author: "Exyra Labs",
      followers: [], // Array of wallet addresses
      visibility: "public" as const,
      features: [
        "Multi-timeframe analysis",
        "Risk management protocols",
        "Automated position sizing",
        "Real-time market monitoring",
      ],
      tags: ["momentum", "swing-trading", "multi-timeframe", "automated"],
      fees: {
        managementFee: 2.0,
        performanceFee: 20.0,
      },
      performanceMetrics: {
        totalAUM: 2400000, // $2.4M
        monthlyReturn: 8.5,
        yearlyReturn: 23.4,
        sharpeRatio: 1.8,
        maxDrawdown: 12.3,
        winRate: 68.5,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await strategiesCollection.insertOne(extendedCreepStrategy);

    return {
      success: true,
      message: "Extended Creep strategy created successfully",
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
    console.log(user, "user");

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
