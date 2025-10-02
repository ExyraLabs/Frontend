"use server";
import clientPromise from "@/lib/mongodb";
import { encryptObject, decryptObject } from "@/lib/encryption";

export type ExchangeKeys = {
  binance: { apiKey: string; secretKey: string };
  bybit: { apiKey: string; secretKey: string };
};

/**
 * Uploads encrypted API keys to the database for a user
 */
export async function uploadApiKeys({
  address,
  keys,
}: {
  address: string;
  keys: ExchangeKeys;
}) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const apiKeysCollection = db.collection("api_keys");

    // Use lowercase address for consistency
    const normalizedAddress = address.toLowerCase();

    // Encrypt the keys before storing
    const encryptedKeys = encryptObject(keys);

    // Upsert the keys for the user
    const result = await apiKeysCollection.updateOne(
      { address: normalizedAddress },
      {
        $set: {
          address: normalizedAddress,
          encryptedKeys,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Only return JSON-serializable values to the client
    return {
      success: true,
      message: "API keys uploaded successfully",
      modifiedCount: result.modifiedCount,
      // Convert ObjectId to string if present to avoid RSC serialization errors
      upsertedId: result.upsertedId ? String(result.upsertedId) : undefined,
    };
  } catch (error) {
    console.error("Error uploading API keys:", error);
    return {
      success: false,
      message: "Failed to upload API keys",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Retrieves and decrypts API keys for a user
 */
export async function getUserApiKeys(address: string): Promise<{
  success: boolean;
  keys?: ExchangeKeys;
  message: string;
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const db = client.db("");
    const apiKeysCollection = db.collection("api_keys");

    // Normalize address to lowercase for consistent querying
    const normalizedAddress = address.toLowerCase();

    const result = await apiKeysCollection.findOne({
      address: { $regex: new RegExp(`^${normalizedAddress}$`, "i") },
    });

    if (!result) {
      return {
        success: true,
        message: "No API keys found for user",
      };
    }

    // Decrypt the keys
    const decryptedKeys = decryptObject<ExchangeKeys>(result.encryptedKeys);

    return {
      success: true,
      keys: decryptedKeys,
      message: "API keys retrieved successfully",
    };
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error retrieving API keys:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve API keys",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Deletes API keys for a user
 */
export async function deleteUserApiKeys(address: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const apiKeysCollection = db.collection("api_keys");

    // Use lowercase address for consistency
    const normalizedAddress = address.toLowerCase();

    const result = await apiKeysCollection.deleteOne({
      address: normalizedAddress,
    });

    return {
      success: true,
      message:
        result.deletedCount > 0
          ? "API keys deleted successfully"
          : "No API keys found to delete",
    };
  } catch (error) {
    console.error("Error deleting API keys:", error);
    return {
      success: false,
      message: "Failed to delete API keys",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Checks if a user has API keys stored in the database
 */
export async function hasStoredApiKeys(address: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const apiKeysCollection = db.collection("api_keys");

    // Use lowercase address for consistency
    const normalizedAddress = address.toLowerCase();

    const result = await apiKeysCollection.findOne(
      { address: normalizedAddress },
      { projection: { _id: 1 } }
    );

    return !!result;
  } catch (error) {
    console.error("Error checking for stored API keys:", error);
    return false;
  }
}
