"use server";
import clientPromise from "../lib/mongodb";

// Minimal subset of verify actions re-enabled for rewards social connect flow (gmail omitted)

interface BasicUserRecord {
  wallet?: string;
  x_id?: number;
  x_username?: string;
  discord_id?: number;
  discord_username?: string;
  tg_id?: number;
  tg_username?: string;
  // allow extra properties without using 'any'
  [k: string]: unknown;
}

export const getUserDetails = async (
  wallet: string
): Promise<BasicUserRecord | undefined> => {
  if (!wallet || wallet.length < 2) return;
  const client = await clientPromise;
  const db = client.db("Exyra");
  const user = await db.collection("users").findOne(
    { address: wallet },
    {
      projection: {
        _id: 0,
        created_at: 0,
        updated_at: 0,
        pointsHistory: { _id: 0 },
      },
    }
  );
  if (user) return user as unknown as BasicUserRecord;
  return {} as BasicUserRecord;
};

// Minimal server action to return only social fields for a given wallet
export const getUserSocial = async (
  wallet: string
): Promise<
  | {
      ok: true;
      user: Pick<
        BasicUserRecord,
        | "discord_id"
        | "discord_username"
        | "x_id"
        | "x_username"
        | "tg_id"
        | "tg_username"
      >;
    }
  | { ok: false; error: string }
> => {
  try {
    if (!wallet) return { ok: false, error: "Missing wallet" };
    const client = await clientPromise;
    const db = client.db("Exyra");
    const user = (await db.collection("users").findOne(
      { address: wallet },
      {
        projection: {
          _id: 0,
          discord_id: 1,
          discord_username: 1,
          x_id: 1,
          x_username: 1,
          tg_id: 1,
          tg_username: 1,
        },
      }
    )) as unknown as BasicUserRecord | null;
    const shaped = {
      discord_id: user?.discord_id,
      discord_username: user?.discord_username,
      x_id: user?.x_id,
      x_username: user?.x_username,
      tg_id: user?.tg_id,
      tg_username: user?.tg_username,
    } as Pick<
      BasicUserRecord,
      | "discord_id"
      | "discord_username"
      | "x_id"
      | "x_username"
      | "tg_id"
      | "tg_username"
    >;
    return { ok: true, user: shaped };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
};

export const authenticateTwitter = async (
  address: string,
  id: number,
  username: string
): Promise<{ ok: boolean; message: string }> => {
  const client = await clientPromise;
  const db = client.db("Exyra");
  const user = await getUserDetails(address);
  if (!user) return { ok: false, message: "Wallet not registered" };
  if (user?.x_id) return { ok: true, message: "Connected" };
  const existing = await db.collection("users").findOne({
    $or: [{ x_id: id }, { x_username: username }],
    address: { $ne: address },
  });
  if (existing)
    return {
      ok: false,
      message: "This Twitter account is already linked to another wallet",
    };
  const result = await db
    .collection("users")
    .updateOne(
      { address: address },
      { $set: { x_id: id, x_username: username } },
      { upsert: true }
    );
  if (result.modifiedCount === 0 && !result.upsertedCount)
    return { ok: false, message: "Failed to connect Twitter" };
  return { ok: true, message: "Twitter connected successfully" };
};

export const authenticateDiscord = async (
  address: string,
  id: number,
  username: string
): Promise<{ ok: boolean; message: string }> => {
  const client = await clientPromise;
  const db = client.db("Exyra");
  const user = await getUserDetails(address);
  if (!user) return { ok: false, message: "Wallet not registered" };
  if (user?.discord_id) return { ok: true, message: "Connected" };
  const existing = await db.collection("users").findOne({
    $or: [{ discord_id: id }, { discord_username: username }],
    address: { $ne: address },
  });
  if (existing)
    return {
      ok: false,
      message: "This Discord account is already linked to another wallet",
    };
  const result = await db
    .collection("users")
    .updateOne(
      { address: address },
      { $set: { discord_id: id, discord_username: username } },
      { upsert: true }
    );
  if (result.modifiedCount === 0 && !result.upsertedCount)
    return { ok: false, message: "Failed to connect Discord" };
  return { ok: true, message: "Discord connected successfully" };
};

export const authenticateTelegram = async (
  address: string,
  id: number,
  username: string
): Promise<{ ok: boolean; message: string }> => {
  const client = await clientPromise;
  const db = client.db("Exyra");
  const user = await getUserDetails(address);
  if (!user) return { ok: false, message: "Wallet not registered" };
  if (user?.tg_id) return { ok: true, message: "Connected" };
  const existing = await db.collection("users").findOne({
    $or: [{ tg_id: id }, { tg_username: username }],
    address: { $ne: address },
  });
  if (existing)
    return {
      ok: false,
      message: "This Telegram account is already linked to another wallet",
    };
  const result = await db
    .collection("users")
    .updateOne(
      { address: address },
      { $set: { tg_id: id, tg_username: username } },
      { upsert: true }
    );
  if (result.modifiedCount === 0 && !result.upsertedCount)
    return { ok: false, message: "Failed to connect Telegram" };
  return { ok: true, message: "Telegram connected successfully" };
};
