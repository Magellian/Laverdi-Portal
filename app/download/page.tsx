export default function Download() {
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
            <a href="/pricing" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm transition-colors">Pricing</a>
            <a href="/#features" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm transition-colors">Features</a>
            <a href="/login" className="bg-[var(--accent)] text-[#0a1628] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--accent-glow)] transition-all">Log In</a>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            LaVerdi <span className="text-[var(--accent)]">Companion</span>
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
            Your LaVerdi agent runs in the cloud, hosted for you the moment you subscribe.
            Companion is an optional local helper you can pair with it — a small app on your
            own computer that your agent can hand certain local tasks to, under policies you
            control from your dashboard.
          </p>
        </div>

        <div className="greek-divider max-w-2xl mx-auto mb-12" />

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-3">For LaVerdi subscribers</h2>
          <p className="text-[var(--muted)] leading-relaxed mb-6">
            Companion pairs with a specific agent on your account, so it's set up from your
            dashboard rather than a generic download — that's also where you choose what it's
            allowed to do (ask first, act automatically, or stay server-only).
          </p>
          <a
            href="/login"
            className="inline-block bg-[var(--accent)] text-[#0a1628] px-8 py-3 rounded-lg font-semibold hover:bg-[var(--accent-glow)] transition-all"
          >
            Log In to Set Up Companion
          </a>
          <p className="text-[var(--muted)] text-xs mt-4">
            Windows is supported today; macOS and Linux are on the roadmap.
          </p>
        </div>

        <div className="text-center border border-[var(--border)] rounded-xl p-8 max-w-xl mx-auto gold-glow">
          <h2 className="text-xl font-bold text-white mb-4">Not a subscriber yet?</h2>
          <p className="text-[var(--muted)] mb-6">
            See plans and pricing to get your own hosted LaVerdi agent — Companion comes with it.
          </p>
          <a
            href="/pricing"
            className="inline-block bg-[var(--accent)] text-[#0a1628] px-6 py-3 rounded-lg font-semibold hover:bg-[var(--accent-glow)] transition-all"
          >
            View Plans
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
  );
}
