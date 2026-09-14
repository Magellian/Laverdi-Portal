import Link from 'next/link'

const SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'connecting-telegram', label: 'Connecting Telegram' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'model-information', label: 'Model Information' },
  { id: 'faq', label: 'FAQ' },
]

const TIER_MODELS = [
  { tier: 'Starter', price: '$19/mo', model: 'DeepSeek-V4-Flash', maxAgents: 1 },
  { tier: 'Pro', price: '$49/mo', model: 'Kimi-K2.6', maxAgents: 5 },
  { tier: 'Enterprise', price: '$199/mo', model: 'GLM-5.1-FP8', maxAgents: 20 },
]

export default function DocsPage() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Documentation</h1>
        <p className="mt-1 text-zinc-400">
          Everything you need to deploy, connect, and run your Hermes agent.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Table of contents */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="lg:sticky lg:top-8 rounded-xl bg-zinc-800 border border-zinc-700 p-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
              On this page
            </p>
            <ul className="space-y-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Getting Started */}
          <section id="getting-started" className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 scroll-mt-8">
            <h2 className="text-lg font-semibold text-white mb-3">Getting Started</h2>
            <p className="text-sm text-zinc-400 mb-4">
              An agent is your own private Hermes AI instance, hosted and running 24/7 under
              your account. Deploying one takes about a minute.
            </p>
            <ol className="space-y-3 mb-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">1</span>
                <p className="text-sm text-zinc-300">
                  Go to <span className="text-white font-medium">Agents</span> in the sidebar.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">2</span>
                <p className="text-sm text-zinc-300">
                  Click <span className="text-white font-medium">Deploy New Agent</span>, optionally give it a name, and confirm.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">3</span>
                <p className="text-sm text-zinc-300">
                  Wait for the status to change from <span className="text-yellow-400">provisioning</span> to{' '}
                  <span className="text-green-400">running</span>.
                </p>
              </li>
            </ol>
            <p className="text-sm text-zinc-500">
              Each plan tier has a limit on how many agents you can run at once — see{' '}
              <a href="#model-information" className="text-white hover:underline">Model Information</a> below.
            </p>
            <Link
              href="/dashboard/agents"
              className="inline-block mt-4 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Go to Agents →
            </Link>
          </section>

          {/* Connecting Telegram */}
          <section id="connecting-telegram" className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 scroll-mt-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">✈️</span>
              <h2 className="text-lg font-semibold text-white">Connecting Telegram</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Connect your agent to Telegram so you can chat with it from anywhere. You'll need a bot
              token from Telegram's BotFather.
            </p>

            <div className="space-y-5">
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">1</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Get Telegram</p>
                    <p className="text-xs text-zinc-500 mt-1">Download Telegram if you don't have it (iOS, Android, or Desktop).</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">2</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Open BotFather</p>
                    <p className="text-xs text-zinc-500 mt-1">BotFather is Telegram's official bot for creating bots.</p>
                  </div>
                </div>
                <div className="ml-9">
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
                  >
                    Open @BotFather →
                  </a>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">3</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Create your bot</p>
                    <p className="text-xs text-zinc-500 mt-1">Send these messages to BotFather:</p>
                    <div className="mt-2 space-y-2">
                      <div className="rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5">
                        <code className="text-xs text-green-400">/newbot</code>
                        <span className="text-xs text-zinc-500 ml-2">← send this first</span>
                      </div>
                      <div className="rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5">
                        <code className="text-xs text-green-400">My AI Agent</code>
                        <span className="text-xs text-zinc-500 ml-2">← pick any name</span>
                      </div>
                      <div className="rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5">
                        <code className="text-xs text-green-400">myagent_laverdi_bot</code>
                        <span className="text-xs text-zinc-500 ml-2">← must end in "bot"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">4</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Copy the token</p>
                    <p className="text-xs text-zinc-500 mt-1">BotFather will reply with a token that looks like:</p>
                    <div className="mt-2 rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5 inline-block">
                      <code className="text-xs text-yellow-400">123456789:ABCdefGHIjklmnop-QRSTuvwxyz</code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-black text-sm flex items-center justify-center font-bold">5</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Paste it into Channels</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Head to the Channels page, select your agent, paste the token, and click Connect.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/channels"
              className="inline-block mt-5 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Go to Channels →
            </Link>
          </section>

          {/* API Keys */}
          <section id="api-keys" className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 scroll-mt-8">
            <h2 className="text-lg font-semibold text-white mb-3">API Keys</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Every agent you deploy gets its own unique API key, generated automatically during
              provisioning. It's used to authenticate requests made directly to your agent.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex gap-2 text-sm text-zinc-300">
                <span className="text-zinc-500">•</span>
                Your API key is emailed to you as soon as your agent finishes provisioning.
              </li>
              <li className="flex gap-2 text-sm text-zinc-300">
                <span className="text-zinc-500">•</span>
                Treat it like a password — anyone with your API key can talk to your agent directly.
              </li>
              <li className="flex gap-2 text-sm text-zinc-300">
                <span className="text-zinc-500">•</span>
                If you believe your key has been exposed, delete the agent from the Agents page and deploy a new one to get a fresh key.
              </li>
            </ul>
          </section>

          {/* Model Information */}
          <section id="model-information" className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 scroll-mt-8">
            <h2 className="text-lg font-semibold text-white mb-3">Model Information</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Each plan tier maps to a specific model and agent limit. Your agents are automatically
              configured with the model for your current plan.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 text-left text-zinc-500">
                    <th className="pb-2 pr-4 font-medium">Tier</th>
                    <th className="pb-2 pr-4 font-medium">Price</th>
                    <th className="pb-2 pr-4 font-medium">Model</th>
                    <th className="pb-2 font-medium">Max Agents</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER_MODELS.map((row) => (
                    <tr key={row.tier} className="border-b border-zinc-800 last:border-0">
                      <td className="py-2.5 pr-4 text-white font-medium">{row.tier}</td>
                      <td className="py-2.5 pr-4 text-zinc-300">{row.price}</td>
                      <td className="py-2.5 pr-4">
                        <code className="text-xs text-zinc-300 bg-zinc-900 border border-zinc-700 rounded px-2 py-1">
                          {row.model}
                        </code>
                      </td>
                      <td className="py-2.5 text-zinc-300">{row.maxAgents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-zinc-500 mt-4">
              Need a different model or more agents?{' '}
              <Link href="/dashboard/plan" className="text-white hover:underline">
                Upgrade your plan
              </Link>
              .
            </p>
          </section>

          {/* FAQ */}
          <section id="faq" className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 scroll-mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">FAQ</h2>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-zinc-200 mb-1">How long does it take to deploy an agent?</p>
                <p className="text-sm text-zinc-400">Usually under a minute. You'll see its status move from provisioning to running.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200 mb-1">Can I connect the same agent to multiple platforms?</p>
                <p className="text-sm text-zinc-400">Telegram is available today. Discord and Slack are coming soon and will work alongside Telegram on the same agent.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200 mb-1">What happens if I delete an agent?</p>
                <p className="text-sm text-zinc-400">The agent is shut down and permanently removed, including its connected channels and API key. This can't be undone.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200 mb-1">What if I hit my plan's agent limit?</p>
                <p className="text-sm text-zinc-400">Deploying a new agent will be blocked until you delete an existing one or upgrade your plan on the Your Plan page.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200 mb-1">Can I bring my own Telegram bot?</p>
                <p className="text-sm text-zinc-400">Yes — each customer brings their own bot token created via BotFather, so your bot's name and identity are entirely yours.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
