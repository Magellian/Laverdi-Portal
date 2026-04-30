/**
 * pages/dashboard/agents.tsx
 * Manage multiple OpenClaw agents with shared credit pool
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description?: string;
  isPrimary: boolean;
  isActive: boolean;
  ipAddress: string;
  port: number;
  status: "provisioning" | "active" | "error";
  endpoint: string;
  createdAt: string;
}

interface SharedCreditPool {
  tier: string;
  monthlyLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
  agentCount: number;
  resetDate: string;
}

const AgentsDashboard = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [creditPool, setCreditPool] = useState<SharedCreditPool | null>(null);
  const [agentLimit, setAgentLimit] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [provisioning, setProvisioning] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/agents", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.data.agents);
        setCreditPool(data.data.creditPool);
        setAgentLimit(data.data.agentLimit);
      }
    } catch (err) {
      setError("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/agents/provision", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentName: newAgentName || "agent" }),
      });

      if (response.ok) {
        setNewAgentName("");
        setShowNewForm(false);
        fetchAgents();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to provision agent");
    } finally {
      setProvisioning(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Delete this agent? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAgents();
    } catch (err) {
      setError("Failed to delete agent");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading agents...</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "provisioning":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Your Agents</h1>
        <p className="text-gray-600">
          Manage multiple OpenClaw instances with shared credits
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Shared Credit Pool */}
      {creditPool && (
        <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-black mb-4">Shared Credit Pool</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm">Tier</p>
              <p className="text-2xl font-bold text-black capitalize">
                {creditPool.tier}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Monthly Limit</p>
              <p className="text-2xl font-bold text-black">
                {creditPool.monthlyLimit}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Credits Used</p>
              <p className="text-2xl font-bold text-red-600">
                {creditPool.creditsUsed.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                {creditPool.creditsRemaining.toFixed(0)}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-red-600 h-3 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  (creditPool.creditsUsed / creditPool.monthlyLimit) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-600">
            Resets {new Date(creditPool.resetDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Agents List */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black">
            Agents ({agents.length}/{agentLimit})
          </h3>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            disabled={agents.length >= agentLimit}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Agent
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleProvisionAgent} className="mb-6 p-6 bg-gray-50 rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g., Support Bot, Data Analyzer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={provisioning}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  {provisioning ? "Provisioning..." : "Provision Agent"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {agents.length === 0 ? (
          <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No agents yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(agent.status)}
                    <h4 className="font-bold text-black">{agent.name}</h4>
                    {agent.isPrimary && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                        Primary
                      </span>
                    )}
                    {!agent.isActive && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 font-mono break-all">
                    {agent.endpoint}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {agent.status === "active" && (
                    <a
                      href={agent.endpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-5 h-5 text-gray-600" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    disabled={agent.isPrimary}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={agent.isPrimary ? "Cannot delete primary agent" : "Delete agent"}
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {agents.length >= agentLimit && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Agent limit reached:</strong> You can have up to {agentLimit}{" "}
              agent{agentLimit > 1 ? "s" : ""} on your {creditPool?.tier} plan.
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-black mb-4">Multi-Agent Credits</h3>
        <div className="space-y-3 text-gray-700 text-sm">
          <p>
            All your agents share a single monthly credit pool. The total credits
            used across all agents counts toward your tier limit.
          </p>
          <p>
            <strong>Example:</strong> If you have 2 agents and your Starter tier has
            1,000 credits/month, both agents combined can use up to 1,000 credits.
          </p>
          <p className="mt-4">
            <strong>Agent Limits by Tier:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Free: 1 agent</li>
            <li>Starter: 3 agents</li>
            <li>Pro: 10 agents</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AgentsDashboard;
