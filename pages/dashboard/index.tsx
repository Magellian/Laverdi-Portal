/**
 * Portal Dashboard
 * Displays server provisioning status and gateway configuration
 * Path: /dashboard
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';

interface Server {
  id: number;
  host: string;
  auth_token: string;
  gateway_url: string;
  is_provisioned: boolean;
  token_created_at: string;
  token_expires_at: string | null;
}

interface ProvisioningLog {
  id: number;
  server_id: number;
  event_type: string;
  details: string;
  created_at: string;
}

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [logs, setLogs] = useState<ProvisioningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<number | null>(null);

  // Fetch servers on component mount
  useEffect(() => {
    fetchServers();
    fetchLogs();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/servers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch servers');
      }

      const data = await response.json();
      setServers(data.servers || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error fetching servers');
      console.error('Fetch servers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/provisioning-logs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Fetch logs error:', err);
    }
  };

  const refreshData = () => {
    fetchServers();
    fetchLogs();
  };

  const maskAuthToken = (token: string): string => {
    if (!token || token.length < 8) return '****';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeColor = (provisioned: boolean): string => {
    return provisioned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusBadgeText = (provisioned: boolean): string => {
    return provisioned ? 'Provisioned' : 'Pending';
  };

  return (
    <>
      <Head>
        <title>Portal Dashboard - Server Provisioning</title>
        <meta name="description" content="Server provisioning and gateway configuration dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Portal Dashboard</h1>
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main>
          {/* Content */}
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}

            {/* Servers Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Servers</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {servers.length} server{servers.length !== 1 ? 's' : ''} configured
                </p>
              </div>

              {loading ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">Loading servers...</p>
                </div>
              ) : servers.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">No servers configured yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Host
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Auth Token
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gateway URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Provisioned
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {servers.map((server) => (
                        <tr
                          key={server.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedServer(selectedServer === server.id ? null : server.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {server.host}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                                server.is_provisioned
                              )}`}
                            >
                              {getStatusBadgeText(server.is_provisioned)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {maskAuthToken(server.auth_token)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 truncate max-w-xs">
                            {server.gateway_url || 'Not set'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {server.token_created_at ? formatDate(server.token_created_at) : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Logs Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Provisioning Logs</h2>
                <p className="text-sm text-gray-500 mt-1">Last 50 events</p>
              </div>

              {logs.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">No provisioning events recorded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {log.event_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs max-w-md truncate">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
