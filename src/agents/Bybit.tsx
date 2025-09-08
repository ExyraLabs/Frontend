"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useAppKitAccount } from "@reown/appkit/react";
import { getBalance } from "./wallet";

export default function Bybit() {
  const { address } = useAppKitAccount();

  useCopilotAction({
    name: "Balance_Bybit",
    description:
      "Get the current account balance from Bybit exchange. Returns the available balance in USDT. Requires user to have configured their Bybit API keys.",
    parameters: [],
    handler: async () => {
      try {
        console.log(`[Balance_Bybit] Called with address: ${address}`);

        if (!address) {
          return {
            error: true,
            message: `❌ Wallet not connected. Please connect your wallet first to access Bybit balance.`,
          };
        }

        const balance = await getBalance("Bybit", address);

        if (balance === undefined || balance === null) {
          return {
            error: true,
            message: `❌ Failed to retrieve balance from Bybit. Please check your API credentials and network connection.`,
          };
        }

        let result = `💰 **Bybit Account Balance**:\n\n`;
        result += `💵 Available Balance: $${parseFloat(balance).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )} USDT\n\n`;
        result += `📊 Exchange: Bybit\n`;
        result += `⏰ Retrieved at: ${new Date().toLocaleString()}\n\n`;
        result += `💡 This balance represents your available trading funds in USDT.`;

        console.log(
          `[Balance_Bybit] Successfully retrieved balance: $${balance} from Bybit`
        );
        return result;
      } catch (error) {
        console.error(`[Balance_Bybit] Error:`, error);
        const errorMsg = `❌ Error retrieving balance from Bybit: ${
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
