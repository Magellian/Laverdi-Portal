'use client';

import { useEffect, useState } from 'react';
import { getLeads, updateLead, markLeadAsContacted } from '@/lib/api';
import CSVExport from '@/components/CSVExport';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadLeads();
    const interval = setInterval(loadLeads, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, searchTerm, filterStatus]);

  const loadLeads = async () => {
    try {
      const data = await getLeads(100);
      setLeads(data);
    } catch (err) {
      setError('Failed to load leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = leads;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead =>
        filterStatus === 'contacted' ? lead.contacted : !lead.contacted
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.caller_name?.toLowerCase().includes(term) ||
        lead.phone?.includes(term) ||
        lead.email?.toLowerCase().includes(term)
      );
    }

    setFilteredLeads(filtered);
  };

  const handleMarkContacted = async (leadId: string) => {
    try {
      await markLeadAsContacted(leadId);
      setSuccess('Lead marked as contacted');
      loadLeads();
    } catch (err) {
      setError('Failed to update lead');
      console.error(err);
    }
  };

  const handleOpenModal = (lead: any) => {
    setSelectedLead(lead);
    setEditingNotes(lead.notes || '');
    setShowModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;

    try {
      await updateLead(selectedLead.id, { notes: editingNotes });
      setSuccess('Notes updated successfully');
      setShowModal(false);
      loadLeads();
    } catch (err) {
      setError('Failed to save notes');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Leads</h2>
          <p className="text-slate-600 mt-1">Manage and track all captured leads</p>
        </div>
        <CSVExport data={filteredLeads} filename="fife-rv-leads" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Leads ({leads.length})</option>
            <option value="new">New ({leads.filter(l => !l.contacted).length})</option>
            <option value="contacted">Contacted ({leads.filter(l => l.contacted).length})</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-lg">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">RV Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Appointment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{lead.caller_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lead.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lead.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lead.rv_type || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.contacted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {lead.contacted ? 'Contacted' : 'New'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        lead.appointment_requested
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.appointment_requested ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(lead)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          Edit
                        </button>
                        {!lead.contacted && (
                          <button
                            onClick={() => handleMarkContacted(lead.id)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Edit Lead</h3>
              <p className="text-slate-600 mt-1">{selectedLead.caller_name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <p className="px-4 py-2 bg-slate-50 rounded text-slate-900">{selectedLead.phone}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <p className="px-4 py-2 bg-slate-50 rounded text-slate-900">{selectedLead.email || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">RV Type</label>
                  <p className="px-4 py-2 bg-slate-50 rounded text-slate-900">{selectedLead.rv_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Budget</label>
                  <p className="px-4 py-2 bg-slate-50 rounded text-slate-900">{selectedLead.budget || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Add or edit notes..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
