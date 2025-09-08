import { useCallback, useEffect, useState } from "react";
import {
  getUserApiKeys,
  uploadApiKeys,
  deleteUserApiKeys,
} from "@/actions/keys";
import toast from "react-hot-toast";

export type ExchangeKeys = {
  binance: { apiKey: string; secretKey: string };
  bybit: { apiKey: string; secretKey: string };
};

const defaultKeys: ExchangeKeys = {
  binance: { apiKey: "", secretKey: "" },
  bybit: { apiKey: "", secretKey: "" },
};

export function useExchangeKeys(address?: string) {
  const [keys, setKeys] = useState<ExchangeKeys>(defaultKeys);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load keys from database when address is available
  useEffect(() => {
    if (!address) {
      setKeys(defaultKeys);
      setIsInitialized(true);
      return;
    }

    const loadKeysFromDB = async () => {
      setIsLoading(true);
      try {
        const result = await getUserApiKeys(address);
        if (result.success && result.keys) {
          setKeys(result.keys);
        } else {
          setKeys(defaultKeys);
        }
      } catch (error) {
        console.error("Error loading keys from database:", error);
        setKeys(defaultKeys);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadKeysFromDB();
  }, [address]);

  const save = useCallback(
    async (next: ExchangeKeys) => {
      setKeys(next);

      if (address) {
        try {
          const result = await uploadApiKeys({ address, keys: next });
          if (!result.success) {
            toast.error("Failed to save keys to database");
          }
        } catch (error) {
          console.error("Error saving keys:", error);
          toast.error("Failed to save keys to database");
        }
      }
    },
    [address]
  );

  const update = useCallback(
    async (partial: Partial<ExchangeKeys>) => {
      const next: ExchangeKeys = {
        binance: {
          apiKey: partial.binance?.apiKey ?? keys.binance.apiKey,
          secretKey: partial.binance?.secretKey ?? keys.binance.secretKey,
        },
        bybit: {
          apiKey: partial.bybit?.apiKey ?? keys.bybit.apiKey,
          secretKey: partial.bybit?.secretKey ?? keys.bybit.secretKey,
        },
      };

      setKeys(next);

      if (address) {
        try {
          const result = await uploadApiKeys({ address, keys: next });
          if (!result.success) {
            toast.error("Failed to save keys to database");
          }
        } catch (error) {
          console.error("Error saving keys:", error);
          toast.error("Failed to save keys to database");
        }
      }
    },
    [keys, address]
  );

  const clear = useCallback(async () => {
    setKeys(defaultKeys);

    if (address) {
      try {
        const result = await deleteUserApiKeys(address);
        if (!result.success) {
          toast.error("Failed to delete keys from database");
        }
      } catch (error) {
        console.error("Error deleting keys:", error);
        toast.error("Failed to delete keys from database");
      }
    }
  }, [address]);

  return { keys, save, update, clear, isLoading, isInitialized };
}
