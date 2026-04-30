/**
 * pages/dashboard/agent-control.tsx
 * User's OpenClaw agent control panel - configure model, view credits
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  Zap,
  AlertCircle,
  CheckCircle,
  Settings,
} from "lucide-react";

interface AgentInfo {
  dropletId: number;
  ipAddress: string;
  port: number;
  endpoint: string;
  status: "provisioning" | "active" | "error";
}

interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  costPerMTok: number;
  maxContextTokens: number;
  maxOutputTokens: number;
}

interface UsageStats {
  tier: string;
  monthlyCredits: number;
  creditsUsed: number;
  creditsRemaining: number;
  percentageUsed: number;
  resetDate: string;
  modelUsage: Array<{
    model: string;
    creditsUsed: number;
    callCount: number;
  }>;
}

export default function AgentControl() {
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentInfo();
    fetchUsageStats();
    fetchAvailableModels();
  }, []);

  const fetchAgentInfo = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/droplet/info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAgentInfo(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch agent info:", err);
      setError("Could not load agent information");
    }
  };

  const fetchUsageStats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/usage/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsage(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch usage stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/models/available", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.data?.models || []);
        setSelectedModel(data.data?.defaultModel || "");
      }
    } catch (err) {
      console.error("Failed to fetch models:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent control panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-black">Agent Control Panel</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="inline-block w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Agent Status */}
      {agentInfo && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-black flex items-center gap-2 mb-6">
            <Settings className="w-6 h-6" />
            Agent Status
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Status</span>
              <div className="flex items-center gap-2">
                {agentInfo.status === "active" ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-600">Active</span>
                  </>
                ) : agentInfo.status === "provisioning" ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                    <span className="font-bold text-yellow-600">Provisioning</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-600">Error</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">IP Address</span>
              <span className="font-mono font-bold text-black">{agentInfo.ipAddress}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Port</span>
              <span className="font-mono font-bold text-black">{agentInfo.port}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Web UI</span>
              <a
                href={agentInfo.endpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 font-bold hover:underline flex items-center gap-2"
              >
                Open Dashboard <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              Your OpenClaw agent is running on a dedicated droplet. Click &quot;Open Dashboard&quot;
              to access the full web UI where you can configure your agent, manage conversations, and
              customize behavior.
            </p>
          </div>
        </div>
      )}

      {/* Usage Dashboard */}
      {usage && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-black flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6" />
            Monthly Credits Usage
          </h3>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">
                  {usage.creditsUsed.toFixed(2)} / {usage.monthlyCredits} credits
                </span>
                <span className="font-bold text-black">
                  {usage.percentageUsed.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    usage.percentageUsed > 90
                      ? "bg-red-600"
                      : usage.percentageUsed > 70
                      ? "bg-yellow-600"
                      : "bg-green-600"
                  }`}
                  style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Reset Date */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Resets on</span>
              <span className="font-bold text-black">
                {new Date(usage.resetDate).toLocaleDateString()}
              </span>
            </div>

            {/* Model Usage Breakdown */}
            {usage.modelUsage.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-600 mb-3">Usage by Model</p>
                <div className="space-y-2">
                  {usage.modelUsage.map((model) => (
                    <div key={model.model} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{model.model}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">
                          {model.creditsUsed.toFixed(3)} credits
                        </p>
                        <p className="text-xs text-gray-500">{model.callCount} calls</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Tip:</strong> Credits reset monthly on the 1st. Premium models (Sonnet, Opus)
              cost more per token but are faster and smarter.
            </p>
          </div>
        </div>
      )}

      {/* Available Models */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-black flex items-center gap-2 mb-6">
          <Zap className="w-6 h-6" />
          Available Models
        </h3>

        <p className="text-gray-600 mb-6">
          All models powered by DigitalOcean Gradient AI Platform. Select your primary model below.
        </p>

        {availableModels.length === 0 ? (
          <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600">
            <p>No models available in your tier.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableModels.map((model) => (
              <div
                key={model.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedModel === model.id
                    ? "border-red-600 bg-red-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        checked={selectedModel === model.id}
                        onChange={() => setSelectedModel(model.id)}
                        className="w-4 h-4"
                      />
                      <p className="font-bold text-black">{model.name}</p>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Context: {model.maxContextTokens.toLocaleString()} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">
                      ${(model.costPerMTok / 1000).toFixed(4)}/1K
                    </p>
                    <p className="text-xs text-gray-600">per 1M tokens</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Included with your tier:</strong> All models are powered by DigitalOcean
            Gradient and included in your monthly credits. No additional API keys needed.
          </p>
        </div>
      </div>
    </div>
  );
}
