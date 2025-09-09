import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  type UseWriteContractReturnType,
} from "wagmi";
import {
  getAccount,
  getWalletClient,
  type Config as WagmiCoreConfig,
} from "@wagmi/core";
import { config as wagmiConfig } from "@/config";
import {
  parseUnits,
  formatUnits,
  type PublicClient,
  type WalletClient,
} from "viem";
import { ethers } from "ethers";
import { ERC20_ABI } from "../constants/swap";
import { JSBI } from "@uniswap/sdk";
import { Reserve } from "@aave/react";

// Type for window.ethereum
// declare global {
//   interface Window {
//     ethereum?: {
//       request: (args: {
//         method: string;
//         params?: unknown[];
//       }) => Promise<unknown>;
//       isMetaMask?: boolean;
//     };
//   }
// }

// Hook for token approval functionality
export function useTokenApproval(
  tokenContractAddress: `0x${string}`,
  spenderAddress: `0x${string}`
) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Get current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenContractAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: !!userAddress && !!spenderAddress,
    },
  });

  // Get token symbol for logging
  const { data: tokenSymbol } = useReadContract({
    address: tokenContractAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  // Get token decimals
  const { data: tokenDecimals } = useReadContract({
    address: tokenContractAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const checkAndApprove = async (spendingAmount: string | number) => {
    if (!userAddress || !tokenDecimals) {
      console.error("User address or token decimals not available");
      return false;
    }

    try {
      // Convert spending amount to proper units
      const spendingAmountBigInt =
        typeof spendingAmount === "string"
          ? parseUnits(spendingAmount, tokenDecimals)
          : parseUnits(spendingAmount.toString(), tokenDecimals);

      console.log(
        `Token (${tokenSymbol}) Allowance: ${
          allowance ? formatUnits(allowance, tokenDecimals) : "0"
        }`
      );

      // Check if approval is needed
      if (!allowance || allowance < spendingAmountBigInt) {
        console.log(
          `Insufficient allowance, getting approval for ${tokenSymbol}...`
        );

        // Request approval
        writeContract({
          address: tokenContractAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [spenderAddress, spendingAmountBigInt],
        });

        return true; // Approval transaction initiated
      } else {
        console.log(`Sufficient allowance already exists for ${tokenSymbol}`);
        return false; // No approval needed
      }
    } catch (error) {
      console.error("Error in checkAndApprove:", error);
      return false;
    }
  };

  return {
    allowance,
    tokenSymbol,
    tokenDecimals,
    checkAndApprove,
    approvalHash: hash,
    isApproving: isPending,
    isConfirming,
    isConfirmed,
    error,
    refetchAllowance,
  };
}

// Alternative function-based approach (non-hook version)
export async function getTokenApprovalWagmi({
  tokenContractAddress,
  spenderAddress,
  spendingAmount,
  userAddress,
  writeContract,
  publicClient,
}: {
  tokenContractAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  spendingAmount: string | number;
  userAddress: `0x${string}`;
  writeContract: UseWriteContractReturnType["writeContract"];
  publicClient: PublicClient;
}) {
  try {
    // Get token decimals
    const tokenDecimals = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: "decimals",
    });

    // Get token symbol
    const tokenSymbol = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: "symbol",
    });

    // Get current allowance
    const currentAllowance = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [userAddress, spenderAddress],
    });

    console.log(
      `Token (${tokenSymbol}) Allowance: ${formatUnits(
        currentAllowance,
        tokenDecimals
      )}`
    );

    // Convert spending amount to proper units
    const spendingAmountBigInt =
      typeof spendingAmount === "string"
        ? parseUnits(spendingAmount, tokenDecimals)
        : parseUnits(spendingAmount.toString(), tokenDecimals);

    if (currentAllowance < spendingAmountBigInt) {
      console.log(
        `Insufficient allowance, getting approval for ${tokenSymbol}...`
      );

      try {
        // Call the approve function - note: this will trigger the transaction
        writeContract({
          address: tokenContractAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [spenderAddress, spendingAmountBigInt],
        });

        console.log(`Approve transaction initiated for ${tokenSymbol}`);
        return { success: true, needsApproval: true };
      } catch (error) {
        console.error("Approval transaction failed:", error);
        return { success: false, error, needsApproval: true };
      }
    } else {
      console.log(`Sufficient allowance already exists for ${tokenSymbol}`);
      return { success: true, needsApproval: false };
    }
  } catch (error) {
    console.error("Error in getTokenApprovalWagmi:", error);
    return { success: false, error, needsApproval: false };
  }
}

