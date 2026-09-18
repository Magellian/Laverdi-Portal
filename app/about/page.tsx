import Link from 'next/link'

export const metadata = {
  title: 'About | LaVerdi',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] marble-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#0a1628]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L4 14L8 16L12 12L16 16L20 14L12 4Z" fill="var(--accent)" opacity="0.8"/>
              <path d="M12 4V12M12 12L8 16M12 12L16 16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-white font-bold text-lg">LaVerdi</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/download" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm transition-colors">Companion</a>
            <a href="/pricing" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm transition-colors">Pricing</a>
            <a href="/login" className="bg-[var(--accent)] text-[#0a1628] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--accent-glow)] transition-all">Log In</a>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
          &larr; Back to home
        </Link>

        <h1 className="text-4xl font-bold text-white mt-6 mb-8">
          About <span className="text-[var(--accent)]">LaVerdi</span>
        </h1>

        <div className="space-y-6 text-[var(--muted)] leading-relaxed">
          <p>
            LaVerdi is a managed hosting platform for personal AI agents. We handle the infrastructure &mdash;
            provisioning, inference, uptime &mdash; so you can focus on what your agent actually does: talk to you
            and your team on the platforms you already use, like Telegram, Discord, and Slack.
          </p>
          <p>
            Every LaVerdi subscription provisions a dedicated agent instance running on isolated infrastructure,
            paired with an inference model matched to your plan &mdash; from fast, lightweight models on Starter up
            to frontier-class models on Enterprise. No shared context, no vendor lock-in on your conversation data,
            and no DevOps required to get running.
          </p>
          <p>
            The <strong className="text-white">LaVerdi Companion</strong> app is an optional local helper for your
            hosted agent — a small app you pair with your instance so it can hand off tasks that need your own
            machine, like installing a package or running a command, under a policy you choose from your dashboard
            (ask first, act automatically, or keep it server-only). It comes with every subscription and is set up
            per-agent rather than downloaded on its own.
          </p>
          <p>
            We built LaVerdi because standing up a reliable, always-on AI agent shouldn&apos;t require managing
            servers, API keys, and uptime monitoring yourself. Sign up, subscribe, and your agent is live in
            minutes — pair Companion afterward, right from your dashboard, if you want it working locally too.
          </p>
        </div>

        {/* Greek Divider */}
        <div className="greek-divider my-12" />

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-3">Get in touch</h2>
          <p className="text-[var(--muted)] mb-4">
            Questions, feedback, or partnership inquiries &mdash; we&apos;d love to hear from you.
          </p>
          <a
            href="mailto:support@laverdi.tech"
            className="inline-block bg-[var(--accent)] text-[#0a1628] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--accent-glow)] transition-all"
          >
            support@laverdi.tech
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-5xl mx-auto text-center text-[var(--muted)] text-sm">
          <p>&copy; 2026 LaVerdi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}