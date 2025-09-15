"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useAppKitAccount } from "@reown/appkit/react";
import toast from "react-hot-toast";
import { getRiskLevelColor } from "@/utils/constants";
import { getStrategyById } from "@/actions/strategies";
import type { Strategy } from "@/types/strategy";
import type { Transaction } from "@/types/transaction";
import StrategyOverviewModal, {
  type TabKey,
} from "@/components/StrategyOverviewModal";
import { getBalance } from "@/agents/wallet";
import { get, set } from "@/utils/redis";
import {
  allocateUserStrategy,
  deallocateUserStrategy,
  getUserStrategyAllocation,
  getUserTotalAllocation,
  getUserStrategyTransactions,
  getStrategyAUM,
} from "@/actions/strategies";
import { formatAUMValue } from "@/lib/utils";
import {
  calculatePnlFromHistory,
  formatPnlPercentage,
  getPnlColorClass,
} from "@/utils/pnlCalculator";

// Type for API error responses
interface ApiError {
  response?: {
    data?: {
      msg?: string;
    };
  };
}

// Helpers
const SidebarCard = ({ title, icon }: { title: string; icon?: string }) => (
  <div className="flex items-center px-3 py-2 justify-between bg-[#27292B] border border-[#d9d9d9]/40 rounded-[12px] w-full h-[36px]">
    <span className="text-white text-sm font-medium">{title}</span>
    {icon && (
      <Icon icon={icon} className="text-[#ffffff]" width={16} height={16} />
    )}
  </div>
);

const StrategyDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const { address, isConnected } = useAppKitAccount();

  // Strategy state - will be fetched from database
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch strategy from database
  const fetchStrategy = useCallback(async () => {
    if (!params?.id) {
      // No strategy id in params — clear loading so the UI doesn't hang
      setLoading(false);
      setError("No strategy id provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert slug back to strategy ID
      const strategyId = params.id;
      const result = await getStrategyById(strategyId);
      console.log(result, "res");

      if (result.success && result.strategy) {
        setStrategy(result.strategy);
        setLoading(false);
      } else {
        setError(result.message || "Strategy not found");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching strategy from database:", error);
      setError("Failed to load strategy data");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  // Input state (ETH)
  const [amountUSDT, setAmountUsdt] = useState<string>("");
  const minUSDT = 20;
  const [modalTab, setModalTab] = useState<TabKey | null>(null);

  // Exchange selection state
  const [selectedExchange, setSelectedExchange] = useState<
    "Bybit" | "Binance" | null
  >(null);

  // Amount validation state
  const [showAmountError, setShowAmountError] = useState<boolean>(false);
  const [showBalanceError, setShowBalanceError] = useState<boolean>(false);
  const [showExchangeError, setShowExchangeError] = useState<boolean>(false);

  // Exchange balances state
  const [bybitBalance, setBybitBalance] = useState<string>("0.00");
  const [binanceBalance, setBinanceBalance] = useState<string>("0.00");
  const [loadingBalances, setLoadingBalances] = useState<boolean>(false);

  // User's allocated funds state
  const [userAllocatedFunds, setUserAllocatedFunds] = useState<number>(0);
  const [totalAllocatedFunds, setTotalAllocatedFunds] = useState<number>(0);
  const [totalByExchange, setTotalByExchange] = useState<{
    Bybit: number;
    Binance: number;
  }>({ Bybit: 0, Binance: 0 });
  const [loadingAllocation, setLoadingAllocation] = useState<boolean>(false);

  // Transaction history state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] =
    useState<boolean>(false);

  // AUM (Assets Under Management) state
  const [strategyAUM, setStrategyAUM] = useState<number>(0);
  const [loadingAUM, setLoadingAUM] = useState<boolean>(false);

  // Deallocation state
  const [amountUSDTDeallocation, setAmountUsdtDeallocation] =
    useState<string>("");
  const [showAmountErrorDeallocation, setShowAmountErrorDeallocation] =
    useState<boolean>(false);

  // Calculate PNL data from strategy history if strategy exists
  const pnlData = strategy
    ? calculatePnlFromHistory(strategy.history || [])
    : {
        totalPnl: 0,
        pnl24h: 0,
        pnl7d: 0,
      };

  // Get the balance for the selected exchange
  const getSelectedExchangeBalance = () => {
    if (selectedExchange === "Bybit") return parseFloat(bybitBalance);
    if (selectedExchange === "Binance") return parseFloat(binanceBalance);
    return 0;
  };

  // Check if the selected exchange has sufficient balance considering already allocated funds across ALL strategies
  const hasInsufficientBalance = () => {
    if (!selectedExchange || !amountUSDT) return false;
    const enteredAmount = parseFloat(amountUSDT);
    const availableBalance = getSelectedExchangeBalance();
    // Use total allocated funds for the selected exchange across all strategies
    const exchangeAllocatedFunds = totalByExchange[selectedExchange] || 0;
    const totalRequiredFunds = exchangeAllocatedFunds + enteredAmount;
    return totalRequiredFunds > availableBalance;
  };

  // Update canAllocate to include balance validation
  const canAllocate =
    Number(amountUSDT || 0) >= minUSDT &&
    selectedExchange &&
    !hasInsufficientBalance() &&
    !showExchangeError;

  // Check if can deallocate
  const canDeallocate =
    Number(amountUSDTDeallocation || 0) > 0 &&
    Number(amountUSDTDeallocation || 0) <= userAllocatedFunds &&
    !showAmountErrorDeallocation;

  // Handle amount input change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow only numbers and decimal points
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    } else {
      value = numericValue;
    }

    setAmountUsdt(value);

    // Show error if amount is entered but no exchange selected (HIGHEST PRIORITY)
    if (value && Number(value) > 0 && !selectedExchange) {
      setShowExchangeError(true);
      setShowAmountError(false);
      setShowBalanceError(false);
      return;
    } else {
      setShowExchangeError(false);
    }

    // Show error if amount is entered but less than minimum (SECOND PRIORITY)
    if (value && Number(value) > 0 && Number(value) < minUSDT) {
      setShowAmountError(true);
      setShowBalanceError(false); // Clear balance error when amount error is active
    } else {
      setShowAmountError(false);

      // Only check balance sufficiency if amount is valid (THIRD PRIORITY)
      if (value && selectedExchange && Number(value) >= minUSDT) {
        const enteredAmount = parseFloat(value);
        const availableBalance = getSelectedExchangeBalance();
        // Use total allocated funds for the selected exchange across all strategies
        const exchangeAllocatedFunds = totalByExchange[selectedExchange] || 0;
        const totalRequiredFunds = exchangeAllocatedFunds + enteredAmount;
        const hasInsufficientBalance = totalRequiredFunds > availableBalance;

        // Debug logging
        console.log("Balance validation:", {
          enteredAmount,
          availableBalance,
          exchangeAllocatedFunds,
          totalRequiredFunds,
          hasInsufficientBalance,
          selectedExchange,
          totalByExchange,
        });

        setShowBalanceError(hasInsufficientBalance);
      } else {
        setShowBalanceError(false);
      }
    }
  };

  // Handle deallocation amount input change with validation
  const handleDeallocationAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value;

    // Allow only numbers and decimal points
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    } else {
      value = numericValue;
    }

    setAmountUsdtDeallocation(value);

    // Show error if amount is more than allocated
    const enteredAmount = parseFloat(value || "0");
    setShowAmountErrorDeallocation(enteredAmount > userAllocatedFunds);
  };

  // Handle exchange selection with balance validation
  const handleExchangeSelection = (exchange: "Bybit" | "Binance") => {
    setSelectedExchange(exchange);

    // Clear exchange error when exchange is selected
    setShowExchangeError(false);

    // Re-validate when exchange changes, respecting error priority
    if (amountUSDT) {
      // First check if amount is below minimum
      if (Number(amountUSDT) > 0 && Number(amountUSDT) < minUSDT) {
        setShowAmountError(true);
        setShowBalanceError(false);
      } else if (Number(amountUSDT) >= minUSDT) {
        setShowAmountError(false);

        // Only check balance if amount is valid
        const enteredAmount = parseFloat(amountUSDT);
        const availableBalance =
          exchange === "Bybit"
            ? parseFloat(bybitBalance)
            : parseFloat(binanceBalance);
        // Use total allocated funds for the selected exchange across all strategies
        const exchangeAllocatedFunds = totalByExchange[exchange] || 0;
        const totalRequiredFunds = exchangeAllocatedFunds + enteredAmount;
        const hasInsufficientBalance = totalRequiredFunds > availableBalance;

        // Debug logging
        console.log("Exchange selection validation:", {
          enteredAmount,
          availableBalance,
          exchangeAllocatedFunds,
          totalRequiredFunds,
          hasInsufficientBalance,
          exchange,
          totalByExchange,
        });

        setShowBalanceError(hasInsufficientBalance);
      }
    }
  };

  // Fetch user's allocated funds for this strategy and total allocation across all strategies
  const fetchUserAllocation = useCallback(async () => {
    if (!address || !isConnected || !strategy) {
      setUserAllocatedFunds(0);
      setTotalAllocatedFunds(0);
      setTotalByExchange({ Bybit: 0, Binance: 0 });
      return;
    }

    setLoadingAllocation(true);
    try {
      // Fetch total allocation across all strategies
      const totalResult = await getUserTotalAllocation({
        walletAddress: address,
      });

      if (totalResult.success) {
        setTotalAllocatedFunds(totalResult.totalAllocated || 0);
        setTotalByExchange(
          totalResult.totalByExchange || { Bybit: 0, Binance: 0 }
        );
      } else {
        console.error("Error fetching total allocation:", totalResult.message);
        setTotalAllocatedFunds(0);
        setTotalByExchange({ Bybit: 0, Binance: 0 });
      }

      // Fetch allocation for current strategy
      const strategyResult = await getUserStrategyAllocation({
        walletAddress: address,
        strategyId: strategy.title.toLowerCase().replace(/\s+/g, "-"),
      });

      if (strategyResult.success) {
        setUserAllocatedFunds(strategyResult.totalAllocated || 0);
      } else {
        console.error(
          "Error fetching strategy allocation:",
          strategyResult.message
        );
        setUserAllocatedFunds(0);
      }
    } catch (error) {
      console.error("Error fetching user allocation:", error);
      setUserAllocatedFunds(0);
      setTotalAllocatedFunds(0);
      setTotalByExchange({ Bybit: 0, Binance: 0 });
    } finally {
      setLoadingAllocation(false);
    }
  }, [address, isConnected, strategy]);

  // Fetch user's transaction history for this strategy
  const fetchUserTransactions = useCallback(async () => {
    if (!address || !isConnected || !strategy) {
      setTransactions([]);
      return;
    }

    setLoadingTransactions(true);
    try {
      const result = await getUserStrategyTransactions({
        walletAddress: address,
        strategyId: strategy.title.toLowerCase().replace(/\s+/g, "-"),
      });

      if (result.success) {
        setTransactions(result.transactions || []);
      } else {
        console.error("Error fetching transactions:", result.message);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [address, isConnected, strategy]);

  // Fetch strategy AUM (Assets Under Management)
  const fetchStrategyAUM = useCallback(async () => {
    if (!strategy) {
      setStrategyAUM(0);
      return;
    }

    setLoadingAUM(true);
    try {
      const strategyId = strategy.title.toLowerCase().replace(/\s+/g, "-");
      const result = await getStrategyAUM(strategyId);

      if (result.success) {
        setStrategyAUM(result.totalAUM || 0);
      } else {
        console.error("Error fetching strategy AUM:", result.message);
        setStrategyAUM(0);
      }
    } catch (error) {
      console.error("Error fetching strategy AUM:", error);
      setStrategyAUM(0);
    } finally {
      setLoadingAUM(false);
    }
  }, [strategy]);

  // Cache keys for Redis
  const getCacheKey = useCallback(
    (exchange: string) => `balance_${exchange.toLowerCase()}_${address}`,
    [address]
  );
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Fetch exchange balances with Redis caching
  const fetchBalances = useCallback(
    async (forceRefresh = false) => {
      if (!address || !isConnected) {
        setBybitBalance("0.00");
        setBinanceBalance("0.00");
        return;
      }

      setLoadingBalances(true);

      try {
        const exchanges = ["Bybit", "Binance"];
        const apiKeyErrors: string[] = [];
        const fetchErrors: string[] = [];

        const balancePromises = exchanges.map(async (exchange) => {
          const cacheKey = getCacheKey(exchange);

          // Try to get from cache first (unless forcing refresh)
          if (!forceRefresh) {
            try {
              const cachedData = await get(cacheKey, "balances");
              if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const now = Date.now();
                if (now - parsed.timestamp < CACHE_DURATION) {
                  return { exchange, balance: parsed.balance, fromCache: true };
                }
              }
            } catch (cacheError) {
              console.log(`Cache miss for ${exchange}:`, cacheError);
            }
          }

          // Fetch fresh data
          try {
            const balance = await getBalance(exchange, address);
            const balanceStr = parseFloat(balance || "0").toFixed(2);

            // Cache the result
            const cacheData = {
              balance: balanceStr,
              timestamp: Date.now(),
            };
            await set(cacheKey, JSON.stringify(cacheData), "balances");

            return { exchange, balance: balanceStr, fromCache: false };
          } catch (error: unknown) {
            // Enhanced error detection for different types of issues
            const errorMessage =
              error instanceof Error
                ? error.message
                : (error as ApiError)?.response?.data?.msg || "";

            console.error(`Error fetching ${exchange} balance:`, error);

            // Check for database/connection issues first
            if (
              errorMessage.includes("querySrv") ||
              errorMessage.includes("ESERVFAIL") ||
              errorMessage.includes("MongoDB") ||
              errorMessage.includes("connection") ||
              errorMessage.includes("timeout")
            ) {
              fetchErrors.push(`${exchange} (Database connection issue)`);
            }
            // Then check for specific API key issues
            else if (
              errorMessage.includes("API key") ||
              errorMessage.includes("keys not found") ||
              errorMessage.includes("configure") ||
              errorMessage.includes("authentication") ||
              errorMessage.includes("unauthorized")
            ) {
              apiKeyErrors.push(exchange);
            } else {
              fetchErrors.push(exchange);
            }
            return { exchange, balance: "0.00", fromCache: false };
          }
        });

        const results = await Promise.all(balancePromises);

        results.forEach(({ exchange, balance }) => {
          if (exchange === "Bybit") {
            setBybitBalance(balance);
          } else if (exchange === "Binance") {
            setBinanceBalance(balance);
          }
        });

        // Show consolidated error messages (only show warnings, not errors for API keys)
        if (apiKeyErrors.length > 0) {
          const exchangesList = apiKeyErrors.join(" and ");
          // Don't show as error toast, just a warning info
          console.warn(`${exchangesList} API keys not configured`);
        }

        if (fetchErrors.length > 0) {
          const exchangesList = fetchErrors.join(" and ");

          // Check if it's a database connection issue
          const isDatabaseIssue = fetchErrors.some((error) =>
            error.includes("Database connection")
          );
          const message = isDatabaseIssue
            ? `Database connection issue. Please try again later.`
            : `Failed to fetch ${exchangesList} balance. Please check your connection.`;

          toast(message, {
            duration: 3000,
            position: "top-right",
            icon: (
              <Icon
                className="text-[#FC5050]"
                icon="material-symbols:warning-rounded"
                width={24}
              />
            ),
            style: {
              background: "#2A0A0A",
              color: "#ffffff",
              fontWeight: "400",
            },
          });
        }

        // Show success message if not from cache and no errors
        const hasErrors = results.some((r) => r.balance === "0.00");
        if (!hasErrors && forceRefresh) {
          toast.success("Balances updated successfully!", {
            duration: 2000,
            position: "top-right",
          });
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
        toast.error("Failed to fetch exchange balances", {
          duration: 3000,
          position: "top-right",
        });
      } finally {
        setLoadingBalances(false);
      }
    },
    [address, isConnected, CACHE_DURATION, getCacheKey]
  ); // Add all dependencies

  useEffect(() => {
    fetchStrategy();
    fetchStrategyAUM(); // Fetch AUM regardless of wallet connection
  }, []);

  useEffect(() => {
    if (address && isConnected) {
      fetchBalances();
      fetchUserAllocation();
      fetchUserTransactions();
    }
  }, [
    address,
    isConnected,
    fetchBalances,
    fetchUserAllocation,
    fetchUserTransactions,
  ]);

  const handleRefreshBalances = () => {
    if (!address || !isConnected) {
      toast.error("Wallet must be connected first", {
        duration: 3000,
        position: "top-right",
      });
      return;
    }
    fetchBalances(true); // Force refresh
  };

  const handleAllocate = async () => {
    if (
      !address ||
      !selectedExchange ||
      Number(amountUSDT) < minUSDT ||
      !strategy
    ) {
      toast.error(
        "Please connect wallet, select an exchange, and enter a valid amount",
        {
          duration: 3000,
          position: "top-right",
        }
      );
      return;
    }

    // Check if user has sufficient balance considering already allocated funds across ALL strategies
    const enteredAmount = Number(amountUSDT);
    const availableBalance = getSelectedExchangeBalance();
    // Use total allocated funds for the selected exchange across all strategies
    const exchangeAllocatedFunds = totalByExchange[selectedExchange] || 0;
    const totalRequiredFunds = exchangeAllocatedFunds + enteredAmount;

    // Check if total required funds exceed available balance
    if (totalRequiredFunds > availableBalance) {
      const remainingBalance = Math.max(
        0,
        availableBalance - exchangeAllocatedFunds
      );
      toast.error(
        `Insufficient balance. You have ${availableBalance} USDT in ${selectedExchange}, with ${exchangeAllocatedFunds} USDT already allocated across all strategies. Available for allocation: ${remainingBalance.toFixed(
          2
        )} USDT`,
        {
          duration: 5000,
          position: "top-right",
        }
      );
      return;
    }

    try {
      // Store strategy allocation in database using server action
      const result = await allocateUserStrategy({
        walletAddress: address,
        strategyId: strategy.title.toLowerCase().replace(/\s+/g, "-"),
        strategyName: strategy.title,
        allocatedFunds: Number(amountUSDT),
        selectedExchange: selectedExchange,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to allocate strategy");
      }

      toast.success(
        `Successfully allocated ${amountUSDT} USDT to ${strategy.title} on ${selectedExchange}!`,
        {
          duration: 4000,
          position: "top-right",
        }
      );

      // Reset form and refresh data
      setAmountUsdt("");
      setSelectedExchange(null);

      // Refresh user allocation data
      fetchUserAllocation();
      fetchUserTransactions();
      fetchStrategyAUM(); // Refresh AUM after successful allocation

      console.log("Strategy allocated:", result);
    } catch (error) {
      console.error("Error allocating strategy:", error);
      toast.error("Failed to allocate strategy. Please try again.", {
        duration: 3000,
        position: "top-right",
      });
    }
  };

  const handleDeallocate = async () => {
    if (!address || Number(amountUSDTDeallocation) <= 0 || !strategy) {
      toast.error("Please connect wallet and enter a valid amount", {
        duration: 3000,
        position: "top-right",
      });
      return;
    }

    // Check if user has sufficient allocated funds
    const enteredAmount = Number(amountUSDTDeallocation);

    if (enteredAmount > userAllocatedFunds) {
      toast.error(
        `Cannot deallocate ${enteredAmount} USDT. You only have ${userAllocatedFunds} USDT allocated to this strategy`,
        {
          duration: 5000,
          position: "top-right",
        }
      );
      return;
    }

    try {
      // Deallocate strategy funds using server action
      const result = await deallocateUserStrategy({
        walletAddress: address,
        strategyId: strategy.title.toLowerCase().replace(/\s+/g, "-"),
        deallocatedFunds: Number(amountUSDTDeallocation),
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to deallocate strategy");
      }

      toast.success(
        `Successfully deallocated ${amountUSDTDeallocation} USDT from ${strategy.title}!`,
        {
          duration: 4000,
          position: "top-right",
        }
      );

      // Reset form and refresh data
      setAmountUsdtDeallocation("");

      // Refresh user allocation data
      fetchUserAllocation();
      fetchUserTransactions();
      fetchStrategyAUM(); // Refresh AUM after successful deallocation

      console.log("Strategy deallocated:", result);
    } catch (error) {
      console.error("Error deallocating strategy:", error);
      toast.error("Failed to deallocate strategy. Please try again.", {
        duration: 3000,
        position: "top-right",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full overflow-y-auto scrollbar-hide px-4 md:px-6 lg:px-8 pb-10">
        <div className="flex items-center gap-2 text-[#9B9D9D] text-sm mb-4">
          <Link href="/trade" className="hover:underline flex items-center">
            <Icon
              className="mr-1"
              icon={"lets-icons:refund-back-light"}
              width={16}
              height={16}
            />{" "}
            Back to Strategies
          </Link>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#6B5CFF] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg">Loading strategy...</p>
            <p className="text-[#9B9D9D] text-sm">Fetching strategy details</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !strategy) {
    return (
      <div className="w-full overflow-y-auto scrollbar-hide px-4 md:px-6 lg:px-8 pb-10">
        <div className="flex items-center gap-2 text-[#9B9D9D] text-sm mb-4">
          <Link href="/trade" className="hover:underline flex items-center">
            <Icon
              className="mr-1"
              icon={"lets-icons:refund-back-light"}
              width={16}
              height={16}
            />{" "}
            Back to Strategies
          </Link>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-[#FC5050] rounded-full flex items-center justify-center">
              <Icon
                icon="material-symbols:error-outline"
                width={24}
                height={24}
                className="text-white"
              />
            </div>
            <p className="text-[#FC5050] text-lg">Strategy not found</p>
            <p className="text-[#9B9D9D] text-sm">
              {error || "The requested strategy could not be found"}
            </p>
            <button
              onClick={fetchStrategy}
              className="mt-4 px-4 py-2 bg-[#6B5CFF] text-white rounded-lg hover:bg-[#584BFF] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto scrollbar-hide px-4 md:px-6 lg:px-8 pb-10">
      {/* Back link */}
      <div className="flex items-center gap-2 text-[#9B9D9D] text-sm ">
        <Link href="/trade" className="hover:underline flex items-center">
          <Icon
            className="mr-1"
            icon={"lets-icons:refund-back-light"}
            width={16}
            height={16}
          />{" "}
          Back to Strategies
        </Link>
      </div>

      <div className="flex flex-col md:flex-row mt-5 items-center gap-6 lg:h-[200px] justify-between">
        {/* Left/Main Column */}
        {/* Header Card */}
        <div className="bg-[#222223] w-full  flex flex-col md:flex-row items-start justify-between py-4 px-8 border h-full flex-1 border-[#474848] rounded-[16px] ">
          <div className=" w-full md:w-[40%]">
            <div className="text-white flex items-start">
              <h6 className="font-semibold text-lg text-white">
                {strategy.title}
              </h6>
              <div className="text-xs w-[57px] h-[24px] bg-[#595656]/17 rounded-[35px] p-2.5 flex items-center justify-center text-[#A79EF5] font-semibold ml-4 my-1">
                {strategy.category}
              </div>
            </div>
            {strategy.subtitle && (
              <div className="text-[#9B9D9D] text-xs">{strategy.subtitle}</div>
            )}
            <div className="flex mt-3 items-center">
              {(Array.isArray(strategy.icon)
                ? strategy.icon
                : [strategy.icon]
              ).map((iconSrc: string, idx: number) => (
                <div
                  key={idx}
                  style={{ zIndex: idx }}
                  className={idx === 0 ? "relative" : "relative -ml-2.5"}
                >
                  <Image
                    src={iconSrc}
                    alt={`${strategy.title} icon ${idx + 1}`}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                </div>
              ))}
            </div>
            <div className="flex  mt-3 relative  justify-between items-center">
              <div className="w-[125px]  md:w-[152px]   p-1 h-[46px] rounded-xl bg-[#1e1f1f] border-[0.5px] border-[#d9d9d9]/40">
                <div className="bg-[#303131] flex items-center justify-center w-full h-full rounded-[10px]">
                  <p className="text-[#ADADAD] text-sm font-medium">
                    PNL:{" "}
                    <span
                      className={`ml-1 text-[16px] font-medium ${getPnlColorClass(
                        pnlData.totalPnl
                      )}`}
                    >
                      {formatPnlPercentage(pnlData.totalPnl)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex h-[46px]   items-center  gap-4">
                <div className="flex     h-full justify-around flex-col">
                  <p className="text-xs text-[#9B9D9D] ">24h%</p>
                  <p
                    className={`text-xs  relative right-[16px] flex items-center ${getPnlColorClass(
                      pnlData.pnl24h
                    )}`}
                  >
                    <Icon
                      icon={"icon-park-solid:up-one"}
                      width={16}
                      height={16}
                      className={pnlData.pnl24h < 0 ? "rotate-180" : ""}
                    />
                    {formatPnlPercentage(pnlData.pnl24h)}
                  </p>
                </div>
                <div className="flex  h-full justify-around  flex-col">
                  <p className="text-xs text-[#9B9D9D] ">7d%</p>
                  <p
                    className={`text-xs  relative right-[16px] flex items-center ${getPnlColorClass(
                      pnlData.pnl7d
                    )}`}
                  >
                    <Icon
                      icon={"icon-park-solid:up-one"}
                      width={16}
                      height={16}
                      className={pnlData.pnl7d < 0 ? "rotate-180" : ""}
                    />
                    {formatPnlPercentage(pnlData.pnl7d)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex mt-3 items-center gap-4">
              {strategy.riskLevel && (
                <div
                  className={`text-xs flex items-center ${getRiskLevelColor(
                    strategy.riskLevel
                  )}`}
                >
                  <Icon
                    icon="material-symbols:info-rounded"
                    width={16}
                    className="mr-1"
                  />
                  Risk:{" "}
                  <span className="font-semibold ml-1 text-[10px]">
                    {strategy.riskLevel}
                  </span>
                </div>
              )}
              {strategy.tradeType && (
                <div className="text-xs flex items-center text-white">
                  <Image
                    src="/icons/casino.svg"
                    alt="trade type"
                    width={16}
                    height={16}
                    className="mr-1"
                  />
                  Trade Type:{" "}
                  <span className="ml-1 font-semibold">
                    {strategy.tradeType}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-3 mt-6 md:mt-0 md:w-[55%]">
            {/* AUM Card */}
            <div className="relative flex-1 min-w-[140px] group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#6B5CFF] via-[#A855F7] to-[#06E574] rounded-[11px] opacity-75 group-hover:opacity-100 animate-pulse"></div>
              <div className="relative bg-[#1A1B1B] rounded-[10px] p-3 h-full flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 relative">
                    <Image src="/icons/usdt.svg" alt="usdt" fill />
                  </div>
                  <p className="text-[#9B9D9D] text-xs font-medium">AUM</p>
                </div>
                <h6 className="text-white text-sm font-semibold">
                  {loadingAUM
                    ? "Loading..."
                    : `${formatAUMValue(strategyAUM)} USDT`}
                </h6>
                <p className="text-[#6B6C6C] text-[10px] mt-1">Total Assets</p>
              </div>
            </div>

            {/* Your Allocation Card */}
            <div className="relative flex-1 min-w-[140px] group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#06E574] via-[#00D4FF] to-[#6B5CFF] rounded-[11px] opacity-75 group-hover:opacity-100 animate-gradient-x"></div>
              <div className="relative bg-[#1A1B1B] rounded-[10px] p-3 h-full flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 relative">
                    <Image src="/icons/usdt.svg" alt="usdt" fill />
                  </div>
                  <p className="text-[#9B9D9D] text-xs font-medium">
                    Your Allocation
                  </p>
                </div>
                <h6 className="text-white text-sm font-semibold">
                  {loadingAllocation
                    ? "Loading..."
                    : `${userAllocatedFunds.toLocaleString()} USDT`}
                </h6>
                <p className="text-[#6B6C6C] text-[10px] mt-1">
                  {strategy.title}
                </p>
              </div>
            </div>

            {/* Total Portfolio Card */}
            <div className="relative flex-1 min-w-[160px] group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#A855F7] via-[#F59E0B] to-[#EF4444] rounded-[11px] opacity-75 group-hover:opacity-100 animate-gradient-xy"></div>
              <div className="relative bg-[#1A1B1B] rounded-[10px] p-3 h-full flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 relative">
                    <Image src="/icons/usdt.svg" alt="usdt" fill />
                  </div>
                  <p className="text-[#9B9D9D] text-xs font-medium">
                    Total Portfolio
                  </p>
                </div>
                <h6 className="text-white text-sm font-semibold">
                  {loadingAllocation
                    ? "Loading..."
                    : `${totalAllocatedFunds.toLocaleString()} USDT`}
                </h6>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Image
                      src="https://assets.coingecko.com/markets/images/698/small/bybit_spot.png"
                      alt="Bybit"
                      width={12}
                      height={12}
                      className="rounded-full"
                    />
                    <span className="text-[#6B6C6C] text-[10px]">
                      {totalByExchange.Bybit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="https://assets.coingecko.com/markets/images/52/small/binance.jpg"
                      alt="Binance"
                      width={12}
                      height={12}
                      className="rounded-full"
                    />
                    <span className="text-[#6B6C6C] text-[10px]">
                      {totalByExchange.Binance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right/Sidebar */}
        <div className="flex bg-[#222223] gap-2.5 w-full md:w-auto min-w-[261px] border h-full  border-[#474848] rounded-[16px] p-2.5 justify-center flex-col">
          <button onClick={() => setModalTab("Overview")} className="text-left">
            <SidebarCard title="Overview" icon="qlementine-icons:key-cmd-16" />
          </button>
          <button
            onClick={() => setModalTab("Activities")}
            className="text-left"
          >
            <SidebarCard
              title="Activities"
              icon="hugeicons:computer-activity"
            />
          </button>
          <button
            onClick={() => setModalTab("Transactions")}
            className="text-left"
          >
            <SidebarCard
              title="Transactions"
              icon="mingcute:transfer-horizontal-line"
            />
          </button>
        </div>
      </div>

      {/* Your Position */}
      <div className="mt-10">
        <div className="text-white font-semibold mb-3">Your Position</div>

        <div className="bg-[#222223]  border border-[#474848] rounded-[16px] p-4">
          <div className="">
            <div className="flex  flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center bg-[#1E1F1F] border-[0.5px] border-[#d9d9d9]/40 rounded-[12px] px-3 h-[52px] min-h-[52px]">
                <div className="flex w-[92px] h-[37px] rounded-[10px] bg-[#303131] items-center justify-center gap-2 mr-3">
                  <Image
                    src="/icons/usdt.svg"
                    alt="USDT"
                    width={26}
                    height={26}
                  />
                  <p className=" text-[#ADADAD]  font-medium ">USDT</p>
                </div>
                <input
                  value={amountUSDT}
                  onChange={handleAmountChange}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  placeholder="Enter Amount"
                  className="flex-1 appearance-none bg-transparent outline-none text-white placeholder:text-[#9B9D9D]"
                />
              </div>
              <button
                disabled={!canAllocate}
                onClick={handleAllocate}
                className={`h-[52px] cursor-pointer rounded-[12px] px-4 font-semibold transition-colors ${
                  canAllocate
                    ? "bg-[#6B5CFF] text-white hover:bg-[#584BFF]"
                    : "bg-[#3A3B3B] text-[#9B9D9D] cursor-not-allowed"
                }`}
              >
                Allocate Funds
              </button>
            </div>
            <div className="flex items-center justify-between">
              {/* Exchange Balances */}
              <div className="flex items-center gap-4 mt-2">
                {/* Bybit Balance */}
                <div
                  className={`flex items-center gap-2 border rounded-[8px] px-3 py-1.5 cursor-pointer transition-all duration-200 relative ${
                    selectedExchange === "Bybit"
                      ? "bg-[#1E1F1F] border-[#06E574]"
                      : "bg-[#1E1F1F] border-[#3A3B3B] hover:border-[#4A4B4B]"
                  }`}
                  onClick={() => handleExchangeSelection("Bybit")}
                >
                  {/* Green selection indicator */}
                  {selectedExchange === "Bybit" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#06E574] rounded-full border-2 border-[#222223]"></div>
                  )}
                  <Image
                    src="https://assets.coingecko.com/markets/images/698/small/bybit_spot.png"
                    alt="Bybit"
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="text-[8px] text-[#9B9D9D]">Bybit</span>
                    <span
                      className={`text-[10px] font-medium ${
                        selectedExchange === "Bybit" && showBalanceError
                          ? "text-[#FC5050]"
                          : "text-white"
                      }`}
                    >
                      {loadingBalances ? "..." : `${bybitBalance} USDT`}
                    </span>
                  </div>
                </div>

                {/* Binance Balance */}
                <div
                  className={`flex items-center gap-2 border rounded-[8px] px-3 py-1.5 cursor-pointer transition-all duration-200 relative ${
                    selectedExchange === "Binance"
                      ? "bg-[#1E1F1F] border-[#06E574]"
                      : "bg-[#1E1F1F] border-[#3A3B3B] hover:border-[#4A4B4B]"
                  }`}
                  onClick={() => handleExchangeSelection("Binance")}
                >
                  {/* Green selection indicator */}
                  {selectedExchange === "Binance" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#06E574] rounded-full border-2 border-[#222223]"></div>
                  )}
                  <Image
                    src="https://assets.coingecko.com/markets/images/52/small/binance.jpg"
                    alt="Binance"
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="text-[8px] text-[#9B9D9D]">Binance</span>
                    <span
                      className={`text-[10px] font-medium ${
                        selectedExchange === "Binance" && showBalanceError
                          ? "text-[#FC5050]"
                          : "text-white"
                      }`}
                    >
                      {loadingBalances ? "..." : `${binanceBalance} USDT`}
                    </span>
                  </div>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefreshBalances}
                  disabled={loadingBalances}
                  className="p-1.5 bg-[#1E1F1F] border border-[#3A3B3B] rounded-[6px] hover:bg-[#262727] cursor-pointer transition-colors disabled:opacity-50"
                  title={
                    !isConnected
                      ? "Connect wallet to refresh balances"
                      : "Refresh balances"
                  }
                >
                  <Icon
                    icon={
                      loadingBalances
                        ? "eos-icons:loading"
                        : "material-symbols:refresh"
                    }
                    width={12}
                    height={12}
                    className="text-[#9B9D9D]"
                  />
                </button>
              </div>
              <div className="text-[10px] text-[#9B9D9D] mt-2">
                <span
                  className={`transition-all duration-200 ${
                    showExchangeError || showAmountError || showBalanceError
                      ? "text-[#FC5050]"
                      : "text-[#9B9D9D]"
                  }`}
                >
                  {showExchangeError
                    ? "Kindly select your exchange"
                    : showAmountError
                    ? `Minimum of ${minUSDT} USDT is required for this strategy`
                    : showBalanceError && selectedExchange
                    ? `Insufficient balance. You have ${getSelectedExchangeBalance()} USDT in ${selectedExchange}, with ${
                        totalByExchange[selectedExchange] || 0
                      } USDT already allocated across all strategies. Available: ${Math.max(
                        0,
                        getSelectedExchangeBalance() -
                          (totalByExchange[selectedExchange] || 0)
                      ).toFixed(2)} USDT`
                    : ``}
                </span>
              </div>
            </div>
          </div>

          {/* Deallocation Section */}
          {userAllocatedFunds > 0 && (
            <div className="mt-6 border-t border-[#3A3B3B] pt-6">
              <div className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                <Icon
                  icon="material-symbols:trending-down"
                  width={20}
                  height={20}
                  className="text-[#FC5050]"
                />
                Deallocate Funds
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center bg-[#1E1F1F] border-[0.5px] border-[#d9d9d9]/40 rounded-[12px] px-3 h-[52px] min-h-[52px]">
                  <div className="flex w-[92px] h-[37px] rounded-[10px] bg-[#303131] items-center justify-center gap-2 mr-3">
                    <Image
                      src="/icons/usdt.svg"
                      alt="USDT"
                      width={26}
                      height={26}
                    />
                    <p className="text-[#ADADAD] font-medium">USDT</p>
                  </div>
                  <input
                    value={amountUSDTDeallocation}
                    onChange={handleDeallocationAmountChange}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    placeholder={`Max: ${userAllocatedFunds} USDT`}
                    className="flex-1 appearance-none bg-transparent outline-none text-white placeholder:text-[#9B9D9D]"
                  />
                </div>
                <button
                  disabled={!canDeallocate}
                  onClick={handleDeallocate}
                  className={`h-[52px] cursor-pointer rounded-[12px] px-4 font-semibold transition-colors ${
                    canDeallocate
                      ? "bg-[#FC5050] text-white hover:bg-[#E04545]"
                      : "bg-[#3A3B3B] text-[#9B9D9D] cursor-not-allowed"
                  }`}
                >
                  Deallocate
                </button>
              </div>
              {showAmountErrorDeallocation && (
                <div className="text-[10px] text-[#FC5050] mt-2">
                  Cannot deallocate more than your current allocation of{" "}
                  {userAllocatedFunds} USDT
                </div>
              )}
              <div className="text-[10px] text-[#6B6C6C] mt-1">
                Currently allocated: {userAllocatedFunds.toLocaleString()} USDT
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="mt-4">
            <div className="text-white font-medium text-sm mb-2">
              Transaction History
            </div>
            <div className="h-60 lg:h-[18vh] overflow-y-auto scrollbar-hide pr-2">
              {/* Live transaction data */}
              {loadingTransactions ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1E1F1F] border border-[#3A3B3B] flex items-center justify-center mb-3">
                    <Icon
                      icon="eos-icons:loading"
                      width={20}
                      height={20}
                      className="text-[#6B5CFF] animate-spin"
                    />
                  </div>
                  <p className="text-[#9B9D9D] text-sm mb-1">
                    Loading transactions...
                  </p>
                  <p className="text-[#6B6C6C] text-xs">
                    Fetching your transaction history
                  </p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1E1F1F] border border-[#3A3B3B] flex items-center justify-center mb-3">
                    <Icon
                      icon="mingcute:transfer-horizontal-line"
                      width={20}
                      height={20}
                      className="text-[#6B6C6C]"
                    />
                  </div>
                  <p className="text-[#9B9D9D] text-sm mb-1">
                    No transactions yet
                  </p>
                  <p className="text-[#6B6C6C] text-xs">
                    {userAllocatedFunds === 0
                      ? "Allocate funds to this strategy to start seeing transaction history"
                      : "Your transactions will appear here once trading begins"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
                    >
                      <div className="flex flex-col bg-[#262727] border border-[#3A3B3B] rounded-[8px] px-3 py-2 min-w-[100px]">
                        <span className="text-[#9B9D9D] text-[10px]">
                          Asset
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {transaction.asset}
                        </span>
                      </div>
                      <div className="flex flex-col bg-[#262727] border border-[#3A3B3B] rounded-[8px] px-3 py-2 min-w-[100px]">
                        <span className="text-[#9B9D9D] text-[10px]">
                          Amount
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {transaction.amount}
                        </span>
                      </div>
                      <div className="flex flex-col bg-[#262727] border border-[#3A3B3B] rounded-[8px] px-3 py-2 min-w-[100px]">
                        <span className="text-[#9B9D9D] text-[10px]">
                          Entry Price
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {transaction.entryPrice}
                          </span>
                          <span className="text-[#9B9D9D] text-[8px]">
                            {transaction.entryDate.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col bg-[#262727] border border-[#3A3B3B] rounded-[8px] px-3 py-2 min-w-[100px]">
                        <span className="text-[#9B9D9D] text-[8px]">
                          Exit Price
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {transaction.exitPrice}
                          </span>
                          <span className="text-[#9B9D9D] text-[10px]">
                            {transaction?.exitDate?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col bg-[#262727] border border-[#3A3B3B] rounded-[8px] px-3 py-2 min-w-[100px]">
                        <span className="text-[#9B9D9D] text-[10px]">Type</span>
                        <div className="flex items-center gap-1">
                          {transaction.type === "buy" && (
                            <Icon
                              icon="icon-park-solid:up-one"
                              width={12}
                              height={12}
                              className="text-[#06E574]"
                            />
                          )}
                          {transaction.type === "sell" && (
                            <Icon
                              icon="icon-park-solid:up-one"
                              width={12}
                              height={12}
                              className="text-[#FC5050] rotate-180"
                            />
                          )}
                          <span className="text-sm font-semibold text-white">
                            {transaction.type === "buy" ? "Buy" : "Sell"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col bg-[#262727] border border-[#3A3B3B] rounded-[8px] px-3 py-2 min-w-[100px]">
                        <span className="text-[#9B9D9D] text-[10px]">PNL</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              transaction.pnl > 0
                                ? "text-[#06E574]"
                                : transaction.pnl < 0
                                ? "text-[#FC5050]"
                                : "text-white"
                            }`}
                          >
                            {transaction.pnl
                              ? `${transaction?.pnl?.toFixed(2)}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Commented out dummy data for testing purposes */}
              {/* 
              <div className="space-y-3">
                {DUMMY_TRANSACTIONS.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
                  >
                    <Metric label="Asset" value={transaction.asset} />
                    <Metric label="Amount" value={transaction.amount} />
                    <Metric
                      label="Entry Price"
                      value={transaction.entryPrice}
                      subtitle={transaction.entryDate}
                    />
                    <Metric
                      label="Exit Price"
                      value={transaction.exitPrice}
                      subtitle={transaction.exitDate}
                    />
                    <Metric
                      label="Type"
                      value={transaction.type === "buy" ? "Buy" : "Sell"}
                      type={transaction.type}
                    />
                    <Metric label="PNL" value={transaction.pnl} type="pnl" />
                  </div>
                ))}
              </div>
              */}
            </div>
          </div>

          {/* Wallet Compatibility */}
          <div className="mt-6">
            <div className="text-[#E8BF3D] font-medium text-[18px] mb-1 flex items-center gap-2">
              <Icon icon="material-symbols:info-rounded" width={24} />
              Wallet Compatibility
            </div>
            <p className="text-[#9B9D9D] text-xs">
              {strategy.compatibility ||
                "Compatible with all major wallets including MetaMask, Trust Wallet, and Coinbase Wallet."}
            </p>
          </div>
        </div>
      </div>
      <StrategyOverviewModal
        isOpen={modalTab !== null}
        onClose={() => setModalTab(null)}
        strategyId={params?.id || ""}
        initialTab={modalTab || "Overview"}
      />
    </div>
  );
};

export default StrategyDetailsPage;
