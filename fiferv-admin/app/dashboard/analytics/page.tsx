'use client';

import { useEffect, useState } from 'react';
import { getCallAnalytics, getLeadAnalytics } from '@/lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [callsData, leadsData] = await Promise.all([
        getCallAnalytics(timeRange),
        getLeadAnalytics(timeRange),
      ]);
      setCalls(callsData);
      setLeads(leadsData);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const processedByDate = (() => {
    const dateMap: { [key: string]: { calls: number; leads: number; appointments: number } } = {};

    calls.forEach((call) => {
      const date = new Date(call.created_at).toLocaleDateString();
      if (!dateMap[date]) {
        dateMap[date] = { calls: 0, leads: 0, appointments: 0 };
      }
      dateMap[date].calls++;
    });

    leads.forEach((lead) => {
      const date = new Date(lead.created_at).toLocaleDateString();
      if (!dateMap[date]) {
        dateMap[date] = { calls: 0, leads: 0, appointments: 0 };
      }
      dateMap[date].leads++;
      if (lead.appointment_requested) {
        dateMap[date].appointments++;
      }
    });

    return Object.entries(dateMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  const intentsData = (() => {
    const intents: { [key: string]: number } = {};
    leads.forEach((lead) => {
      const intent = lead.rv_type || 'Unknown';
      intents[intent] = (intents[intent] || 0) + 1;
    });

    return Object.entries(intents)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  const statusData = [
    { name: 'Contacted', value: leads.filter(l => l.contacted).length, fill: '#10b981' },
    { name: 'New', value: leads.filter(l => !l.contacted).length, fill: '#f59e0b' },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Analytics</h2>
          <p className="text-slate-600 mt-1">Call and lead performance metrics</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Total Calls</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{calls.length}</p>
          <p className="text-xs text-slate-500 mt-1">In {timeRange} days</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Total Leads</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{leads.length}</p>
          <p className="text-xs text-slate-500 mt-1">Captured</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Conversion Rate</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">
            {leads.length > 0 ? Math.round((leads.filter(l => l.appointment_requested).length / leads.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">To appointment</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Avg Call Duration</p>
          <p className="text-4xl font-bold text-purple-600 mt-2">
            {calls.length > 0
              ? Math.round(calls.reduce((sum, c) => sum + c.duration, 0) / calls.length)
              : 0}s
          </p>
          <p className="text-xs text-slate-500 mt-1">Per call</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls and Leads by Date */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Calls & Leads Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                style={{ fontSize: '12px' }}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="calls"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Lead Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments by Date */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Appointments Requested</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                style={{ fontSize: '12px' }}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar dataKey="appointments" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top RV Types */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top RV Types Inquired</h3>
          {intentsData.length === 0 ? (
            <p className="text-slate-500 py-8 text-center">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={intentsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" style={{ fontSize: '12px' }} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Calls</th>
                <th className="pb-3 font-medium">Leads</th>
                <th className="pb-3 font-medium">Appointments</th>
                <th className="pb-3 font-medium">Conversion %</th>
              </tr>
            </thead>
            <tbody>
              {processedByDate.slice(-7).reverse().map((row) => (
                <tr key={row.date} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 font-medium text-slate-900">{row.date}</td>
                  <td className="py-3">{row.calls}</td>
                  <td className="py-3">{row.leads}</td>
                  <td className="py-3">{row.appointments}</td>
                  <td className="py-3">
                    {row.leads > 0 ? Math.round((row.appointments / row.leads) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
