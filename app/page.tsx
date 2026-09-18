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
          <span className="text-[var(--accent)]">Always On.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-[var(--muted)] mb-8 max-w-2xl mx-auto leading-relaxed">
          Provision a hosted agent in minutes and connect it to Telegram, Discord, or Slack — no servers, API keys, or uptime monitoring to manage yourself.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-[#0a1628] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[var(--accent-glow)] transition-all gold-glow"
          >
            View Plans
          </a>
          <a
            href="/login"
            className="inline-flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[var(--accent)] hover:text-[#0a1628] transition-all"
          >
            Log In
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
            Your agent runs 24/7 on hosted infrastructure, wired into the tools you already use.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
            <div className="text-3xl mb-4">🟢</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Always-On</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              Runs continuously on your own hosted instance — no laptop to keep open, no tab to leave running.
            </p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Connects to Your Channels</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              Talk to your agent from Telegram, Discord, or Slack — wherever you and your team already are.
            </p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Sandboxed & Locked Down</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              Every command runs in an isolated, egress-locked environment — your agent can&apos;t reach anything it shouldn&apos;t.
            </p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
            <div className="text-3xl mb-4">🖥️</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Optional Local Companion</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              Pair a small local app so your agent can hand off tasks that need your own machine — under a policy you control.
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
        <div className="grid md:grid-cols-2 gap-6">
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
              Hosted for You
            </div>
            <div className="text-3xl mb-4 mt-2">☁️</div>
            <h3 className="text-lg font-bold text-white mb-4">LaVerdi</h3>
            <ul className="space-y-3 text-sm text-[var(--muted)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">✦</span>
                <span>Always-on agent — Telegram, Discord, or Slack</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">✓</span>
                <span>Provision in 60 seconds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">✓</span>
                <span>Sandboxed, egress-locked execution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">✓</span>
                <span>Optional Companion app to reach your own machine</span>
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
            Provision your hosted agent in 60 seconds — pair the Companion app afterward if you want it working locally too.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pricing"
              className="bg-[var(--accent)] text-[#0a1628] px-8 py-3 rounded-lg font-semibold text-lg hover:bg-[var(--accent-glow)] transition-all gold-glow"
            >
              View Plans
            </a>
            <a
              href="/login"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white hover:text-[#0a1628] transition-all"
            >
              Log In
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
                Your personal AI agent, hosted and always on.
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
                <li><a href="/download" className="hover:text-[var(--accent)] transition-colors">Companion</a></li>
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