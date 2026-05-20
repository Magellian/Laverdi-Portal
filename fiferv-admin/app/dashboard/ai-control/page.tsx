'use client';

import { useEffect, useState } from 'react';
import { updateAIStatus, getEmailRecipients, addEmailRecipient, removeEmailRecipient } from '@/lib/api';

export default function AIControlPage() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailRecipients, setEmailRecipients] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const recipients = await getEmailRecipients();
      setEmailRecipients(recipients);
    } catch (err) {
      console.error('Failed to load recipients:', err);
      setError('Failed to load email recipients');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleAIToggle = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await updateAIStatus(!aiEnabled);
      setAiEnabled(!aiEnabled);
      setSuccess(`AI has been turned ${!aiEnabled ? 'on' : 'off'}`);
    } catch (err) {
      setError('Failed to update AI status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await addEmailRecipient(newEmail.trim());
      setNewEmail('');
      await loadRecipients();
      setSuccess('Email recipient added successfully');
    } catch (err) {
      setError('Failed to add email recipient');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmail = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      await removeEmailRecipient(id);
      await loadRecipients();
      setSuccess('Email recipient removed');
    } catch (err) {
      setError('Failed to remove email recipient');
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">AI Control</h2>
        <p className="text-slate-600 mt-1">Emergency manual control and configuration</p>
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

      {/* AI Toggle */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">AI Receptionist Status</h3>
            <p className="text-slate-600 mt-2">
              {aiEnabled
                ? '🟢 AI is currently ACTIVE and answering calls'
                : '🔴 AI is currently INACTIVE - calls will not be answered'}
            </p>
          </div>
          <button
            onClick={handleAIToggle}
            disabled={loading}
            className={`px-8 py-4 rounded-lg font-semibold text-white transition ${
              aiEnabled
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
            }`}
          >
            {loading ? 'Updating...' : aiEnabled ? 'Turn OFF' : 'Turn ON'}
          </button>
        </div>
      </div>

      {/* Email Recipients */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Lead Alert Recipients</h3>
        
        {/* Add Email Form */}
        <form onSubmit={handleAddEmail} className="mb-6 p-4 bg-slate-50 rounded-lg">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add New Email Recipient
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition font-medium"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Recipients List */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 mb-4">
            {emailRecipients.length} active recipient{emailRecipients.length !== 1 ? 's' : ''}
          </p>
          
          {loadingRecipients ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-slate-600">Loading recipients...</p>
            </div>
          ) : emailRecipients.length === 0 ? (
            <p className="text-slate-500 py-4 text-center">No email recipients configured</p>
          ) : (
            <div className="space-y-2">
              {emailRecipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <div>
                    <p className="font-medium text-slate-900">{recipient.recipient_email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Added {new Date(recipient.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveEmail(recipient.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ About Email Recipients</h4>
        <p className="text-blue-800 text-sm">
          Email recipients will receive notifications whenever a new lead is captured. 
          You can add or remove recipients at any time. All active recipients will be 
          notified for each new lead.
        </p>
      </div>
    </div>
  );
}
