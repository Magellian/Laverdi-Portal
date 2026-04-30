/**
 * pages/dashboard/usage.tsx
 * Usage tracking dashboard - shows API calls, tokens, and model info
 */

"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, TrendingUp, Zap } from "lucide-react";

const UsageDashboard = () => {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch usage stats from API
    // This would call /api/usage-stats endpoint
    const mockData = {
      tier: "starter",
      callsUsedThisMonth: 234,
      callsLimit: 10000,
      tokensUsedThisMonth: 350000,
      tokensLimit: 15000000,
      primaryModel: "anthropic/claude-sonnet-4-6",
      fallbackModel: "anthropic/claude-haiku-4-5",
      daysRemainingInMonth: 14,
      lastCallAt: new Date(Date.now() - 3600000).toISOString(),
    };
    setUsage(mockData);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading usage data...</div>;
  }

  if (!usage) {
    return <div className="p-8 text-center text-red-600">Failed to load usage data</div>;
  }

  const callsPercentage = (usage.callsUsedThisMonth / usage.callsLimit) * 100;
  const tokensPercentage = (usage.tokensUsedThisMonth / usage.tokensLimit) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Usage Tracking</h1>
        <p className="text-gray-600">
          Monitor your API calls and token usage for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Calls Card */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">API Calls</h3>
            <Zap className="w-6 h-6 text-red-600" />
          </div>
          <div className="mb-4">
            <div className="text-3xl font-bold text-black">
              {usage.callsUsedThisMonth.toLocaleString()} / {usage.callsLimit.toLocaleString()}
            </div>
            <p className="text-gray-600 text-sm">
              {callsPercentage.toFixed(1)}% used • {usage.daysRemainingInMonth} days left
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(callsPercentage, 100)}%` }}
            />
          </div>
          {callsPercentage > 80 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                You're using {callsPercentage.toFixed(0)}% of your monthly limit. Consider upgrading.
              </p>
            </div>
          )}
        </div>

        {/* Tokens Card */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">Tokens</h3>
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
          <div className="mb-4">
            <div className="text-3xl font-bold text-black">
              {(usage.tokensUsedThisMonth / 1000000).toFixed(1)}M / {(usage.tokensLimit / 1000000).toFixed(0)}M
            </div>
            <p className="text-gray-600 text-sm">
              {tokensPercentage.toFixed(2)}% used • Average {Math.ceil(usage.tokensUsedThisMonth / Math.max(usage.callsUsedThisMonth, 1))} tokens/call
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(tokensPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Model Information */}
      <div className="bg-gradient-to-br from-red-50 to-gray-50 border-2 border-red-200 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-black mb-4">Active Models</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-1">Primary Model</p>
            <p className="font-mono text-black bg-white px-3 py-2 rounded-lg border border-gray-200">
              {usage.primaryModel}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Fallback Model</p>
            <p className="font-mono text-black bg-white px-3 py-2 rounded-lg border border-gray-200">
              {usage.fallbackModel}
            </p>
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-black mb-4">Last Activity</h3>
        <p className="text-gray-700">
          Last API call:{" "}
          <span className="font-semibold">
            {new Date(usage.lastCallAt).toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  );
};

export default UsageDashboard;
