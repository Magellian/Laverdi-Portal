export const metadata = {
  title: 'Links | LaVerdi',
  description: 'LaVerdi — Your AI Agent. Your Computer. Free desktop app + cloud agents.',
}

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] marble-bg flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-[var(--surface)] border-2 border-[var(--accent)] flex items-center justify-center gold-glow mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L3 14L8 16L12 11L16 16L21 14L12 3Z" fill="var(--accent)" opacity="0.9"/>
              <path d="M8 16L12 21L16 16L12 11L8 16Z" fill="var(--primary)" opacity="0.5"/>
              <path d="M12 3V11M12 11L8 16M12 11L16 16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">LaVerdi</h1>
          <p className="text-[var(--muted)] text-sm mt-1">Your AI Agent. Your Computer.</p>
        </div>

        {/* Primary CTA */}
        <a
          href="/download"
          className="block w-full bg-[var(--accent)] text-[#0a1628] text-center py-4 rounded-xl font-bold text-lg hover:bg-[var(--accent-glow)] transition-all gold-glow mb-3"
        >
          🖥️ Download Free Desktop App
        </a>

        {/* Secondary links */}
        <a
          href="/pricing"
          className="block w-full bg-[var(--surface)] border border-[var(--border)] text-white text-center py-4 rounded-xl font-semibold hover:border-[var(--accent)] transition-all mb-3"
        >
          ☁️ Host a Cloud Agent
        </a>

        <a
          href="/#features"
          className="block w-full bg-[var(--surface)] border border-[var(--border)] text-white text-center py-4 rounded-xl font-semibold hover:border-[var(--accent)] transition-all mb-3"
        >
          ✨ What ChatGPT Can't Do
        </a>

        <a
          href="/about"
          className="block w-full bg-[var(--surface)] border border-[var(--border)] text-white text-center py-4 rounded-xl font-semibold hover:border-[var(--accent)] transition-all mb-6"
        >
          📖 About LaVerdi
        </a>

        {/* Greek Divider */}
        <div className="greek-divider mb-6" />

        {/* Social links */}
        <div className="flex justify-center gap-4 mb-8">
          <a href="https://x.com/laverdiagent" className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--accent)] transition-all" title="X/Twitter">
            𝕏
          </a>
          <a href="https://instagram.com/laverdiagent" className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--accent)] transition-all" title="Instagram">
            📷
          </a>
          <a href="https://tiktok.com/@laverdiagent" className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--accent)] transition-all" title="TikTok">
            🎵
          </a>
          <a href="https://youtube.com/@laverdiagent" className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--accent)] transition-all" title="YouTube">
            ▶️
          </a>
        </div>

        <p className="text-center text-[var(--muted)] text-xs opacity-60">
          © 2026 LaVerdi. No signup needed for the desktop app.
        </p>
      </div>
    </div>
  )
}