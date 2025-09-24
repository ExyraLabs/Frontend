import { ExtendedReserve, formatCurrency, formatPercentage } from "@/lib/utils";
import { chainId, Market, Reserve, useAaveMarkets } from "@aave/react";
import Image from "next/image";
import React, { useMemo, useState } from "react";

const AaveUi = () => {
  const { data, loading, error } = useAaveMarkets({ chainIds: [chainId(1)] });
  const [searchTerm, setSearchTerm] = useState("");
  // Flatten all reserves from all markets for unified display
  const allReserves = useMemo(() => {
    if (!data) return [];

    // Debug: Log the financial data structure
    if (
      data.length > 0 &&
      data[0].supplyReserves &&
      data[0].supplyReserves.length > 0
    ) {
      const firstSupply = data[0].supplyReserves[0];
      console.log("=== SUPPLY FINANCIAL DATA DEBUG ===");
      console.log("Supply reserve:", firstSupply);
      console.log("supplyInfo:", firstSupply.supplyInfo);
      console.log("borrowInfo:", firstSupply.borrowInfo);
      console.log("size:", firstSupply.size);
    }

    const reserves: ExtendedReserve[] = [];
    data.forEach((market: Market) => {
      // Add supply reserves
      market.supplyReserves?.forEach((reserve: Reserve) => {
        reserves.push({
          ...reserve,
          type: "supply",
          marketName: market.name || "Unknown Market",
        });
      });

      // Add borrow reserves
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      market.borrowReserves?.forEach((reserve: any) => {
        reserves.push({
          ...reserve,
          type: "borrow",
          marketName: market.name || "Unknown Market",
        });
      });
    });

    return reserves;
  }, [data]);

  // Filter reserves based on search term and selected tab
  const filteredReserves = useMemo(() => {
    return allReserves.filter((reserve) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        reserve.underlyingToken?.symbol?.toLowerCase().includes(searchLower) ||
        reserve.underlyingToken?.name?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });
  }, [allReserves, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading Aave markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md w-[90vw]">
          <div className="text-red-400">
            <h3 className="text-lg font-medium">Error Loading Data</h3>
            <p className="mt-2">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <h3 className="text-lg font-medium">No Data Available</h3>
          <p className="text-gray-400">
            No Aave markets found for the selected chain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Aave Markets Analysis
          </h1>
          <p className="text-gray-400">
            Comprehensive view of Aave lending markets on Ethereum
          </p>
        </div>

        {/* Search and Filter Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Core Assets</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search asset name, symbol, or address"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 pl-10 w-96 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="w-4 h-4 absolute left-3 top-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 p-4 bg-gray-700 text-sm font-medium text-gray-300">
            <div>Asset</div>
            <div className="text-right">Total Supplied</div>
            <div className="text-right">Supply APY</div>
            <div className="text-right">Total Borrowed</div>
            <div className="text-right">Borrow APY</div>
            <div></div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-700">
            {filteredReserves.map((reserve, index: number) => (
              <div
                key={`${index}`}
                className="grid grid-cols-6 gap-4 p-4 hover:bg-gray-700 transition-colors"
              >
                {/* Asset Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden relative">
                    {}
                    {reserve.underlyingToken?.imageUrl ? (
                      <Image
                        src={reserve.underlyingToken.imageUrl}
                        alt={reserve.underlyingToken.symbol || "Token"}
                        width={32}
                        height={32}
                        className="rounded-full"
                        unoptimized={true}
                        onError={() => {
                          // Fallback handled by Next.js automatically
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {}
                        {(reserve.underlyingToken?.symbol || "T").charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {}
                      {reserve.underlyingToken?.symbol || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-400">
                      {reserve.underlyingToken?.name ||
                        reserve.underlyingToken?.symbol ||
                        "Unknown"}
                    </div>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="text-right">
                  <div className="text-white font-medium">
                    {formatCurrency(reserve.supplyInfo?.total.value)}
                  </div>
                  <div className="text-sm text-gray-400">
                    ${formatCurrency(reserve.size?.usd)}
                  </div>
                </div>

                {/* APY */}
                <div className="text-right">
                  <div className="text-green-400 font-medium">
                    {formatPercentage(reserve.supplyInfo?.apy)}
                  </div>
                </div>

                {/* Secondary Amount */}
                <div className="text-right">
                  <div className="text-white font-medium">
                    {formatCurrency(reserve.borrowInfo?.total.amount.value)}
                  </div>
                  <div className="text-sm text-gray-400">
                    ${formatCurrency(reserve.borrowInfo?.total?.usd)}
                  </div>
                </div>

                {/* Rate */}
                <div className="text-right">
                  <div className="text-white font-medium">
                    {formatPercentage(reserve.borrowInfo?.apy)}
                  </div>
                </div>

                {/* Action Button */}
                <div className="text-right">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredReserves.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No assets found matching your search criteria.
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-4 text-xs text-gray-500">
          Showing {filteredReserves.length} assets
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>
    </div>
  );
};

export default AaveUi;
