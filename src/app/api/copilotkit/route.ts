import { MCPClient } from "@/lib/mcp-client";
// import { MCPClient } from "@/lib/mcp-client";
import {
  AnthropicAdapter,
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";

import { NextRequest } from "next/server";
import { coingecko } from "./actions";

// const serviceAdapter = new AnthropicAdapter({
//   model: "claude-sonnet-4-20250514",
// });
const serviceAdapter = new OpenAIAdapter({ model: "gpt-4.1" });

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

const runtime = new CopilotRuntime({
  // createMCPClient: async (config) => {
  //   const mcpClient = new MCPClient({
  //     serverUrl: config.endpoint,
  //   });
  //   await mcpClient.connect();
  //   return mcpClient;
  // },
  actions: [...coingecko],
});

export const POST = async (req: NextRequest) => {
  try {
    // console.log("[CopilotKit API] Received POST request");

    // Log the request body to understand what messages are being sent
    const requestBody = await req.text();
    try {
      const parsedBody = JSON.parse(requestBody);

      if (parsedBody.messages) {
        console.log(
          "[CopilotKit API] Messages being processed:",
          parsedBody.messages.map((msg: unknown, i: number) => ({
            index: i,
            id: (msg as Record<string, unknown>).id,
            role: (msg as Record<string, unknown>).role,
            type: (msg as Record<string, unknown>).type,
            tool_calls: (msg as Record<string, unknown>).tool_calls
              ? ((msg as Record<string, unknown>).tool_calls as unknown[])
                  .length
              : 0,
            tool_call_id: (msg as Record<string, unknown>).tool_call_id,
          }))
        );
      }
    } catch {
      console.log("[CopilotKit API] Could not parse request body for logging");
    }

    // Create a new request with the body
    const newReq = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: requestBody,
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    const response = await handleRequest(newReq);
    console.log("[CopilotKit API] Request handled successfully");
    return response;
  } catch (error) {
    console.error("[CopilotKit API] Error handling request:", error);

    // Log the error details if it's an OpenAI error
    if (error && typeof error === "object" && "status" in error) {
      console.error("[CopilotKit API] OpenAI Error Details:", {
        status: (error as Record<string, unknown>).status,
        message: (error as Record<string, unknown>).message,
        error: (error as Record<string, unknown>).error,
        code: (error as Record<string, unknown>).code,
        param: (error as Record<string, unknown>).param,
        type: (error as Record<string, unknown>).type,
      });
    }

    // Re-throw the error to let CopilotKit handle it
    throw error;
  }
};
