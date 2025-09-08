import crypto from 'crypto';

// Encryption key from environment variable (64 hex chars = 32 bytes)
const ENC_KEY = '4f3c2e9a8e1d6f77d25a7a91d1b123b4e5c6d7f8a9b0c1d2e3f4a5b6c7d8e9f0';
const IV_LENGTH = 16;

// 🔑 convert hex string -> 32-byte buffer
const KEY = Buffer.from(ENC_KEY, "hex");

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return iv.toString("hex") + ":" + tag + ":" + encrypted;
}

// Decrypt
export function decrypt(data: string) {
  const [ivHex, tagHex, encrypted] = data.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Encrypts an object by stringifying and encrypting it
 */
export function encryptObject<T>(obj: T): string {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypts and parses an object
 */
export function decryptObject<T>(encryptedData: string): T {
  const decrypted = decrypt(encryptedData);
  return JSON.parse(decrypted) as T;
}
