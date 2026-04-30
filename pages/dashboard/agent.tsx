/**
 * pages/dashboard/agent.tsx
 * Shows user's provisioned OpenClaw instance (IP, port, status, connection details)
 */

"use client";

import React, { useEffect, useState } from "react";
import { Server, Copy, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface DropletInfo {
  dropletId: number;
  ipAddress: string;
  port: number;
  status: "provisioning" | "active" | "error";
  endpoint: string;
  websocketUrl: string;
  apiKey: string;
  tier: string;
  createdAt: string;
}

const AgentDashboard = () => {
  const [dropletInfo, setDropletInfo] = useState<DropletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDropletInfo = async () => {
      try {
        // Get auth token from session/localStorage
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/droplet/info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load droplet info");
        }

        const data = await response.json();
        setDropletInfo(data.data);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDropletInfo();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading agent details...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Server className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-black mb-2">No Agent Provisioned</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <a
            href="/dashboard/billing"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            Upgrade to Starter
          </a>
        </div>
      </div>
    );
  }

  if (!dropletInfo) {
    return (
      <div className="p-8 text-center text-gray-600">
        No agent information available
      </div>
    );
  }

  const statusConfig = {
    provisioning: {
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      label: "Provisioning",
      description: "Your agent is being set up (typically takes 1-2 minutes)",
    },
    active: {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      label: "Active",
      description: "Your agent is ready to use",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      label: "Error",
      description: "There was an issue provisioning your agent",
    },
  };

  const config = statusConfig[dropletInfo.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Your OpenClaw Agent</h1>
        <p className="text-gray-600">Connection details for your provisioned instance</p>
      </div>

      {/* Status Card */}
      <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-2xl p-8`}>
        <div className="flex items-start gap-4">
          <StatusIcon className={`w-8 h-8 ${config.color} flex-shrink-0 mt-1`} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-black">{config.label}</h3>
            <p className="text-gray-700 mt-1">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-black mb-6">Connection Details</h3>

        <div className="space-y-4">
          {/* Droplet ID */}
          <div>
            <label className="text-sm font-semibold text-gray-600">Droplet ID</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={dropletInfo.dropletId}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() =>
                  copyToClipboard(dropletInfo.dropletId.toString(), "Droplet ID")
                }
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* IP Address */}
          <div>
            <label className="text-sm font-semibold text-gray-600">IP Address</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={dropletInfo.ipAddress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(dropletInfo.ipAddress, "IP")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Port */}
          <div>
            <label className="text-sm font-semibold text-gray-600">Gateway Port</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={dropletInfo.port}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(dropletInfo.port.toString(), "Port")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* HTTP Endpoint */}
          <div>
            <label className="text-sm font-semibold text-gray-600">HTTP Endpoint</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={dropletInfo.endpoint}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(dropletInfo.endpoint, "Endpoint")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* WebSocket URL */}
          <div>
            <label className="text-sm font-semibold text-gray-600">WebSocket URL</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={dropletInfo.websocketUrl}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(dropletInfo.websocketUrl, "WebSocket")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-semibold text-gray-600">API Key</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="password"
                readOnly
                value={dropletInfo.apiKey}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(dropletInfo.apiKey, "API Key")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {copied && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✓ Copied to clipboard
            </div>
          )}
        </div>
      </div>

      {/* Usage Info */}
      <div className="bg-gradient-to-br from-red-50 to-gray-50 border-2 border-red-200 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-black mb-4">Usage</h3>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>Tier:</strong> {dropletInfo.tier.charAt(0).toUpperCase() + dropletInfo.tier.slice(1)}
          </p>
          <p>
            <strong>Provisioned:</strong>{" "}
            {new Date(dropletInfo.createdAt).toLocaleDateString()}
          </p>
          <p>
            <strong>Status:</strong> {config.label}
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-black mb-4">How to Connect</h3>
        <div className="space-y-4 text-gray-700">
          <p>
            Your OpenClaw agent is running on a dedicated droplet. Use the connection details above
            to:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Access the web UI: Visit your HTTP endpoint in a browser</li>
            <li>Use the REST API: Send requests to your HTTP endpoint</li>
            <li>Real-time updates: Connect via WebSocket URL for live events</li>
            <li>SSH access: Connect to the droplet IP for administration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
