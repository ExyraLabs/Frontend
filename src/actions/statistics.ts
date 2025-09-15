"use server";
import clientPromise from "@/lib/mongodb";

export async function logUserAction({
  address,
  agent,
  action,
  volume,
  token,
  volumeUsd,
  extra = {},
}: {
  address: string;
  agent: string;
  action: string;
  volume: number;
  token: string;
  volumeUsd?: number;
  extra?: Record<string, unknown>;
}) {
  const client = await clientPromise;
  const db = client.db();
  const statistics = db.collection("statistics");

  // Use lowercase address for consistency
  const normalizedAddress = address.toLowerCase();

  const entry = {
    address: normalizedAddress,
    agent,
    action,
    volume,
    token,
    volumeUsd: volumeUsd || null,
    extra,
    timestamp: new Date(),
  };
  await statistics.insertOne(entry);
  return entry;
}

export async function logUserLogin(address: string) {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection("users");

  // Use lowercase address for consistency
  const normalizedAddress = address.toLowerCase();

  await users.updateOne(
    { address: normalizedAddress },
    { $set: { address: normalizedAddress, lastLogin: new Date() } },
    { upsert: true }
  );
  return { address: normalizedAddress };
}

export async function getAllStatistics() {
  const client = await clientPromise;
  const db = client.db();
  const statistics = db.collection("statistics");
  const results = await statistics.find({}).sort({ timestamp: -1 }).toArray();

  // Convert MongoDB documents to plain objects
  return results.map((doc) => ({
    _id: doc._id.toString(),
    address: doc.address,
    agent: doc.agent,
    action: doc.action,
    volume: doc.volume,
    token: doc.token,
    volumeUsd: doc.volumeUsd,
    extra: doc.extra,
    timestamp: doc.timestamp.toISOString(),
  }));
}

export async function getUserStatistics(address: string) {
  const client = await clientPromise;
  const db = client.db();
  const statistics = db.collection("statistics");

  // Use lowercase address for consistent querying
  const normalizedAddress = address.toLowerCase();

  const results = await statistics
    .find({ address: normalizedAddress })
    .sort({ timestamp: -1 })
    .toArray();

  // Convert MongoDB documents to plain objects
  return results.map((doc) => ({
    _id: doc._id.toString(),
    address: doc.address,
    agent: doc.agent,
    action: doc.action,
    volume: doc.volume,
    token: doc.token,
    volumeUsd: doc.volumeUsd,
    extra: doc.extra,
    timestamp: doc.timestamp.toISOString(),
  }));
}
