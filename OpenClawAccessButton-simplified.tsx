// components/OpenClawAccessButton.tsx
// Simplified dashboard button to access OpenClaw instances

import React from 'react';

interface OpenClawAccessButtonProps {
  userId: string;
  tier: string;
  modelId?: string;
}

export default function OpenClawAccessButton({
  userId,
  tier,
  modelId = 'Claude',
}: OpenClawAccessButtonProps) {
  const getTierDescription = () => {
    switch (tier) {
      case 'free':
        return 'Claude Haiku — Fast and efficient for quick tasks';
      case 'starter':
        return 'Claude Sonnet — General-purpose, balanced performance';
      case 'professional':
        return 'Claude Opus — Advanced reasoning and analysis';
      default:
        return `${tier} tier`;
    }
  };

  const handleLaunch = () => {
    // Open a simple window with instructions
    alert(
      `Your OpenClaw instance is running with ${modelId}.\n\n` +
      `To access it, use SSH tunnel:\n` +
      `ssh -L 9000:localhost:9000 root@64.23.142.154\n\n` +
      `Then visit: http://localhost:9000\n` +
      `Token will be provided in your instance.`
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Your OpenClaw Instance</h3>
          <p className="text-sm text-gray-600 mt-2">{getTierDescription()}</p>
          <p className="text-xs text-gray-500 mt-3">Model: {modelId}</p>
        </div>

        <button
          onClick={handleLaunch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"
        >
          Launch OpenClaw
        </button>
      </div>

      <details className="mt-4 pt-4 border-t border-gray-200">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
          Need help accessing your instance?
        </summary>
        <div className="mt-4 text-sm text-gray-600 space-y-3">
          <p>
            <strong>Option 1: SSH Tunnel (Recommended)</strong>
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2 bg-gray-50 p-3 rounded font-mono text-xs">
            <li>Open terminal/command prompt</li>
            <li>Run: <code>ssh -L 9000:localhost:9000 root@64.23.142.154</code></li>
            <li>Keep terminal open</li>
            <li>Visit: <code>http://localhost:9000</code> in browser</li>
            <li>Enter your instance token when prompted</li>
          </ol>
          <p className="text-xs text-gray-500 mt-2">
            Requires SSH access to your server. Contact support if you need help.
          </p>
        </div>
      </details>
    </div>
  );
}
