'use client';

import { useEffect, useState } from 'react';
import { getLeads, getCallAnalytics, getLeadAnalytics } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalLeads: 0,
    contactedLeads: 0,
    appointmentRequests: 0,
    conversionRate: 0,
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [calls, leads] = await Promise.all([
          getCallAnalytics(30),
          getLeadAnalytics(30),
        ]);

        const recentLeadsData = leads.slice(0, 5);
        setRecentLeads(recentLeadsData);

        const appointmentCount = leads.filter((l: any) => l.appointment_requested).length;
        const contactedCount = leads.filter((l: any) => l.contacted).length;

        setStats({
          totalCalls: calls.length,
          totalLeads: leads.length,
          contactedLeads: contactedCount,
          appointmentRequests: appointmentCount,
          conversionRate: leads.length > 0 ? Math.round((appointmentCount / leads.length) * 100) : 0,
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, subtitle, color }: any) => (
    <div className={`bg-white rounded-lg border border-${color}-200 p-6`}>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-600 mt-1">Welcome to Fife RV AI Receptionist Control Panel</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Calls (30d)"
          value={stats.totalCalls}
          color="blue"
        />
        <StatCard
          title="Total Leads (30d)"
          value={stats.totalLeads}
          color="green"
        />
        <StatCard
          title="Contacted"
          value={stats.contactedLeads}
          color="purple"
        />
        <StatCard
          title="Appointments"
          value={stats.appointmentRequests}
          color="amber"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          color="rose"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/ai-control"
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-center"
          >
            <div className="text-2xl mb-2">🤖</div>
            <p className="font-medium text-blue-900">AI Control</p>
            <p className="text-xs text-blue-700">Toggle AI on/off</p>
          </Link>
          <Link
            href="/dashboard/leads"
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition text-center"
          >
            <div className="text-2xl mb-2">📞</div>
            <p className="font-medium text-green-900">Manage Leads</p>
            <p className="text-xs text-green-700">View & update leads</p>
          </Link>
          <Link
            href="/dashboard/schedule"
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition text-center"
          >
            <div className="text-2xl mb-2">⏰</div>
            <p className="font-medium text-purple-900">Schedule</p>
            <p className="text-xs text-purple-700">Set after-hours times</p>
          </Link>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Leads</h3>
          <Link href="/dashboard/leads" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All →
          </Link>
        </div>
        
        {recentLeads.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">No leads yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium">RV Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3">{lead.caller_name}</td>
                    <td className="py-3">{lead.phone}</td>
                    <td className="py-3">{lead.rv_type || '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        lead.contacted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {lead.contacted ? 'Contacted' : 'New'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
