"use client";

import React, { useEffect, useState } from "react";
import { VultrApiClient } from "../lib/apiClient";
import { VultrUsageStats } from "../types";

interface VultrUsageWidgetProps {
  wrapperUrl: string;
  refreshIntervalMs?: number;
  className?: string;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <div className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export function VultrUsageWidget({
  wrapperUrl,
  refreshIntervalMs = 30000,
  className = "",
}: VultrUsageWidgetProps) {
  const [stats, setStats] = useState<VultrUsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new VultrApiClient({ wrapperUrl });

    const fetch = async () => {
      try {
        const data = await client.getUsage();
        setStats(data);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    };

    fetch();
    const interval = setInterval(fetch, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [wrapperUrl, refreshIntervalMs]);

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        ⚠️ Usage stats unavailable: {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>Loading usage stats...</div>
    );
  }

  const cacheRate =
    stats.totalRequests > 0
      ? Math.round((stats.cachedRequests / stats.totalRequests) * 100)
      : 0;

  return (
    <div className={`vultr-usage-widget ${className}`}>
      <h3 className="text-sm font-semibold text-gray-600 mb-3">Vultr Inference Usage</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Requests" value={stats.totalRequests} />
        <StatCard label="Total Tokens" value={stats.totalTokens} />
        <StatCard label="Cached Requests" value={stats.cachedRequests} />
        <StatCard label="Cache Hit Rate" value={`${cacheRate}%`} />
      </div>
      {Object.keys(stats.tokensByModel).length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Tokens by Model</h4>
          {Object.entries(stats.tokensByModel).map(([model, tokens]) => (
            <div key={model} className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-600 flex-1 truncate">{model}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (tokens / stats.totalTokens) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">
                {tokens.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
