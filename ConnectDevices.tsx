import { useState } from 'react'

interface ConnectDevicesProps {
  instance?: {
    port?: number | null
    ip_address?: string | null
    status?: string
    pairing_token?: string | null
  } | null
  gatewayToken?: string | null
}

export function ConnectDevices({ instance, gatewayToken }: ConnectDevicesProps) {
  const [showSetupCode, setShowSetupCode] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const isReady = instance?.status === 'ready' && instance?.port
  const gatewayWsUrl = isReady
    ? `wss://laverdi.tech/agent/${instance.port}`
    : null

  const webInterfaceUrl = isReady
    ? `https://laverdi.tech/agent/${instance.port}/chat?session=main`
    : null

  // Build setup code for companion app pairing
  // This is the base64-encoded JSON payload the apps expect
  const setupCode = isReady && gatewayToken
    ? btoa(JSON.stringify({
        url: gatewayWsUrl,
        token: gatewayToken,
      }))
    : null

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Connect Your Devices</h2>
          <p className="text-gray-500 text-sm mt-1">
            Access your AI assistant from anywhere — browser, phone, or desktop
          </p>
        </div>
        <div className="text-4xl">🦞</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Web Interface */}
        <div className="relative border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl group-hover:bg-blue-100 transition-colors">
              🌐
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Web Interface</h3>
              <p className="text-xs text-gray-500">Chat in your browser</p>
            </div>
            {isReady && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                Ready
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Full-featured chat interface with file browser, canvas, and session management. No install needed.
          </p>
          {isReady ? (
            <a
              href={webInterfaceUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Web Chat
            </a>
          ) : (
            <div className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg text-center">
              Waiting for instance...
            </div>
          )}
        </div>

        {/* iOS Companion */}
        <div className="relative border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-md transition-all group">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-xl group-hover:bg-purple-100 transition-colors">
              📱
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">iOS App</h3>
              <p className="text-xs text-gray-500">iPhone &amp; iPad</p>
            </div>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              Preview
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Voice conversations, camera capture, canvas, and location sharing. Talk to your agent hands-free.
          </p>
          <a
            href="https://testflight.apple.com/join/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Join TestFlight
          </a>
        </div>

        {/* Android Companion */}
        <div className="relative border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition-all group">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl group-hover:bg-green-100 transition-colors">
              🤖
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Android App</h3>
              <p className="text-xs text-gray-500">Phones &amp; tablets</p>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
              Coming Soon
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Voice mode, camera, canvas display, and background node capabilities. Build from source today.
          </p>
          <a
            href="https://github.com/openclaw/openclaw/tree/main/apps/android"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Browser Extension */}
        <div className="relative border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition-all group">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-xl group-hover:bg-orange-100 transition-colors">
              🧩
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Browser Extension</h3>
              <p className="text-xs text-gray-500">Chrome &amp; Firefox</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Quick-access sidebar, page context sharing, and screenshot capture. Your agent sees what you see.
          </p>
          <a
            href="https://docs.openclaw.ai/web/control-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Learn More
          </a>
        </div>

        {/* Chat Apps */}
        <div className="relative border border-gray-200 rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition-all group">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-xl group-hover:bg-teal-100 transition-colors">
              💬
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Chat Apps</h3>
              <p className="text-xs text-gray-500">WhatsApp, Telegram, Signal &amp; more</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Message your agent from any chat app you already use. 25+ platforms supported including Slack and Discord.
          </p>
          <a
            href="https://docs.openclaw.ai/channels"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Setup Channels
          </a>
        </div>

        {/* Setup Code / Pairing */}
        <div className="relative border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl group-hover:bg-indigo-100 transition-colors">
              🔗
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Quick Pair</h3>
              <p className="text-xs text-gray-500">Connect any device</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Copy your setup code to pair the companion app or connect from another browser. One code, instant access.
          </p>
          {isReady && setupCode ? (
            <button
              onClick={() => {
                if (showSetupCode) {
                  copyToClipboard(setupCode, 'setup')
                } else {
                  setShowSetupCode(true)
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full justify-center"
            >
              {copied === 'setup' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : showSetupCode ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Setup Code
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Show Setup Code
                </>
              )}
            </button>
          ) : (
            <div className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg text-center">
              Waiting for instance...
            </div>
          )}
          {showSetupCode && setupCode && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <code className="text-xs text-gray-600 break-all block max-h-16 overflow-y-auto">
                {setupCode}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Gateway connection info */}
      {isReady && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Gateway Online</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>
              WebSocket: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{gatewayWsUrl}</code>
            </span>
            <span>
              Port: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{instance?.port}</code>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
