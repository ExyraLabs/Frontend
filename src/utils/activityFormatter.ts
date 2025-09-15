/**
 * Utility functions for formatting activity messages
 */

/**
 * Truncates a wallet address to show first 4 and last 3 characters
 * e.g., "0x1234567890abcdef" becomes "0x12...def"
 */
export function truncateWalletAddress(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-3)}`;
}

/**
 * Formats an allocation activity message
 */
export function formatAllocationActivity(
  walletAddress: string,
  amount: number
): string {
  const truncatedAddress = truncateWalletAddress(walletAddress);
  return `${truncatedAddress} allocated $${amount}`;
}

/**
 * Formats a withdrawal activity message
 */
export function formatWithdrawalActivity(
  walletAddress: string,
  amount: number
): string {
  const truncatedAddress = truncateWalletAddress(walletAddress);
  return `${truncatedAddress} deallocated $${amount}`;
}

/**
 * Formats a strategy status change activity message
 */
export function formatStatusChangeActivity(
  walletAddress: string,
  newStatus: string
): string {
  const truncatedAddress = truncateWalletAddress(walletAddress);
  return `${truncatedAddress} changed status to ${newStatus}`;
}

/**
 * Formats a trade activity message
 */
export function formatTradeActivity(
  walletAddress: string,
  action: "buy" | "sell",
  asset: string,
  amount: number
): string {
  const truncatedAddress = truncateWalletAddress(walletAddress);
  return `${truncatedAddress} ${
    action === "buy" ? "bought" : "sold"
  } ${amount} ${asset}`;
}

/**
 * Formats a generic activity message with timestamp
 */
export function formatActivityWithTimestamp(message: string): string {
  const timestamp = new Date().toLocaleString();
  return `${message} at ${timestamp}`;
}
