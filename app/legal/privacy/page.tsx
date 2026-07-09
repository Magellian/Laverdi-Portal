import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | LaVerdi',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
          &larr; Back to home
        </Link>

        <h1 className="text-4xl font-bold text-white mt-6 mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-12">Last updated: July 9, 2026</p>

        <div className="space-y-10">
          <section>
            <p className="text-zinc-300 leading-relaxed">
              LaVerdi (&quot;LaVerdi,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides managed hosting for
              personal AI agents that connect to messaging platforms like Telegram, Discord, and Slack. This Privacy
              Policy explains what information we collect, how we use it, and the choices you have. By using our
              service, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                <span className="text-white font-semibold">Account information.</span> When you sign up, we collect
                your email address for authentication (via magic link) and account communications.
              </p>
              <p>
                <span className="text-white font-semibold">Billing information.</span> Payments are processed by
                Stripe. We store your subscription tier, status, and billing history, but we do not store your full
                card number &mdash; that is handled entirely by Stripe.
              </p>
              <p>
                <span className="text-white font-semibold">Channel credentials.</span> When you connect a messaging
                platform, we store the bot token or credential you provide (e.g. a Telegram bot token) so your agent
                instance can authenticate with that platform on your behalf.
              </p>
              <p>
                <span className="text-white font-semibold">Agent usage data.</span> We collect operational metadata
                about your agent instance, such as status, uptime, port allocation, and model configuration, in order
                to run and support the service.
              </p>
              <p>
                <span className="text-white font-semibold">Conversation content.</span> Messages you send to your
                agent are processed to generate responses. We do not use your conversation content to train models,
                and we do not sell it.
              </p>
              <p>
                <span className="text-white font-semibold">Technical data.</span> We automatically collect standard
                technical information such as IP address, browser type, and access timestamps for security and
                troubleshooting purposes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Data</h2>
            <ul className="space-y-3 text-zinc-300 leading-relaxed list-disc list-inside">
              <li>To provision, run, and maintain your AI agent instance</li>
              <li>To authenticate you and secure your account</li>
              <li>To process payments and manage your subscription</li>
              <li>To connect your agent to the messaging platforms you configure</li>
              <li>To provide customer support and respond to inquiries</li>
              <li>To monitor service health, detect abuse, and prevent fraud</li>
              <li>To send important account, billing, or service notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Storage & Security</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                Account, subscription, and instance data is stored in a self-hosted PostgreSQL database on
                infrastructure we operate and control. Bot tokens and other channel credentials are stored encrypted
                at rest.
              </p>
              <p>
                We retain your data for as long as your account is active. If you cancel your subscription, we
                retain account records for a limited period to comply with legal and accounting obligations, after
                which data associated with deprovisioned agent instances is deleted.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>We share limited data with the following categories of third parties, only as needed to operate the service:</p>
              <ul className="space-y-3 list-disc list-inside">
                <li><span className="text-white font-semibold">Stripe</span> &mdash; payment processing and subscription billing</li>
                <li><span className="text-white font-semibold">Vultr</span> &mdash; cloud infrastructure hosting and serverless inference</li>
                <li><span className="text-white font-semibold">Telegram, Discord, Slack</span> &mdash; the messaging platforms you choose to connect your agent to, governed by their own privacy policies</li>
              </ul>
              <p>
                We do not sell your personal information to third parties, and we do not share your conversation
                content for advertising purposes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>Depending on your location, you may have the right to:</p>
              <ul className="space-y-3 list-disc list-inside">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent or object to certain processing</li>
              </ul>
              <p>
                To exercise any of these rights, contact us using the details below. We will respond within a
                reasonable timeframe.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <p className="text-zinc-300 leading-relaxed">
              If you have questions about this Privacy Policy or how we handle your data, contact us at{' '}
              <a href="mailto:support@laverdi.tech" className="text-white underline hover:text-zinc-300 transition-colors">
                support@laverdi.tech
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
