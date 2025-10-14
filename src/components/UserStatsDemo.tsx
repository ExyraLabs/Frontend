"use client";
import { useUserStatistics } from "@/hooks/useUserStatistics";
import { ADMIN_WALLETS } from "@/utils/constants";
import { useAppKitAccount } from "@reown/appkit/react";
import { useState, useMemo } from "react";

// Admin wallets

interface FilterState {
  search: string;
  agent: string;
  action: string;
  token: string;
  dateRange: string;
  minVolume: string;
  maxVolume: string;
}

export default function UserStatsDemo() {
  const { isConnected, address } = useAppKitAccount();
  const { statistics, aggregated, loading, error, refresh } =
    useUserStatistics();

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    agent: "",
    action: "",
    token: "",
    dateRange: "",
    minVolume: "",
    maxVolume: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Check if user is admin
  const isAdmin = address && ADMIN_WALLETS.includes(address as string);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const agents = [...new Set(statistics.map((s) => s.agent))];
    const actions = [...new Set(statistics.map((s) => s.action))];
    const tokens = [...new Set(statistics.map((s) => s.token))];
    return { agents, actions, tokens };
  }, [statistics]);

  // Filter statistics based on current filters
  const filteredStats = useMemo(() => {
    return statistics.filter((stat) => {
      // Search filter (matches agent, action, token, or address)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          stat.agent.toLowerCase().includes(searchLower) ||
          stat.action.toLowerCase().includes(searchLower) ||
          stat.token.toLowerCase().includes(searchLower) ||
          stat.address.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Agent filter
      if (filters.agent && stat.agent !== filters.agent) return false;

      // Action filter
      if (filters.action && stat.action !== filters.action) return false;

      // Token filter
      if (filters.token && stat.token !== filters.token) return false;

      // Volume filters
      if (
        filters.minVolume &&
        stat.volumeUsd &&
        stat.volumeUsd < parseFloat(filters.minVolume)
      )
        return false;
      if (
        filters.maxVolume &&
        stat.volumeUsd &&
        stat.volumeUsd > parseFloat(filters.maxVolume)
      )
        return false;

      // Date range filter
      if (filters.dateRange) {
        const statDate = new Date(stat.timestamp);
        const today = new Date();
        const daysAgo = parseInt(filters.dateRange);
        const cutoffDate = new Date(
          today.getTime() - daysAgo * 24 * 60 * 60 * 1000
        );
        if (statDate < cutoffDate) return false;
      }

      return true;
    });
  }, [statistics, filters]);

  // Access control - only show to admin wallets
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] flex items-center justify-center">
        <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[24px] p-8 max-w-md w-[90vw] mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#A9A0FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#A9A0FF]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              Admin Access Required
            </h3>
            <p className="text-gray-400 mb-6">
              Connect your wallet to access the admin dashboard
            </p>
            <div className="w-full bg-[#A9A0FF] text-white py-3 rounded-lg text-center">
              Connect Wallet
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] flex items-center justify-center">
        <div className="bg-[#1A1A1A] border border-red-500/20 rounded-[24px] p-8 max-w-md w-[90vw] mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              Access Denied
            </h3>
            <p className="text-gray-400 mb-4">
              You don&apos;t have permission to access this admin dashboard.
            </p>
            <p className="text-red-400 text-sm">Connected: {address}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] flex items-center justify-center">
        <div className="bg-[#1A1A1A] border border-[#A9A0FF]/20 rounded-[24px] p-8">
          <div className="flex items-center justify-center gap-4 text-[#A9A0FF]">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-[#A9A0FF]/20 border-t-[#A9A0FF] rounded-full animate-spin"></div>
            </div>
            <div className="text-white text-lg">Loading admin dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] flex items-center justify-center">
        <div className="bg-[#1A1A1A] border border-red-500/20 rounded-[24px] p-8 max-w-md w-[90vw] mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              Error Loading Data
            </h3>
            <p className="text-red-400 text-center mb-6">{error}</p>
            <button
              onClick={refresh}
              className="w-full bg-[#A9A0FF] text-white py-3 rounded-lg hover:bg-[#9A8FFF] transition-colors font-medium"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto mr-7 rounded-md scrollbar-hide bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] p-4 lg:p-8">
      <div className="max-w-7xl  mx-auto">
        {/* Header */}
        <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-[#A9A0FF]/20 rounded-[24px] p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                🛡️ Admin Dashboard - All Users
              </h1>
              <p className="text-gray-400">
                Comprehensive analytics and activity monitoring for all platform
                users
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-[#A9A0FF]/10 border border-[#A9A0FF]/30 rounded-full">
                <span className="text-[#A9A0FF] text-sm font-medium">
                  Admin
                </span>
              </div>
              <button
                onClick={refresh}
                className="flex items-center gap-2 px-4 py-2 bg-[#A9A0FF] text-white rounded-lg hover:bg-[#9A8FFF] transition-colors font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary Cards */}
        {aggregated && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-[#A9A0FF]/10 to-[#A9A0FF]/5 border border-[#A9A0FF]/20 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#A9A0FF]/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#A9A0FF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <span className="text-green-400 text-sm font-medium">
                  +12.5%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                Total Volume
              </h3>
              <p className="text-white text-2xl font-bold">
                ${aggregated.totalVolume.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <span className="text-green-400 text-sm font-medium">
                  +5.3%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                Total Transactions
              </h3>
              <p className="text-white text-2xl font-bold">
                {aggregated.totalTransactions.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-[#A9A0FF] text-sm font-medium">Top</span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                Most Used Agent
              </h3>
              <p className="text-white text-xl font-bold">
                {aggregated.mostUsedAgent || "None"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
                <span className="text-[#A9A0FF] text-sm font-medium">Top</span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                Most Used Action
              </h3>
              <p className="text-white text-xl font-bold">
                {aggregated.mostUsedAction || "None"}
              </p>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-[#A9A0FF]/20 rounded-[24px] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Filters & Search
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-[#A9A0FF] hover:text-white transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              {showFilters ? "Hide" : "Show"} Filters
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
              <input
                type="text"
                placeholder="Search by agent, action, token, or address..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#A9A0FF] transition-colors"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <select
                value={filters.agent}
                onChange={(e) =>
                  setFilters({ ...filters, agent: e.target.value })
                }
                className="px-3 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#A9A0FF]"
              >
                <option value="">All Agents</option>
                {filterOptions.agents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>

              <select
                value={filters.action}
                onChange={(e) =>
                  setFilters({ ...filters, action: e.target.value })
                }
                className="px-3 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#A9A0FF]"
              >
                <option value="">All Actions</option>
                {filterOptions.actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>

              <select
                value={filters.token}
                onChange={(e) =>
                  setFilters({ ...filters, token: e.target.value })
                }
                className="px-3 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#A9A0FF]"
              >
                <option value="">All Tokens</option>
                {filterOptions.tokens.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
                className="px-3 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#A9A0FF]"
              >
                <option value="">All Time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>

              <input
                type="number"
                placeholder="Min Volume ($)"
                value={filters.minVolume}
                onChange={(e) =>
                  setFilters({ ...filters, minVolume: e.target.value })
                }
                className="px-3 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#A9A0FF]"
              />

              <input
                type="number"
                placeholder="Max Volume ($)"
                value={filters.maxVolume}
                onChange={(e) =>
                  setFilters({ ...filters, maxVolume: e.target.value })
                }
                className="px-3 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#A9A0FF]"
              />
            </div>
          )}

          {/* Clear Filters */}
          {(filters.search ||
            filters.agent ||
            filters.action ||
            filters.token ||
            filters.dateRange ||
            filters.minVolume ||
            filters.maxVolume) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() =>
                  setFilters({
                    search: "",
                    agent: "",
                    action: "",
                    token: "",
                    dateRange: "",
                    minVolume: "",
                    maxVolume: "",
                  })
                }
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Activity Table */}
        {filteredStats.length > 0 ? (
          <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-[#A9A0FF]/20 rounded-[24px] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  All User Activity ({filteredStats.length} transactions)
                </h2>
                <div className="text-sm text-gray-400">
                  Total filtered volume: $
                  {filteredStats
                    .reduce((sum, s) => sum + (s.volumeUsd || 0), 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2A2A2A]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      USD Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredStats.slice(0, 100).map((stat) => (
                    <tr
                      key={stat._id}
                      className="hover:bg-[#2A2A2A]/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(stat.timestamp).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(stat.timestamp).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="font-mono text-xs bg-[#2A2A2A] px-2 py-1 rounded">
                          {stat.address.slice(0, 6)}...{stat.address.slice(-4)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#A9A0FF]/10 text-[#A9A0FF]">
                          {stat.agent}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {stat.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                          {stat.token}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {stat.volume}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                        {stat.volumeUsd
                          ? `$${stat.volumeUsd.toLocaleString()}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStats.length > 100 && (
              <div className="p-4 text-center text-gray-400 text-sm border-t border-gray-700">
                Showing first 100 of {filteredStats.length} transactions
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-[#A9A0FF]/20 rounded-[24px] p-12 text-center">
            <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-white text-lg font-medium mb-2">
              No Data Found
            </h3>
            <p className="text-gray-400">
              {statistics.length === 0
                ? "No platform activity data available yet."
                : "No transactions match your current filters."}
            </p>
          </div>
        )}

        {/* Agent Usage Breakdown */}
        {aggregated && Object.keys(aggregated.agentUsage).length > 0 && (
          <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-[#A9A0FF]/20 rounded-[24px] p-6 mt-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Agent Usage Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(aggregated.agentUsage)
                .sort(([, a], [, b]) => b - a)
                .map(([agent, count]) => {
                  const percentage = (
                    (count / aggregated.totalTransactions) *
                    100
                  ).toFixed(1);
                  return (
                    <div key={agent} className="bg-[#2A2A2A] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{agent}</span>
                        <span className="text-[#A9A0FF] font-bold">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                        <div
                          className="bg-[#A9A0FF] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {percentage}% of total
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
