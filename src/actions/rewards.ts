"use server";
import clientPromise from "@/lib/mongodb";
import { RewardsStatePersisted } from "@/types/rewards";

// Persist (upsert) the rewards state for a user wallet. Points are managed via addPoints/deductPoints actions.
export const updateUserRewardsState = async (
  wallet: string,
  rewards: RewardsStatePersisted
): Promise<{ ok: boolean; message: string }> => {
  if (!wallet) return { ok: false, message: "Missing wallet" };
  try {
    const client = await clientPromise;
    const db = client.db("Exyra");
    await db.collection("users").updateOne(
      { address: wallet },
      {
        // Set/replace the rewards sub-document
        $set: {
          rewards: rewards,
          updatedAt: new Date(),
        },
        // On first save, ensure we create the user document
        $setOnInsert: {
          address: wallet,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    return { ok: true, message: "Rewards state saved" };
  } catch (e: unknown) {
    const err = e as Error;
    return { ok: false, message: err.message };
  }
};

// Fetch rewards state for a user wallet. Returns null if none stored yet.
export const getUserRewardsState = async (
  wallet: string
): Promise<RewardsStatePersisted | null> => {
  if (!wallet) return null;
  try {
    const client = await clientPromise;
    const db = client.db("Exyra");
    const user: { rewards?: RewardsStatePersisted } | null = (await db
      .collection("users")
      .findOne(
        { address: wallet },
        { projection: { _id: 0, rewards: 1 } }
      )) as {
      rewards?: RewardsStatePersisted;
    };
    return user?.rewards ?? null;
  } catch {
    return null;
  }
};
