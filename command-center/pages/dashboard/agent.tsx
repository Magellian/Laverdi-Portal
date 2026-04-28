import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Droplet {
  id: string;
  droplet_id: number;
  public_ip: string;
  private_ip?: string;
  status: 'provisioning' | 'ready' | 'error';
  pairing_token: string;
  tier: string;
  created_at: string;
  updated_at: string;
}

interface DropletStatus {
  healthy: boolean;
  version?: string;
  message?: string;
}

export default function AgentDashboard() {
  const [droplet, setDroplet] = useState<Droplet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<DropletStatus | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load droplet data on mount
  useEffect(() => {
    loadDropletStatus();
    const interval = setInterval(loadDropletStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDropletStatus = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get('/api/droplets/status');
      const data = response.data;
      
      if (data.droplet) {
        setDroplet(data.droplet);
        setError(null);
      } else if (data.error) {
        setError(data.error);
        setDroplet(null);
      }
    } catch (err: any) {
      console.error('Failed to load droplet status:', err);
      setError(err.response?.data?.error || 'Failed to load droplet status');
      setDroplet(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const testConnection = async () => {
    if (!droplet || !droplet.public_ip) {
      setError('No droplet IP available');
      return;
    }

    setTestingConnection(true);
    try {
      // Try to reach the agent health endpoint
      const response = await axios.get(`http://${droplet.public_ip}:5000/health`, {
        timeout: 5000,
      });
      
      setConnectionStatus({
        healthy: response.status === 200,
        version: response.data.version,
        message: 'Connection successful ✓',
      });
    } catch (err: any) {
      setConnectionStatus({
        healthy: false,
        message: `Connection failed: ${err.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const openAgent = () => {
    if (droplet && droplet.public_ip) {
      window.open(`http://${droplet.public_ip}:3000`, '_blank');
    }
  };

  const copyIPToClipboard = () => {
    if (droplet && droplet.public_ip) {
      navigator.clipboard.writeText(droplet.public_ip);
      alert('IP copied to clipboard!');
    }
  };

  const copyPairingToken = () => {
    if (droplet && droplet.pairing_token) {
      navigator.clipboard.writeText(droplet.pairing_token);
      alert('Pairing token copied to clipboard!');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
            </div>
            <p className="mt-4 text-slate-400">Loading your agent...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - no droplet provisioned yet
  if (error && !droplet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">No Agent Provisioned</h2>
            <p className="text-slate-300 mb-4">{error}</p>
            <p className="text-slate-400 text-sm">
              Upgrade your plan to provision your first agent. Your agent will automatically be created and configured.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400">🚀 Your OpenClaw Agent</h1>
          <p className="text-slate-400 mt-2">Manage and monitor your provisioned agent</p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mb-6">
          {/* Status Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Agent Status</h2>
              <p className="text-slate-200 mt-1">
                {droplet?.status === 'provisioning' && '⏳ Provisioning...'}
                {droplet?.status === 'ready' && '✅ Ready to use'}
                {droplet?.status === 'error' && '❌ Error'}
              </p>
            </div>
            <div className="text-5xl">
              {droplet?.status === 'provisioning' && '⏳'}
              {droplet?.status === 'ready' && '✅'}
              {droplet?.status === 'error' && '❌'}
            </div>
          </div>

          {/* Status Details */}
          <div className="p-6 space-y-4">
            {/* Droplet ID */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm">Droplet ID</p>
                <p className="text-lg font-mono text-slate-200">{droplet?.droplet_id || '-'}</p>
              </div>
            </div>

            {/* Public IP */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm">Public IP</p>
                <p className="text-lg font-mono text-slate-200">
                  {droplet?.public_ip ? (
                    <span>{droplet.public_ip}</span>
                  ) : droplet?.status === 'provisioning' ? (
                    <span className="text-slate-500">Waiting for IP...</span>
                  ) : (
                    <span className="text-red-400">Not available</span>
                  )}
                </p>
              </div>
              {droplet?.public_ip && (
                <button
                  onClick={copyIPToClipboard}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
                >
                  Copy IP
                </button>
              )}
            </div>

            {/* Tier */}
            <div>
              <p className="text-slate-400 text-sm">Subscription Tier</p>
              <div className="inline-block mt-1 px-3 py-1 bg-blue-900/40 border border-blue-700 rounded text-blue-300 text-sm font-medium">
                {droplet?.tier ? droplet.tier.charAt(0).toUpperCase() + droplet.tier.slice(1) : '-'}
              </div>
            </div>

            {/* Pairing Token */}
            {droplet?.pairing_token && (
              <div>
                <p className="text-slate-400 text-sm">Pairing Token</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-mono text-slate-300 truncate">
                    {droplet.pairing_token.slice(0, 16)}...
                  </span>
                  <button
                    onClick={copyPairingToken}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Provisioning Progress */}
            {droplet?.status === 'provisioning' && (
              <div className="mt-6 p-4 bg-slate-700/30 rounded border border-slate-600">
                <p className="text-sm text-slate-400 mb-3">Provisioning Progress</p>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Your agent is being set up. This typically takes 2-3 minutes. Refresh the page to check progress.
                </p>
              </div>
            )}

            {/* Created At */}
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
              Created: {droplet?.created_at ? new Date(droplet.created_at).toLocaleString() : '-'}
            </div>
          </div>
        </div>

        {/* Connection Test Card */}
        {droplet?.public_ip && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Connection Test</h3>
            
            <div className="flex gap-3">
              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded font-medium transition"
              >
                {testingConnection ? '🔄 Testing...' : '🔗 Test Connection'}
              </button>
            </div>

            {/* Connection Result */}
            {connectionStatus && (
              <div className={`mt-4 p-4 rounded border ${
                connectionStatus.healthy
                  ? 'bg-green-900/20 border-green-700 text-green-300'
                  : 'bg-red-900/20 border-red-700 text-red-300'
              }`}>
                <p className="font-medium">
                  {connectionStatus.healthy ? '✅ Connected' : '❌ Connection Failed'}
                </p>
                <p className="text-sm mt-1">{connectionStatus.message}</p>
                {connectionStatus.version && (
                  <p className="text-xs text-slate-400 mt-2">Version: {connectionStatus.version}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {droplet?.status === 'ready' && droplet?.public_ip && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={openAgent}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-medium transition flex items-center justify-center gap-2"
              >
                🌐 Open Agent Portal
              </button>
              
              <button
                onClick={loadDropletStatus}
                disabled={refreshing}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-6 py-3 rounded font-medium transition flex items-center justify-center gap-2"
              >
                🔄 Refresh Status
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-700/30 rounded text-sm text-slate-400">
              <p>Your agent is running at <span className="font-mono text-slate-300">{droplet.public_ip}:3000</span></p>
            </div>
          </div>
        )}

        {/* Error State Display */}
        {droplet?.status === 'error' && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-red-400 mb-2">Provisioning Error</h3>
            <p className="text-red-300 mb-4">
              An error occurred while provisioning your agent. Please contact support.
            </p>
            <button
              onClick={loadDropletStatus}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium transition"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
