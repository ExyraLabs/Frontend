"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useAppKitAccount } from "@reown/appkit/react";
import { getBalance } from "./wallet";

export default function Binance() {
  const { address } = useAppKitAccount();

  useCopilotAction({
    name: "Balance_Binance",
    description:
      "Get the current account balance from Binance exchange. Returns the available balance in USDT. Requires user to have configured their Binance API keys.",
    parameters: [],
    handler: async () => {
      try {
        console.log(`[Balance_Binance] Called with address: ${address}`);

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to access Binance balance.`,
          };
        }

        const balance = await getBalance("Binance", address);

        if (balance === undefined || balance === null) {
          return {
            error: true,
            message: `❌ Failed to retrieve balance from Binance. Please check your API credentials and network connection.`,
          };
        }

        let result = `💰 **Binance Account Balance**:\n\n`;
        result += `💵 Available Balance: $${parseFloat(balance).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )} USDT\n\n`;
        result += `📊 Exchange: Binance\n`;
        result += `⏰ Retrieved at: ${new Date().toLocaleString()}\n\n`;
        result += `💡 This balance represents your available trading funds in USDT.`;

        console.log(
          `[Balance_Binance] Successfully retrieved balance: $${balance} from Binance`
        );
        return result;
      } catch (error) {
        console.error(`[Balance_Binance] Error:`, error);
        const errorMsg = `❌ Error retrieving balance from Binance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        return {
          error: true,
          message: errorMsg,
        };
      }
    },
  });

  return null; // This component doesn't render anything
}
