import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StrategyOverviewModal from "../components/StrategyOverviewModal";
import type { Strategy } from "../types/strategy";
import "@testing-library/jest-dom";

const mockStrategy: Strategy = {
  icon: ["/icons/eth.svg"],
  title: "Test Strategy",
  category: "CEX",
  features: [
    "Identify tokens in the overbought/oversold zones.",
    "Enter positions with reduced risk using RSI",
  ],
  entryCriteria: "RSI above 70",
  exitCriteria: "RSI below 30",
  apy: 26,
  notes: "Strategy focuses on momentum extremes",
  author: "Jane Doe",
  history: [
    {
      coin: "ETHUSDT",
      entryPrice: 1000,
      exitPrice: 2000,
      entryDate: "2025-09-05",
      exitDate: "2025-09-05",
    },
  ],
  followers: 3,
};

describe("StrategyOverviewModal", () => {
  it("renders overview tab by default", () => {
    render(
      <StrategyOverviewModal
        isOpen
        onClose={() => {}}
        strategy={mockStrategy}
      />
    );
    expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Smart insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Entry Criteria/i)).toBeInTheDocument();
  });

  it("switches to Activities tab", () => {
    render(
      <StrategyOverviewModal
        isOpen
        onClose={() => {}}
        strategy={mockStrategy}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Activities/i }));
    expect(screen.getByText(/Followers/i)).toBeInTheDocument();
  });

  it("switches to Transactions tab", () => {
    render(
      <StrategyOverviewModal
        isOpen
        onClose={() => {}}
        strategy={mockStrategy}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Transactions/i }));
    expect(screen.getByText(/Wallet Address/i)).toBeInTheDocument();
  });
});
