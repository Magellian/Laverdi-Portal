import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black to-zinc-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="text-white font-bold text-lg">LaVerdi</a>
          <div className="flex items-center gap-4">
            <a href="/pricing" className="text-zinc-400 hover:text-white text-sm transition-colors">
              Pricing
            </a>
            {session ? (
              <a
                href="/dashboard"
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-100 transition-colors"
              >
                Dashboard
              </a>
            ) : (
              <a
                href="/login"
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-100 transition-colors"
              >
                Log In
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-36 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
          Your AI Agent.<br />Your Rules.
        </h1>
        <p className="text-xl sm:text-2xl text-zinc-300 mb-8 max-w-2xl mx-auto">
          Provision a personal AI agent in seconds. Connect it to Telegram, Discord, or Slack. Your data stays yours.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a
            href="/pricing"
            className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="inline-block border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-zinc-800 p-8 rounded-lg border border-zinc-700 hover:border-white transition-colors">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-3">Provision in Seconds</h3>
            <p className="text-zinc-400">
              One click deploys your agent. No DevOps required. Get up and running in minutes, not days.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-zinc-800 p-8 rounded-lg border border-zinc-700 hover:border-white transition-colors">
            <div className="text-4xl mb-4">🔌</div>
            <h3 className="text-xl font-bold text-white mb-3">Connect Any Platform</h3>
            <p className="text-zinc-400">
              Telegram, Discord, Slack — your agent works where you do. Multi-platform support out of the box.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-zinc-800 p-8 rounded-lg border border-zinc-700 hover:border-white transition-colors">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-3">Your Data, Your Rules</h3>
            <p className="text-zinc-400">
              Enterprise-grade security. Your conversations stay private. Complete data ownership and control.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to get started?</h2>
        <p className="text-lg text-zinc-400 mb-8">
          Join the platform built for developers who care about privacy.
        </p>
        <a
          href="/pricing"
          className="inline-block bg-white text-black px-10 py-4 rounded-lg font-semibold text-lg hover:bg-zinc-100 transition-colors"
        >
          View Pricing & Get Started
        </a>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-700 py-8 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">LaVerdi</h4>
              <p className="text-zinc-400 text-sm">Your personal AI agent platform.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-700 pt-8 text-center text-zinc-500 text-sm">
            <p>&copy; 2026 LaVerdi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
