"use server";
import clientPromise from "@/lib/mongodb";

// Simplified rewards state that only stores message count
interface RewardsState {
  chatMessageCount: number;
  lastResetDate?: string;
}

// Persist (upsert) only the message count for a user wallet
export const updateUserRewardsState = async (
  wallet: string,
  messageCount: RewardsState
): Promise<{ ok: boolean; message: string }> => {
  if (!wallet) return { ok: false, message: "Missing wallet" };
  try {
    const client = await clientPromise;
    const db = client.db("Exyra");

    // Use lowercase address to prevent duplicates
    const normalizedAddress = wallet.toLowerCase();

    // Check if user already exists to prevent duplicates
    const existingUser = await db.collection("users").findOne({
      address: normalizedAddress,
    });

    if (existingUser) {
      // Update existing user's message count directly in user document
      await db.collection("users").updateOne(
        { address: normalizedAddress },
        {
          $set: {
            chatMessageCount: messageCount,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Create new user with initial message count
      await db.collection("users").insertOne({
        address: normalizedAddress,
        chatMessageCount: messageCount,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { ok: true, message: "Message count saved" };
  } catch (e: unknown) {
    const err = e as Error;
    return { ok: false, message: err.message };
  }
};

// Fetch message count for a user wallet. Returns 0 if none stored yet.
export const getUserMessageCount = async (wallet: string): Promise<number> => {
  if (!wallet) return 0;
  try {
    const client = await clientPromise;
    const db = client.db("Exyra");

    // Use lowercase address for consistency
    const normalizedAddress = wallet.toLowerCase();

    const user: { chatMessageCount?: number } | null = (await db
      .collection("users")
      .findOne(
        { address: normalizedAddress },
        { projection: { _id: 0, chatMessageCount: 1 } }
      )) as {
      chatMessageCount?: number;
    };
    return user?.chatMessageCount ?? 0;
  } catch {
    return 0;
  }
};

// Keep the old function for backward compatibility but handle both old and new structures
export const getUserRewardsState = async (
  wallet: string
): Promise<RewardsState | null> => {
  if (!wallet) return null;
  try {
    const client = await clientPromise;
    const db = client.db("Exyra");

    // Use lowercase address for consistency
    const normalizedAddress = wallet.toLowerCase();

    const user: { rewards?: RewardsState; chatMessageCount?: number } | null =
      (await db
        .collection("users")
        .findOne(
          { address: normalizedAddress },
          { projection: { _id: 0, rewards: 1, chatMessageCount: 1 } }
        )) as {
        rewards?: RewardsState;
        chatMessageCount?: number;
      };

    if (!user) return null;

    // Handle both old structure (rewards.chatMessageCount) and new structure (chatMessageCount)
    const messageCount =
      user.chatMessageCount ?? user.rewards?.chatMessageCount ?? 0;

    return {
      chatMessageCount: messageCount,
    };
  } catch {
    return null;
  }
};