// Function to convert Ethereum address to UUID format
export function addressToUuid(address: string): string {
  // Remove '0x' prefix if present
  const cleanAddress = address.toLowerCase().replace("0x", "");

  // Pad with zeros to get 32 characters (128 bits)
  const paddedAddress = cleanAddress.padStart(32, "0");

  // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuid = [
    paddedAddress.slice(0, 8),
    paddedAddress.slice(8, 12),
    paddedAddress.slice(12, 16),
    paddedAddress.slice(16, 20),
    paddedAddress.slice(20, 32),
  ].join("-");

  return uuid;
}

// ETHERS.JS APPROACH - Much simpler!

// Helper function to get signer - multiple approaches
export async function getSigner(
  expectedAddress?: string
): Promise<ethers.Signer | null> {
  if (typeof window === "undefined") return null;

  // Narrow the injected window shape for TypeScript without using 'any'
  interface InjectedEthereumProvider extends ethers.providers.ExternalProvider {
    request?: (args: {
      method: string;
      params?: unknown[];
    }) => Promise<unknown>;
    isMetaMask?: boolean;
    isPhantom?: boolean; // Phantom EVM flag (some versions)
    isPhantomEthereum?: boolean; // Alternative Phantom flag
    providers?: InjectedEthereumProvider[]; // MetaMask multi-provider pattern
  }
  interface PhantomNamespace {
    ethereum?: InjectedEthereumProvider;
  }
  const w = window as unknown as {
    ethereum?: InjectedEthereumProvider;
    phantom?: PhantomNamespace;
  };

  const lowerExpected = expectedAddress?.toLowerCase();

  // First, try to use the wallet actually connected via Wagmi/AppKit
  // This ensures we use the same connector (e.g., MetaMask, Phantom, WC) the app session is using
  try {
    const acct = getAccount(wagmiConfig as WagmiCoreConfig);
    if (acct?.isConnected) {
      if (!lowerExpected || acct.address?.toLowerCase() === lowerExpected) {
        const wc: WalletClient | undefined = await getWalletClient(
          wagmiConfig as WagmiCoreConfig,
          { chainId: acct.chainId }
        );
        if (wc) {
          type Eip1193Provider = {
            request: (args: {
              method: string;
              params?: unknown[];
            }) => Promise<unknown>;
          };
          // Wrap the Viem wallet client into a minimal EIP-1193 provider for ethers
          const eip1193 = wc as unknown as {
            request: Eip1193Provider["request"];
          };
          const web3Provider = new ethers.providers.Web3Provider(
            eip1193 as unknown as ethers.providers.ExternalProvider
          );
          const signer = web3Provider.getSigner();
          if (
            !lowerExpected ||
            (await signer.getAddress()).toLowerCase() === lowerExpected
          ) {
            return signer;
          }
        }
      }
    }
  } catch (e) {
    // Non-fatal: fall back to injected providers below
    console.debug(
      "Wagmi/AppKit signer path failed, falling back to injected providers",
      e
    );
  }

  // Helper: attempt to get signer from a raw injected provider object
  const tryProvider = async (
    rawProvider: InjectedEthereumProvider | undefined,
    requestAccess = false
  ): Promise<ethers.Signer | null> => {
    if (!rawProvider) return null;
    try {
      if (requestAccess) {
        await rawProvider.request?.({ method: "eth_requestAccounts" });
      } else {
        await rawProvider.request?.({ method: "eth_accounts" });
      }
      const web3Provider = new ethers.providers.Web3Provider(rawProvider);

      if (lowerExpected) {
        const res = await rawProvider.request?.({
          method: "eth_accounts",
        });
        const accounts = Array.isArray(res)
          ? (res as unknown[]).filter((x): x is string => typeof x === "string")
          : [];
        if (accounts.map((a) => a.toLowerCase()).includes(lowerExpected)) {
          return web3Provider.getSigner();
        }
        return null; // expected not matched
      }
      return web3Provider.getSigner();
    } catch {
      return null;
    }
  };

  // 1. Multiple providers pattern (EIP-1193 multiplexing)
  const multi = w.ethereum?.providers;
  if (multi && multi.length) {
    // If expected address provided, return signer from the provider that controls it
    if (lowerExpected) {
      for (const p of multi) {
        const signer = await tryProvider(p, false);
        if (signer) {
          try {
            if ((await signer.getAddress()).toLowerCase() === lowerExpected) {
              return signer;
            }
          } catch {}
        }
      }
    }

    // Otherwise, just return the first provider that can give a signer (no arbitrary preference)
    for (const p of multi) {
      const s = await tryProvider(p, !lowerExpected);
      if (s) return s;
    }
  }

  // 2. Dedicated Phantom EVM provider (phantom injects window.phantom.ethereum)
  if (w.phantom?.ethereum) {
    const phantomSigner = await tryProvider(w.phantom.ethereum, !lowerExpected);
    if (phantomSigner) {
      if (!lowerExpected) return phantomSigner;
      try {
        if (
          (await phantomSigner.getAddress()).toLowerCase() === lowerExpected
        ) {
          return phantomSigner;
        }
      } catch {}
    }
  }

  // 3. Single provider on window.ethereum (could be MetaMask or something else)
  if (w.ethereum) {
    const singleSigner = await tryProvider(w.ethereum, true);
    if (singleSigner) return singleSigner;
  }

  return null;
}

