const platforms = [
  {
    name: 'Windows',
    description: 'Windows 10 or later (64-bit)',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    ),
    ext: '.msi',
  },
  {
    name: 'macOS',
    description: 'macOS 11 or later (Apple Silicon & Intel)',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    ),
    ext: '.dmg',
  },
  {
    name: 'Linux',
    description: 'Ubuntu 20.04+, Debian, Fedora, and others',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path strokeLinecap="round" d="M8 21h8M12 17v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l2 2-2 2M11 12h4" />
      </svg>
    ),
    ext: '.AppImage',
  },
]

const features = [
  {
    title: 'Native Performance',
    description: 'Built with Tauri 2 for a lightweight, fast experience with minimal resource usage.',
  },
  {
    title: 'Offline Support',
    description: 'Core features work without an internet connection and sync when you reconnect.',
  },
  {
    title: 'System Tray',
    description: 'Stays out of your way in the system tray, ready when you need it.',
  },
  {
    title: 'Auto Updates',
    description: 'Automatically receives updates in the background so you stay current.',
  },
]

export default function CompanionPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Companion App</h1>
        <p className="mt-1 text-zinc-400">
          Download the native desktop app for a faster, always-available LaVerdi experience.
        </p>
      </div>

      {/* Download cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3 text-zinc-300">
              {platform.icon}
              <span className="text-lg font-semibold text-white">{platform.name}</span>
            </div>
            <p className="text-sm text-zinc-400 flex-1">{platform.description}</p>
            <button
              disabled
              className="flex items-center justify-center gap-2 rounded-lg bg-white text-black text-sm font-medium px-4 py-2.5 opacity-50 cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Coming Soon
            </button>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">What&apos;s included</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl bg-zinc-900 border border-zinc-800 p-5"
            >
              <p className="text-sm font-medium text-white mb-1">{feature.title}</p>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Version info */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Current release</p>
          <p className="text-sm text-zinc-400 mt-0.5">Built with Tauri 2 &mdash; Windows, macOS, Linux</p>
        </div>
        <a
          href="https://github.com/laverdi/companion/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-400 hover:text-white transition-colors shrink-0"
        >
          View release notes &rarr;
        </a>
      </div>
    </div>
  )
}
