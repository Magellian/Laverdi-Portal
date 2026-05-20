'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Unable to connect. Please refresh and try again.');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess('Password updated successfully');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError('Failed to update password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-1">Manage your account and preferences</p>
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

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'security'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'about'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            About
          </button>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900">
                  {/* In a real app, fetch the user email */}
                  admin@fiferv.com
                </div>
                <p className="text-xs text-slate-500 mt-2">Your admin account email. Contact your administrator to change.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Role</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Administrator
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Status</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition font-medium"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-semibold text-slate-900 mb-3">Two-Factor Authentication</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Additional security layer for your account (coming soon)
                </p>
                <button
                  disabled
                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg cursor-not-allowed opacity-50"
                >
                  Enable 2FA
                </button>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-semibold text-slate-900 mb-3">Active Sessions</h4>
                <p className="text-sm text-slate-600 mb-4">Manage your logged-in sessions</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Current Browser</p>
                      <p className="text-xs text-slate-500">Active now</p>
                    </div>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Fife RV Admin Dashboard</h4>
                <p className="text-sm text-slate-600">
                  Professional management interface for the Fife RV AI Receptionist system.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Version</h4>
                <p className="text-sm text-slate-600">1.0.0</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Technology Stack</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Next.js 14+ with React 18</li>
                  <li>• TypeScript for type safety</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• Supabase for backend & database</li>
                  <li>• Recharts for analytics visualizations</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Features</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>✓ AI On/Off emergency control</li>
                  <li>✓ Real-time lead management</li>
                  <li>✓ Email recipient configuration</li>
                  <li>✓ After-hours scheduling</li>
                  <li>✓ Advanced analytics & reporting</li>
                  <li>✓ CSV export functionality</li>
                  <li>✓ Mobile-responsive design</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <strong>Support:</strong> Contact your system administrator for assistance or technical support.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