// Simple ethers.js token approval function
export async function getTokenApprovalEthers(
  userAddress: string,
  tokenContractAddress: string,
  spenderAddress: string,
  spendingAmount: string | number,
  signer?: ethers.Signer,
  options?: { expectedChainId?: number; decimalsHint?: number }
): Promise<{
  success: boolean;
  needsApproval: boolean;
  txHash?: string;
  error?: Error;
}> {
  try {
    // Validate contract address
    if (!ethers.utils.isAddress(tokenContractAddress)) {
      throw new Error(
        `Invalid token contract address: ${tokenContractAddress}`
      );
    }

    // Get signer if not provided
    const actualSigner = signer || (await getSigner(userAddress));
    if (!actualSigner) {
      throw new Error("No signer available");
    }

    // Simple ERC20 ABI - just what we need
    const erc20Abi = [
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];

    // Get the provider from the signer
    const provider = actualSigner.provider;
    if (!provider) {
      throw new Error("Signer does not have a provider");
    }

    // Optional safety: ensure we're on the expected chain (helps avoid CALL_EXCEPTION when addresses belong to another network)
    if (options?.expectedChainId) {
      try {
        const network = await provider.getNetwork();
        // ethers v5 returns Network with chainId as number | string; normalize to number
        const currentChainId =
          typeof network.chainId === "number"
            ? network.chainId
            : parseInt(String(network.chainId));
        if (currentChainId !== options.expectedChainId) {
          return {
            success: false,
            needsApproval: false,
            error: new Error(
              `Wrong network: connected ${currentChainId}, expected ${options.expectedChainId}`
            ),
          };
        }
      } catch {
        // Non-fatal; continue
      }
    }

    // Create contract instance for reading (connected to provider)
    const tokenContractRead = new ethers.Contract(
      tokenContractAddress,
      erc20Abi,
      provider
    );

    // Create contract instance for writing (connected to signer)
    const tokenContract = new ethers.Contract(
      tokenContractAddress,
      erc20Abi,
      actualSigner
    );

    // Get token info using the read contract
    // Use provided decimals hint to avoid failing calls on non-ERC20 or mismatched chains
    const decimals =
      options?.decimalsHint ?? (await tokenContractRead.decimals());
    const symbol = await tokenContractRead.symbol().catch(() => "");

    // Get current allowance using the read contract
    const currentAllowance = await tokenContractRead
      .allowance(userAddress, spenderAddress)
      .catch(() => ethers.constants.Zero);

    // Convert spending amount to proper units
    const spendingAmountBigInt = ethers.utils.parseUnits(
      spendingAmount.toString(),
      decimals
    );

    console.log(
      `Token (${symbol}) Allowance: ${ethers.utils.formatUnits(
        currentAllowance,
        decimals
      )}`
    );

    // Check if approval is needed
    if (currentAllowance < spendingAmountBigInt) {
      console.log(`Insufficient allowance, getting approval for ${symbol}...`);

      // Send approval transaction
      const tx = await tokenContract.approve(
        spenderAddress,
        spendingAmountBigInt
      );
      console.log(`Approve transaction submitted with hash: ${tx.hash}`);

      // Wait for confirmation (optional)
      await tx.wait();
      console.log(`Approval transaction confirmed for ${symbol}`);

      return {
        success: true,
        needsApproval: true,
        txHash: tx.hash,
      };
    } else {
      console.log(`Sufficient allowance already exists for ${symbol}`);
      return {
        success: true,
        needsApproval: false,
      };
    }
  } catch (error) {
    console.error("Error in getTokenApprovalEthers:", error);
    return {
      success: false,
      needsApproval: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// Alternative: Get signer from wagmi connector (if you're using both)
export async function getSignerFromWagmi(): Promise<ethers.Signer | null> {
  try {
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      return await provider.getSigner();
    }
  } catch (error) {
    console.error("Error getting signer from wagmi:", error);
  }
  return null;
}

export function countDecimals(x: number) {
  if (Math.floor(x) === x) {
    return 0;
  }
  return x.toString().split(".")[1].length || 0;
}

export function fromReadableAmount(amount: number, decimals: number): JSBI {
  const extraDigits = Math.pow(10, countDecimals(amount));
  const adjustedAmount = amount * extraDigits;
  return JSBI.divide(
    JSBI.multiply(
      JSBI.BigInt(adjustedAmount),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
    ),
    JSBI.BigInt(extraDigits)
  );
}

// Types based on actual Aave GraphQL response
type BigDecimal = string | number;
type PercentValue = {
  value: string;
  formatted: string;
  decimals: number;
  raw: string;
};

export interface ExtendedReserve extends Reserve {
  type: "supply" | "borrow";
  marketName: string;
}

/**
 * Utility function to generate user-friendly error messages based on error type
 */
export function getApiErrorMessage(
  error: unknown,
  context: string,
  identifier: string
): string {
  if (!(error instanceof Error)) {
    return `❌ Unknown error occurred while ${context} "${identifier}".`;
  }

  if (
    error.message.includes("fetch failed") ||
    error.message.includes("ETIMEDOUT")
  ) {
    return `⚠️ Network timeout error while ${context} "${identifier}". The CoinGecko API is currently slow or unreachable. Please try again in a few moments.`;
  } else if (
    error.message.includes("ENOTFOUND") ||
    error.message.includes("DNS")
  ) {
    return `🌐 Network connection error while ${context} "${identifier}". Please check your internet connection and try again.`;
  } else if (
    error.message.includes("429") ||
    error.message.includes("rate limit")
  ) {
    return `⏱️ API rate limit exceeded while ${context} "${identifier}". Please wait a moment and try again.`;
  } else if (error.message.includes("404")) {
    return `❌ "${identifier}" not found. Please verify the identifier is correct.`;
  } else if (
    error.message.includes("500") ||
    error.message.includes("502") ||
    error.message.includes("503")
  ) {
    return `🔧 CoinGecko API is currently experiencing issues while ${context} "${identifier}". Please try again later.`;
  } else {
    return `❌ Error ${context} "${identifier}": ${error.message}`;
  }
}

export const toBigDecimalNumber = (value: BigDecimal): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const formatNumber = (
  value: BigDecimal | undefined | null | Record<string, unknown>
): string => {
  if (value === undefined || value === null) return "N/A";

  // Handle DecimalValue object (like supplyInfo.total)
  if (typeof value === "object" && value !== null && "value" in value) {
    const num = toBigDecimalNumber(value.value as BigDecimal);
    if (isNaN(num) || num === 0) return "N/A";
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return `${num.toFixed(2)}`;
  }

  // Handle TokenAmount object (like borrowInfo.total) - use usd property
  if (typeof value === "object" && value !== null && "usd" in value) {
    const num = toBigDecimalNumber(value.usd as BigDecimal);
    if (isNaN(num) || num === 0) return "N/A";
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return `${num.toFixed(2)}`;
  }

  // Handle TokenAmount object - use amount property as fallback
  if (typeof value === "object" && value !== null && "amount" in value) {
    const num = toBigDecimalNumber(value.amount as BigDecimal);
    if (isNaN(num) || num === 0) return "N/A";
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return `${num.toFixed(2)}`;
  }

  const num = toBigDecimalNumber(value as BigDecimal);
  if (isNaN(num) || num === 0) return "N/A";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return `${num.toFixed(2)}`;
};

export const formatPercentage = (
  value: PercentValue | string | number | undefined
): string => {
  if (value === null || value === undefined) return "N/A";

  // Handle object with value property (PercentValue type)
  if (typeof value === "object" && value !== null && "value" in value) {
    const numericValue = parseFloat(value.value);
    // Convert from decimal to percentage (multiply by 100)
    const percentageValue = numericValue * 100;
    return `${percentageValue.toFixed(2)}%`;
  }

  // Handle string/number (assuming these are already in percentage format)
  const numericValue =
    typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(numericValue)) return "N/A";

  return `${numericValue.toFixed(2)}%`;
};

export const formatCurrency = (
  value: BigDecimal | string | number | undefined
): string => {
  return formatNumber(value as BigDecimal);
};
