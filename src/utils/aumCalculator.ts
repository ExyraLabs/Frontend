"use server";
import clientPromise from "@/lib/mongodb";

interface UserStrategy {
  strategyId: string;
  strategyName: string;
  funds: number;
  selectedExchange: "Bybit" | "Binance";
  dateAllocated: Date;
  status: "active" | "inactive";
}

/**
 * Calculate total Assets Under Management (AUM) for a specific strategy
 * by summing all users' allocated funds for that strategy
 */
export async function calculateStrategyAUM(strategyId: string): Promise<{
  success: boolean;
  totalAUM?: number;
  totalUsers?: number;
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
    const usersCollection = db.collection("users");
    const strategiesCollection = db.collection("strategies");

    // First, get the strategy to access its followers
    const strategy = await strategiesCollection.findOne({
      title: { $regex: new RegExp(strategyId.replace(/-/g, "\\s+"), "i") },
    });

    if (!strategy) {
      // If strategy not found in database, still calculate from all users
      // This handles cases where the strategy exists in constants but not yet in DB
      console.warn(
        `Strategy ${strategyId} not found in database, calculating from all users`
      );
    }

    // Get all users who have this strategy in their strategies array
    const usersWithStrategy = await usersCollection
      .find({
        "strategies.strategyId": strategyId,
      })
      .toArray();

    if (!usersWithStrategy || usersWithStrategy.length === 0) {
      return {
        success: true,
        totalAUM: 0,
        totalUsers: 0,
        message: "No users found with allocations for this strategy",
      };
    }

    // Calculate total AUM by summing all users' allocations for this strategy
    let totalAUM = 0;
    let totalUsers = 0;

    for (const user of usersWithStrategy) {
      if (user.strategies && Array.isArray(user.strategies)) {
        // Filter strategies for this specific strategyId and sum funds
        const userStrategyAllocations = user.strategies.filter(
          (userStrategy: UserStrategy) => userStrategy.strategyId === strategyId
        );

        if (userStrategyAllocations.length > 0) {
          totalUsers++;
          const userTotalForStrategy = userStrategyAllocations.reduce(
            (sum: number, userStrategy: UserStrategy) =>
              sum + (userStrategy.funds || 0),
            0
          );
          totalAUM += userTotalForStrategy;
        }
      }
    }

    return {
      success: true,
      totalAUM,
      totalUsers,
      message: `AUM calculated successfully: ${totalUsers} users with total ${totalAUM} USDT`,
    };
  } catch (error) {
    console.error("Error calculating strategy AUM:", error);
    return {
      success: false,
      message: "Failed to calculate AUM",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
