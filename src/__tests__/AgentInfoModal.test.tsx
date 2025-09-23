import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import AgentCard from "../components/AgentCard";

// Mock next/navigation router
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock chat rooms hook
jest.mock("@/hooks/useChatRoomsMessages", () => ({
  useChatRoomsMessages: () => ({
    createChatRoom: jest.fn(),
    loadChatRooms: jest.fn(() => ({})),
  }),
}));

// Mock next/image to render a simple img
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt: string; src: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt} src={props.src} />;
  },
}));

describe("Agent info modal", () => {
  it("opens when info button is clicked and shows tools and prompts", () => {
    render(
      <AgentCard
        icon="/icons/uniswap.png"
        title="Uniswap"
        subtitle="Decentralized exchange for swapping tokens"
        features={["Provide liquidity", "Deep pools"]}
        prompts={[
          "Get quote for swapping 50 USDC to ETH",
          "Swap 0.1 ETH for USDT on Uniswap",
        ]}
        chains={["Ethereum"]}
      />
    );

    const infoBtn = screen.getByRole("button", { name: /About Uniswap/i });
    fireEvent.click(infoBtn);

    // Modal content
    expect(screen.getByText("Available Tools")).toBeInTheDocument();
    expect(screen.getByText(/getUniswapQuote/i)).toBeInTheDocument();
    expect(screen.getByText(/Example Prompts/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Get quote for swapping 50 USDC to ETH/i)
    ).toBeInTheDocument();
  });
});
