import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] marble-bg">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[#0a1628]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#0a1628]/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            {/* Hermes wing icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 14L8 16L12 12L16 16L20 14L12 4Z" fill="var(--accent)" opacity="0.8"/>
              <path d="M8 16L12 20L16 16L12 12L8 16Z" fill="var(--primary)" opacity="0.6"/>
              <path d="M12 4V12M12 12L8 16M12 12L16 16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-white font-bold text-lg tracking-wide">LaVerdi</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/pricing" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm transition-colors">
              Pricing
            </a>
            <a href="/#features" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm transition-colors">
              Features
            </a>
            {session ? (
              <a
                href="/dashboard"
                className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--primary-glow)] transition-all blue-glow"
              >
                Dashboard
              </a>
            ) : (
              <a
                href="/login"
                className="bg-[var(--accent)] text-[#0a1628] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--accent-glow)] transition-all"
              >
                Log In
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20 text-center relative">
        {/* Decorative columns */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="ionic-column h-48" />
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="ionic-column h-48" />
        </div>

        {/* Animated icon */}
        <div className="animate-float mb-10 inline-block">
          <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gold-glow">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L3 14L8 16L12 11L16 16L21 14L12 3Z" fill="var(--accent)" opacity="0.9"/>
              <path d="M8 16L12 21L16 16L12 11L8 16Z" fill="var(--primary)" opacity="0.5"/>
              <path d="M12 3V11M12 11L8 16M12 11L16 16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
          Your AI Agent.<br />
          <span className="text-[var(--accent)]">Your Computer.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-[var(--muted)] mb-8 max-w-2xl mx-auto leading-relaxed">
          Do what ChatGPT can&apos;t — clean your files, build apps, automate your desktop. No signup required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a
            href="/download"
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-[#0a1628] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[var(--accent-glow)] transition-all gold-glow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download for Free
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[var(--accent)] hover:text-[#0a1628] transition-all"
          >
            Host an Agent
          </a>
        </div>

        {/* Platform badges */}
        <div className="flex flex-wrap justify-center gap-4 text-[var(--muted)] text-sm">
          <a href="/download" className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0,0 L11.5,16 L3,0 L11.5,0 L15,4.5 L15,0 L24,0 L12.5,16 Z"/></svg>
            Windows
          </a>
          <a href="/download" className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            macOS
          </a>
          <a href="/download" className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.504 0c-.155.664-.494 1.258-.906 1.78-.433.546-1.03 1.013-1.595 1.344a10.584 10.584 0 00-.113-.078c-.05-.035-.125-.079-.162-.116-.467-.338-.925-.741-1.256-1.222C8.173 2.273 7.78 1.595 7.597.856 9.23.28 10.954.137 12.504 0zM22.98 8.547c-.17.087-.34.17-.509.262-.571.37-1.194.6-1.726.958-.843.565-1.58 1.191-2.088 2.053-.641 1.087-.72 2.44-.41 3.604.349 1.31 1.287 2.397 2.488 3.021.145.081.293.157.44.234a9.24 9.24 0 01-.448 1.024c-.405.843-.821 1.68-1.333 2.45-.318.478-.684.926-1.131 1.278-.26.204-.561.365-.872.457-.33.098-.67.14-1.005.088-.535-.082-1.022-.324-1.509-.524-.706-.29-1.398-.605-2.129-.739-.63-.115-1.299-.115-1.914.054-.55.151-1.07.4-1.6.633-.466.202-.943.42-1.452.504-.354.058-.736.009-1.069-.155-.355-.175-.604-.459-.802-.788-.448-.743-.754-1.567-1.036-2.395-.409-1.203-.708-2.442-.75-3.708-.028-.837.115-1.69.478-2.452.42-.881 1.123-1.553 1.998-1.95.798-.363 1.709-.453 2.564-.355.409.047.81.15 1.22.209 1.09.155 2.197-.007 3.189-.484.573-.276 1.1-.626 1.573-1.041.268-.235.54-.484.86-.662.37-.206.805-.317 1.235-.238.642.119 1.189.51 1.675.893.329.26.633.552.975.8l-.005-.003z"/></svg>
            Linux
          </a>
        </div>
      </section>

      {/* Greek Divider */}
      <div className="greek-divider max-w-5xl mx-auto" />

      {/* Features Section */}
      <section id="features" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            What ChatGPT <span className="text-[var(--accent)]">Can&apos;t</span> Do
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-xl mx-auto">
            Your AI agent runs locally on your computer with real system access.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
            <div className="text-3xl mb-4">🖥️</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Local First</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              Runs on your machine. Your files never leave your computer.
            </p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">One-Click Tutorials</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              Guided wins in 60 seconds. No manual reading required.
            </p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
            <div className="text-3xl mb-4">🔌</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">System Integration</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              Reads your files, manages your apps, controls your desktop.
            </p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Private by Default</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              No cloud. No tracking. No account needed for the desktop app.
            </p>
          </div>
        </div>
      </section>

      {/* Greek Divider */}
      <div className="greek-divider max-w-5xl mx-auto" />

      {/* Agent Hosting Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-sm text-[var(--muted)]">Cloud Platform</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Want an agent that&apos;s{' '}
              <span className="text-[var(--primary)]">always online</span>?
            </h2>
            <p className="text-lg text-[var(--muted)] mb-8 leading-relaxed">
              Provision a cloud-hosted agent in seconds. Connect it to Telegram, Discord, or Slack. Your data stays yours — enterprise-grade security, complete privacy.
            </p>
            <div className="flex gap-4">
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--primary-glow)] transition-all blue-glow"
              >
                View Plans
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-2 border border-[var(--border)] text-white px-6 py-3 rounded-lg font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
              >
                Sign In
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              {/* Fake chat preview */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-xs font-bold shrink-0">LV</div>
                  <div className="bg-[var(--background)] rounded-lg rounded-tl-none px-4 py-2 text-sm text-[var(--muted)] max-w-[80%]">
                    Hey! I&apos;m your agent. I can manage your tasks, answer questions, and connect to your tools.
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-[var(--primary)] rounded-lg rounded-tr-none px-4 py-2 text-sm text-white max-w-[80%]">
                    Clean up my downloads folder
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0">C</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-xs font-bold shrink-0">LV</div>
                  <div className="bg-[var(--background)] rounded-lg rounded-tl-none px-4 py-2 text-sm text-[var(--muted)] max-w-[80%]">
                    Done! Freed 4.2 GB from old installers and temp files 🎉
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Greek Divider */}
      <div className="greek-divider max-w-5xl mx-auto" />

      {/* Comparison Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why Not Just Use <span className="text-[var(--accent)]">ChatGPT</span>?
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-xl mx-auto">
            ChatGPT is great at conversation. But it can&apos;t touch your files, manage your desktop, or run on your machine.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {/* ChatGPT */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-bold text-white mb-4">ChatGPT</h3>
            <ul className="space-y-3 text-sm text-[var(--muted)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">✦</span>
                <span>Great at conversation &amp; writing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--danger)] mt-0.5">✗</span>
                <span>Can&apos;t access your files</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--danger)] mt-0.5">✗</span>
                <span>Can&apos;t manage your desktop</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--danger)] mt-0.5">✗</span>
                <span>Your data goes to the cloud</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--danger)] mt-0.5">✗</span>
                <span>No system automation</span>
              </li>
            </ul>
          </div>

          {/* LaVerdi Desktop */}
          <div className="bg-[var(--surface)] border-2 border-[var(--accent)] rounded-xl p-8 gold-glow relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-[#0a1628] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Best for Desktop
            </div>
            <div className="text-3xl mb-4 mt-2">🖥️</div>
            <h3 className="text-lg font-bold text-white mb-2">LaVerdi Companion</h3>
            <p className="text-xs text-[var(--muted)] mb-4">v0.2.1 — Free · No account needed</p>

            {/* What&apos;s Included */}
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">What&apos;s Included</h4>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--success)] mt-0.5 shrink-0">✓</span>
                  <span>Full desktop integration — reads your files, manages apps, controls your desktop</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--success)] mt-0.5 shrink-0">✓</span>
                  <span>Runs system commands &amp; automates repetitive tasks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--success)] mt-0.5 shrink-0">✓</span>
                  <span>100% local &amp; private — nothing leaves your computer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--success)] mt-0.5 shrink-0">✓</span>
                  <span>No account, no signup, no tracking</span>
                </li>
              </ul>
            </div>

            {/* How to Install */}
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">How to Install</h4>
              <ol className="space-y-1.5 text-xs text-[var(--muted)] list-decimal list-inside">
                <li>Download for your platform below</li>
                <li>Run the installer (Windows) or open the AppImage (Linux)</li>
                <li>Select your AI provider &amp; model</li>
                <li>Start chatting — your agent is ready</li>
              </ol>
            </div>

            {/* Download Buttons */}
            <div className="space-y-2">
              <a
                href="/downloads/laverdi-companion_0.2.1_x64-setup.exe"
                className="flex items-center justify-center gap-2 w-full bg-[var(--accent)] text-[#0a1628] py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--accent-glow)] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M0,0 L11.5,16 L3,0 L11.5,0 L15,4.5 L15,0 L24,0 L12.5,16 Z"/></svg>
                Download for Windows
              </a>
              <a
                href="/downloads/laverdi-companion_0.2.1_amd64.AppImage"
                className="flex items-center justify-center gap-2 w-full bg-[var(--primary)] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--primary-glow)] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.504 0c-.155.664-.494 1.258-.906 1.78-.433.546-1.03 1.013-1.595 1.344a10.584 10.584 0 00-.113-.078c-.05-.035-.125-.079-.162-.116-.467-.338-.925-.741-1.256-1.222C8.173 2.273 7.78 1.595 7.597.856 9.23.28 10.954.137 12.504 0z"/></svg>
                Download for Linux
              </a>
              <a
                href="/downloads/laverdi-companion_0.2.1_aarch64.dmg"
                className="flex items-center justify-center gap-2 w-full border border-[var(--accent)] text-[var(--accent)] py-2 rounded-lg font-semibold text-sm hover:bg-[var(--accent)] hover:text-[#0a1628] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Download for macOS
              </a>
            </div>

            <p className="text-[var(--muted)] text-xs mt-4 text-center">
              All downloads at{' '}
              <a href="/download" className="text-[var(--accent)] hover:underline">laverdi.tech/download</a>
            </p>
          </div>

          {/* LaVerdi Cloud */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8">
            <div className="text-3xl mb-4">☁️</div>
            <h3 className="text-lg font-bold text-white mb-4">LaVerdi Cloud</h3>
            <ul className="space-y-3 text-sm text-[var(--muted)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">✦</span>
                <span>Always-on Telegram/Discord agent</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">✓</span>
                <span>Provision in 60 seconds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">✓</span>
                <span>Enterprise-grade security</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">✓</span>
                <span>Multi-platform connections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">✦</span>
                <span>From <strong className="text-white">$19/mo</strong> with free trial</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 max-w-2xl mx-auto gold-glow">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-lg text-[var(--muted)] mb-8">
            Download the free companion app, or launch a cloud agent in 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/download"
              className="bg-[var(--accent)] text-[#0a1628] px-8 py-3 rounded-lg font-semibold text-lg hover:bg-[var(--accent-glow)] transition-all gold-glow"
            >
              Download Free App
            </a>
            <a
              href="/pricing"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white hover:text-[#0a1628] transition-all"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-5xl mx-auto">
          {/* Greek divider before footer */}
          <div className="greek-divider mb-10" />
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3L3 14L8 16L12 11L16 16L21 14L12 3Z" fill="var(--accent)" opacity="0.8"/></svg>
                LaVerdi
              </h4>
              <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">
                Your personal AI agent. Desktop app + cloud platform.
              </p>
              <div className="flex gap-3">
                <a href="https://x.com/laverdiagent" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors text-sm" title="X/Twitter">𝕏</a>
                <a href="https://instagram.com/laverdiagent" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors text-sm" title="Instagram">📷</a>
                <a href="https://tiktok.com/@laverdiagent" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors text-sm" title="TikTok">🎵</a>
                <a href="https://youtube.com/@laverdiagent" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors text-sm" title="YouTube">▶️</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-[var(--muted)] text-sm">
                <li><a href="/download" className="hover:text-[var(--accent)] transition-colors">Download</a></li>
                <li><a href="#features" className="hover:text-[var(--accent)] transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-[var(--accent)] transition-colors">Pricing</a></li>
                <li><a href="/dashboard/docs" className="hover:text-[var(--accent)] transition-colors">Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-[var(--muted)] text-sm">
                <li><a href="/about" className="hover:text-[var(--accent)] transition-colors">About</a></li>
                <li><a href="/about" className="hover:text-[var(--accent)] transition-colors">Blog</a></li>
                <li><a href="mailto:support@laverdi.tech" className="hover:text-[var(--accent)] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-[var(--muted)] text-sm">
                <li><a href="/legal/privacy" className="hover:text-[var(--accent)] transition-colors">Privacy</a></li>
                <li><a href="/legal/terms" className="hover:text-[var(--accent)] transition-colors">Terms</a></li>
                <li><a href="/legal/privacy" className="hover:text-[var(--accent)] transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--border)] pt-8 text-center text-[var(--muted)] text-sm">
            <p>&copy; 2026 LaVerdi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}