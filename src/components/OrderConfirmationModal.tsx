import React, { useState, useEffect } from "react";
import { fetchMarketDataWithRetry } from "../constants/exchange";
import { getSymbolLeverage } from "../agents/wallet";
import { useAppKitAccount } from "@reown/appkit/react";

interface OrderParams {
  symbol: string;
  side: string;
  amount: string;
  leverage?: number;
  currentLeverage?: number;
  takeProfitPrice?: string;
  stopLossPrice?: string;
  takeProfitPercent?: number;
  stopLossPercent?: number;
  currentPrice?: number;
  quantity?: string;
  positionValue?: number;
  exchange: "Binance" | "Bybit";
}

interface OrderConfirmationModalProps {
  orderParams: OrderParams;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  orderParams,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [showExplanations, setShowExplanations] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>(
    orderParams.currentPrice
  );
  const [currentLeverage, setCurrentLeverage] = useState<number | undefined>(
    orderParams.currentLeverage
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { address } = useAppKitAccount();

  const {
    symbol,
    side,
    amount,
    leverage,
    takeProfitPrice,
    stopLossPrice,
    takeProfitPercent,
    stopLossPercent,
    exchange,
  } = orderParams;

  // Calculate derived values
  const leverageMultiplier = leverage || currentLeverage || 1;
  const positionValue = parseFloat(amount) * leverageMultiplier;
  const quantity = currentPrice
    ? (positionValue / currentPrice).toFixed(6)
    : undefined;

  useEffect(() => {
    const fetchData = async () => {
      if (!symbol || !address) return;

      setIsLoadingData(true);
      try {
        // Fetch current price
        if (!currentPrice) {
          const marketData = await fetchMarketDataWithRetry(
            { symbol: symbol.toUpperCase(), index: 0 },
            exchange,
            exchange === "Binance" ? "1m" : "1",
            1,
            Date.now() - 60000,
            Date.now()
          );
          if (marketData && marketData[0] && marketData[0][4]) {
            setCurrentPrice(parseFloat(marketData[0][4]));
          }
        }

        // Fetch current leverage for Binance
        if (exchange === "Binance" && !currentLeverage) {
          try {
            const leverageResult = await getSymbolLeverage(
              symbol.toUpperCase(),
              "Binance",
              address
            );
            if (leverageResult?.success && leverageResult.leverage) {
              setCurrentLeverage(leverageResult.leverage);
            }
          } catch (error) {
            console.warn("Failed to fetch current leverage:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch market data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [symbol, address, exchange, currentPrice, currentLeverage]);

  const sideColor = side.toLowerCase().includes("buy")
    ? "text-green-400"
    : "text-red-400";
  const sideIcon = side.toLowerCase().includes("buy") ? "📈" : "📉";

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-gray-500/20 rounded-[20px] p-6 max-w-lg w-full mx-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          Confirm {exchange} Order
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          {exchange}
        </div>
      </div>

      {/* Order Summary */}
      <div className="space-y-4 mb-6">
        {/* Symbol and Side */}
        <div className="bg-[#2A2A2A] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{sideIcon}</span>
              <div>
                <h4 className="text-lg font-semibold text-white">{symbol}</h4>
                <p className={`text-sm font-medium ${sideColor}`}>
                  {side.toUpperCase()} Position
                </p>
              </div>
            </div>
            {currentPrice && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Current Price</p>
                <p className="text-sm text-white font-mono">${currentPrice}</p>
              </div>
            )}
          </div>
        </div>

        {/* Investment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#2A2A2A] rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Investment Amount</p>
            <p className="text-lg font-semibold text-white">${amount} USDT</p>
          </div>

          {quantity && (
            <div className="bg-[#2A2A2A] rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Position Size</p>
              <p className="text-lg font-semibold text-white">
                {parseFloat(quantity).toFixed(6)} {symbol.replace("USDT", "")}
              </p>
            </div>
          )}
        </div>

        {/* Leverage Information */}
        {(leverage || currentLeverage) && (
          <div className="bg-[#2A2A2A] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Leverage</p>
                <div className="flex items-center gap-2">
                  {currentLeverage && leverage !== currentLeverage && (
                    <span className="text-sm text-gray-400 line-through">
                      {currentLeverage}x
                    </span>
                  )}
                  <span className="text-lg font-semibold text-orange-400">
                    {leverage || currentLeverage}x
                  </span>
                  {leverage && leverage !== currentLeverage && (
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                      New
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Position Value</p>
                <p className="text-sm text-white font-mono">
                  ${positionValue.toLocaleString()} USDT
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Risk Management */}
        {(takeProfitPrice ||
          takeProfitPercent ||
          stopLossPrice ||
          stopLossPercent) && (
          <div className="bg-[#2A2A2A] rounded-lg p-4">
            <p className="text-sm font-semibold text-white mb-3">
              🛡️ Risk Management
            </p>
            <div className="space-y-2">
              {(takeProfitPrice || takeProfitPercent) && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Take Profit</span>
                  <span className="text-sm text-green-400 font-mono">
                    {takeProfitPrice
                      ? `$${takeProfitPrice}`
                      : `${takeProfitPercent}%`}
                  </span>
                </div>
              )}
              {(stopLossPrice || stopLossPercent) && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Stop Loss</span>
                  <span className="text-sm text-red-400 font-mono">
                    {stopLossPrice
                      ? `$${stopLossPrice}`
                      : `${stopLossPercent}%`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Educational Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowExplanations(!showExplanations)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          {showExplanations ? "🔼" : "🔽"}
          {showExplanations ? "Hide" : "Show"} Parameter Explanations
        </button>

        {showExplanations && (
          <div className="mt-3 p-4 bg-[#2A2A2A] rounded-lg text-xs text-gray-300 space-y-2">
            <div>
              <strong className="text-white">Position Side:</strong>
              <span
                className={
                  side.toLowerCase().includes("buy")
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {" " + side.toUpperCase()}
              </span>{" "}
              means you&apos;re{" "}
              {side.toLowerCase().includes("buy")
                ? "betting the price will go UP"
                : "betting the price will go DOWN"}
              .
            </div>

            {leverage && (
              <div>
                <strong className="text-white">Leverage ({leverage}x):</strong>
                Multiplies your buying power by {leverage}. Your ${amount}{" "}
                investment controls a ${positionValue?.toLocaleString()}{" "}
                position.
                <span className="text-yellow-400">
                  {" "}
                  Higher leverage = Higher risk & reward!
                </span>
              </div>
            )}

            {(takeProfitPrice || takeProfitPercent) && (
              <div>
                <strong className="text-white">Take Profit:</strong>
                Automatically closes your position when it reaches this
                price/percentage,
                <span className="text-green-400"> securing your gains</span>.
              </div>
            )}

            {(stopLossPrice || stopLossPercent) && (
              <div>
                <strong className="text-white">Stop Loss:</strong>
                Automatically closes your position to
                <span className="text-red-400"> limit your losses</span> if the
                trade goes against you.
              </div>
            )}

            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-300">
              <strong>⚠️ Risk Warning:</strong> Leveraged trading can result in
              significant losses. Never invest more than you can afford to lose.
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading || isConfirming}
          className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading || isConfirming}
          className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isConfirming || isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {isConfirming ? "Sending Order..." : "Creating Order..."}
            </>
          ) : (
            <>🚀 Confirm Order</>
          )}
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmationModal;
