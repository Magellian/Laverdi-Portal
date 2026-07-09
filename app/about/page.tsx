import Link from 'next/link'

export const metadata = {
  title: 'About | LaVerdi',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
          &larr; Back to home
        </Link>

        <h1 className="text-4xl font-bold text-white mt-6 mb-8">About LaVerdi</h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
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
            We built LaVerdi because standing up a reliable, always-on AI agent shouldn&apos;t require managing
            servers, API keys, and uptime monitoring yourself. Sign up, subscribe, and your agent is live in
            minutes.
          </p>
        </div>

        <div className="mt-12 rounded-lg bg-zinc-800 border border-zinc-700 p-8">
          <h2 className="text-xl font-bold text-white mb-3">Get in touch</h2>
          <p className="text-zinc-400 mb-4">
            Questions, feedback, or partnership inquiries &mdash; we&apos;d love to hear from you.
          </p>
          <a
            href="mailto:support@laverdi.tech"
            className="inline-block bg-white text-black px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-zinc-100 transition-colors"
          >
            support@laverdi.tech
          </a>
        </div>
      </div>
    </div>
  )
}
