// components/OpenClawAccessButton.tsx
// Dashboard button to launch user's OpenClaw instance

import { useState } from 'react';
import { useRouter } from 'next/router';

interface OpenClawAccessButtonProps {
  userId: string;
  tier: string;
  modelId: string;
}

export default function OpenClawAccessButton({
  userId,
  tier,
  modelId,
}: OpenClawAccessButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLaunchOpenClaw = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch access details from API
      const response = await fetch(`/api/openclaw/access?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get access details');
      }

      const data = await response.json();

      if (!data.success || !data.instance) {
        throw new Error(data.error || 'No instance available');
      }

      // Open in new tab
      window.open(data.instance.url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('OpenClaw access error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your OpenClaw Instance</h3>
          <p className="text-sm text-gray-600 mt-1">
            {tier === 'free' && 'Claude Haiku — Fast and efficient'}
            {tier === 'starter' && 'Claude Sonnet — General-purpose, balanced'}
            {tier === 'professional' && 'Claude Opus — Advanced reasoning and analysis'}
          </p>
          <p className="text-xs text-gray-500 mt-2">Model: {modelId}</p>

          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Error: {error}
            </div>
          )}
        </div>

        <button
          onClick={handleLaunchOpenClaw}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            loading
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {loading ? 'Launching...' : 'Launch OpenClaw'}
        </button>
      </div>

      {/* Fallback instructions */}
      <details className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
          Having trouble? Show instructions
        </summary>
        <div className="mt-3 text-sm text-gray-600 space-y-2">
          <p>
            <strong>Method 1: Click the button above</strong> — Should open your instance in a new tab
          </p>
          <p>
            <strong>Method 2: SSH Tunnel (if button doesn't work):</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Open your terminal/command prompt</li>
            <li>Run: <code className="bg-white p-1 rounded text-xs">ssh -L 9000:localhost:9000 root@64.23.142.154</code></li>
            <li>Keep that terminal open</li>
            <li>Open your browser to: <code className="bg-white p-1 rounded text-xs">http://localhost:9000</code></li>
          </ol>
          <p className="text-xs text-gray-500 mt-2">
            Note: SSH tunnel requires SSH access. Contact support if you need help.
          </p>
        </div>
      </details>
    </div>
  );
}
