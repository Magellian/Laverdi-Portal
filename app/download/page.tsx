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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Download <span className="text-[var(--accent)]">LaVerdi Companion</span>
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
            The free desktop AI agent that runs on your computer. No signup. No cloud. Just you and your agent.
          </p>
        </div>

        {/* Greek Divider */}
        <div className="greek-divider max-w-3xl mx-auto mb-16" />

        {/* Platform Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Windows */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 text-center hover:border-[var(--accent)] transition-all group">
            <div className="text-5xl mb-6">
              <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
                <path d="M0,0 L11.5,16 L3,0 L11.5,0 L15,4.5 L15,0 L24,0 L12.5,16 Z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Windows</h3>
            <p className="text-[var(--muted)] text-sm mb-6">Windows 10 / 11 · 64-bit</p>
            <a
              href="/downloads/laverdi-companion_0.2.1_x64-setup.exe"
              className="block w-full bg-[var(--accent)] text-[#0a1628] py-3 rounded-lg font-semibold hover:bg-[var(--accent-glow)] transition-all text-center"
            >
              Download .exe
            </a>
            <p className="text-[var(--accent)] text-xs mt-3">v0.2.1 — Available now!</p>
          </div>

          {/* macOS */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 text-center hover:border-[var(--accent)] transition-all group">
            <div className="text-5xl mb-6">
              <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">macOS</h3>
            <p className="text-[var(--muted)] text-sm mb-6">macOS 13+ · Intel & Apple Silicon</p>
            <a
              href="/downloads/laverdi-companion_0.2.1_aarch64.dmg"
              className="block w-full bg-[var(--accent)] text-[#0a1628] py-3 rounded-lg font-semibold hover:bg-[var(--accent-glow)] transition-all text-center"
            >
              Download .dmg
            </a>
            <p className="text-[var(--accent)] text-xs mt-3">v0.2.1 — Available now!</p>
          </div>

          {/* Linux */}
          <div className="bg-[var(--surface)] border border-[var(--accent)] rounded-xl p-8 text-center hover:border-[var(--accent-glow)] transition-all group gold-glow">
            <div className="text-5xl mb-6">
              <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
                <path d="M12.504 0c-.155.664-.494 1.258-.906 1.78-.433.546-1.03 1.013-1.595 1.344a10.584 10.584 0 00-.113-.078c-.05-.035-.125-.079-.162-.116-.467-.338-.925-.741-1.256-1.222C8.173 2.273 7.78 1.595 7.597.856 9.23.28 10.954.137 12.504 0zM22.98 8.547c-.17.087-.34.17-.509.262-.571.37-1.194.6-1.726.958-.843.565-1.58 1.191-2.088 2.053-.641 1.087-.72 2.44-.41 3.604.349 1.31 1.287 2.397 2.488 3.021.145.081.293.157.44.234a9.24 9.24 0 01-.448 1.024c-.405.843-.821 1.68-1.333 2.45-.318.478-.684.926-1.131 1.278-.26.204-.561.365-.872.457-.33.098-.67.14-1.005.088-.535-.082-1.022-.324-1.509-.524-.706-.29-1.398-.605-2.129-.739-.63-.115-1.299-.115-1.914.054-.55.151-1.07.4-1.6.633-.466.202-.943.42-1.452.504-.354.058-.736.009-1.069-.155-.355-.175-.604-.459-.802-.788-.448-.743-.754-1.567-1.036-2.395-.409-1.203-.708-2.442-.75-3.708-.028-.837.115-1.69.478-2.452.42-.881 1.123-1.553 1.998-1.95.798-.363 1.709-.453 2.564-.355.409.047.81.15 1.22.209 1.09.155 2.197-.007 3.189-.484.573-.276 1.1-.626 1.573-1.041.268-.235.54-.484.86-.662.37-.206.805-.317 1.235-.238.642.119 1.189.51 1.675.893.329.26.633.552.975.8l-.005-.003z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Linux</h3>
            <p className="text-[var(--muted)] text-sm mb-6">Ubuntu 22.04+ · Debian · Fedora</p>
            <div className="flex flex-col gap-2">
              <a
                href="/downloads/laverdi-companion_0.2.1_amd64.AppImage"
                className="w-full bg-[var(--accent)] text-[#0a1628] py-3 rounded-lg font-semibold hover:bg-[var(--accent-glow)] transition-all text-center"
              >
                Download .AppImage
              </a>
              <a
                href="/downloads/laverdi-companion_0.2.1_amd64.deb"
                className="w-full border border-[var(--border)] text-white py-2 rounded-lg font-semibold hover:border-[var(--accent)] transition-all text-center text-sm"
              >
                .deb Package
              </a>
            </div>
            <p className="text-[var(--accent)] text-xs mt-3">v0.2.1 — Available now!</p>
          </div>
        </div>

        {/* Why No Signup */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 mb-16 text-center max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">No Signup Required</h2>
          <p className="text-[var(--muted)] leading-relaxed">
            The desktop app runs entirely on your computer. We don&apos;t collect your data, 
            we don&apos;t require an account, and we never see your files. 
            Everything stays local — the way AI agents should work.
          </p>
        </div>

        {/* All Platforms */}
        <div className="text-center border border-[var(--border)] rounded-xl p-8 max-w-xl mx-auto gold-glow">
          <h2 className="text-xl font-bold text-white mb-4">All Platforms</h2>
          <p className="text-[var(--muted)] mb-6">
            LaVerdi Companion runs on Windows, macOS, and Linux.
            Download for your platform above — or grab the latest release from GitHub.
          </p>
          <a
            href="https://github.com/Magellian/laverdi-companion/releases"
            className="inline-block bg-[var(--accent)] text-[#0a1628] px-6 py-3 rounded-lg font-semibold hover:bg-[var(--accent-glow)] transition-all"
          >
            View on GitHub
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