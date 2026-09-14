const platforms = [
  {
    name: 'Windows',
    description: 'Windows 10 / 11 · 64-bit',
    version: 'v0.2.1',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    ),
    downloads: [
      { label: '.exe Installer', url: '/downloads/LaVerdi.Companion_0.2.1_x64-setup.exe', primary: true },
    ],
  },
  {
    name: 'macOS',
    description: 'macOS 13+ · Apple Silicon & Intel',
    version: 'v0.2.1',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    ),
    downloads: [
      { label: 'Apple Silicon (.dmg)', url: '/downloads/LaVerdi.Companion_0.2.1_aarch64.dmg', primary: true },
      { label: 'Intel (.dmg)', url: '/downloads/LaVerdi.Companion_0.2.1_x64.dmg', primary: false },
    ],
  },
  {
    name: 'Linux',
    description: 'Ubuntu 22.04+ · Debian · Fedora',
    version: 'v0.2.1',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.504 0c-.155.664-.494 1.258-.906 1.78-.433.546-1.03 1.013-1.595 1.344a10.584 10.584 0 00-.113-.078c-.05-.035-.125-.079-.162-.116-.467-.338-.925-.741-1.256-1.222C8.173 2.273 7.78 1.595 7.597.856 9.23.28 10.954.137 12.504 0z" />
      </svg>
    ),
    downloads: [
      { label: '.AppImage', url: '/downloads/LaVerdi.Companion_0.2.1_amd64.AppImage', primary: true },
      { label: '.deb Package', url: '/downloads/LaVerdi.Companion_0.2.1_amd64.deb', primary: false },
    ],
  },
]

const highlights = [
  {
    title: 'Full Desktop Integration',
    description: 'Reads your files, manages apps, and controls your desktop. Real system access — not a chatbot.',
  },
  {
    title: '100% Local & Private',
    description: 'Everything runs on your computer. No cloud, no tracking, no account needed. Your data never leaves your machine.',
  },
  {
    title: 'Runs System Commands',
    description: 'Automate repetitive tasks, clean up files, manage installations. Your agent can do anything you can do.',
  },
  {
    title: 'Choose Your AI Provider',
    description: 'Connect any OpenAI-compatible API — OpenRouter, Anthropic, Google, or a local LLM. You control the model.',
  },
]

export default function CompanionPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Companion App</h1>
        <p className="mt-1 text-zinc-400">
          Download the native desktop AI agent. No signup. No cloud. Just you and your agent.
        </p>
      </div>

      {/* Download cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3 text-zinc-300">
              {platform.icon}
              <div>
                <span className="text-lg font-semibold text-white block">{platform.name}</span>
                <span className="text-xs text-zinc-500">{platform.version}</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 flex-1">{platform.description}</p>
            <div className="flex flex-col gap-1.5">
              {platform.downloads.map((dl, idx) => (
                <a
                  key={dl.label}
                  href={dl.url}
                  className={
                    dl.primary
                      ? 'flex items-center justify-center gap-2 rounded-lg bg-white text-black text-sm font-medium px-4 py-2.5 hover:bg-zinc-200 transition-colors'
                      : 'flex items-center justify-center gap-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 hover:border-zinc-500 transition-colors'
                  }
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {dl.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* macOS note */}
      <div className="mb-10 rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 text-sm text-zinc-400">
        <strong className="text-zinc-300">macOS users:</strong> The app is unsigned. After downloading, right-click the .dmg and select <strong className="text-white">Open</strong> to bypass Gatekeeper on first launch.
      </div>

      {/* How to Install */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">How to Install</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            { step: '1', title: 'Download', desc: 'Pick your platform above and download the installer.' },
            { step: '2', title: 'Install', desc: 'Run the .exe (Windows), open the .dmg (macOS), or chmod +x the .AppImage (Linux).' },
            { step: '3', title: 'Configure', desc: 'Select your AI provider and paste your API key on first launch.' },
            { step: '4', title: 'Start Chatting', desc: 'Your agent is ready. Ask it to clean your desktop or automate a task.' },
          ].map((s) => (
            <div key={s.step} className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-bold text-zinc-500 mb-2">STEP {s.step}</p>
              <p className="text-sm font-medium text-white mb-1">{s.title}</p>
              <p className="text-xs text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What's included */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">What&apos;s Included</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {highlights.map((feature) => (
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

      {/* Release info */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Current release: v0.2.1</p>
          <p className="text-sm text-zinc-400 mt-0.5">
            Built with Tauri 2 · Windows, macOS (ARM & Intel), Linux · All downloads also available on GitHub
          </p>
        </div>
        <a
          href="https://github.com/Magellian/laverdi-companion/releases"
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