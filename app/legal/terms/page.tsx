import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | LaVerdi',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
          &larr; Back to home
        </Link>

        <h1 className="text-4xl font-bold text-white mt-6 mb-2">Terms of Service</h1>
        <p className="text-zinc-500 text-sm mb-12">Last updated: July 9, 2026</p>

        <div className="space-y-10">
          <section>
            <p className="text-zinc-300 leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of LaVerdi, a managed hosting
              platform for personal AI agents (the &quot;Service&quot;), operated by LaVerdi (&quot;we,&quot; &quot;us,&quot;
              or &quot;our&quot;). By creating an account or using the Service, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              By accessing or using the Service, you confirm that you are at least 18 years old (or the age of
              majority in your jurisdiction) and have the legal capacity to enter into these Terms. If you are using
              the Service on behalf of an organization, you represent that you have authority to bind that
              organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Account Responsibilities</h2>
            <ul className="space-y-3 text-zinc-300 leading-relaxed list-disc list-inside">
              <li>You must provide a valid email address to create an account and sign in via magic link</li>
              <li>You are responsible for maintaining the security of your account and any credentials you connect to it, including messaging platform bot tokens</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must notify us promptly of any unauthorized use of your account</li>
              <li>One account may not be shared across multiple unrelated individuals or entities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Payment Terms</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                The Service is offered on a subscription basis across Starter, Pro, and Enterprise tiers, each with
                different pricing and agent instance limits. Payments are processed securely through Stripe.
              </p>
              <ul className="space-y-3 list-disc list-inside">
                <li>Subscriptions renew automatically each billing period unless cancelled</li>
                <li>Fees are billed in advance and are non-refundable except as required by law or as otherwise stated in our refund policy</li>
                <li>We may change pricing with reasonable advance notice; continued use after a price change constitutes acceptance</li>
                <li>Failure to pay may result in suspension or termination of your agent instance(s)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Acceptable Use</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>You agree to use the Service only for lawful purposes. You may not use the Service to:</p>
              <ul className="space-y-3 list-disc list-inside">
                <li>Violate any applicable law or regulation</li>
                <li>Generate or distribute spam, malware, or harassing content</li>
                <li>Attempt to gain unauthorized access to other customers&apos; agent instances or data</li>
                <li>Interfere with or disrupt the integrity or performance of the Service or provisioning infrastructure</li>
                <li>Exceed the agent instance or usage limits associated with your subscription tier</li>
              </ul>
              <p>
                Each subscription tier includes a defined number of agent instances (Starter: 1, Pro: 5, Enterprise:
                20) and an associated inference model. We reserve the right to throttle or suspend instances that
                abuse shared infrastructure.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express
                or implied. AI-generated responses may be inaccurate, incomplete, or inappropriate for your use
                case, and you are responsible for evaluating output before relying on it.
              </p>
              <p>
                To the maximum extent permitted by law, LaVerdi shall not be liable for any indirect, incidental,
                special, or consequential damages arising from your use of the Service, including damages resulting
                from third-party messaging platform outages or AI model behavior.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                You may cancel your subscription at any time from the dashboard. Upon cancellation, your agent
                instance(s) will be deprovisioned at the end of the current billing period.
              </p>
              <p>
                We may suspend or terminate your access to the Service, with or without notice, if you violate these
                Terms, fail to pay applicable fees, or engage in conduct that we determine, in our sole discretion,
                to be harmful to the Service or other customers.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <p className="text-zinc-300 leading-relaxed">
              Questions about these Terms can be sent to{' '}
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
