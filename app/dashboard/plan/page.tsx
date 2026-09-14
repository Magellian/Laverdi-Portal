import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTierLimits } from '@/lib/stripe'
import Link from 'next/link'
import ManageSubscriptionButton from '@/components/dashboard/ManageSubscriptionButton'

const ALL_FEATURES = [
  { label: '1 Agent Instance', tiers: ['starter', 'pro', 'enterprise'] },
  { label: '5 Agent Instances', tiers: ['pro', 'enterprise'] },
  { label: '20 Agent Instances', tiers: ['enterprise'] },
  { label: '1 Communication Channel', tiers: ['starter', 'pro', 'enterprise'] },
  { label: '3 Connected Platforms', tiers: ['pro', 'enterprise'] },
  { label: 'Unlimited Platforms', tiers: ['enterprise'] },
  { label: 'Community Support', tiers: ['starter', 'pro', 'enterprise'] },
  { label: 'Priority Support', tiers: ['pro', 'enterprise'] },
  { label: 'Dedicated Support', tiers: ['enterprise'] },
  { label: 'Basic Analytics', tiers: ['starter', 'pro', 'enterprise'] },
  { label: 'Advanced Analytics', tiers: ['pro', 'enterprise'] },
  { label: 'API Access', tiers: ['pro', 'enterprise'] },
  { label: 'Custom Integrations', tiers: ['enterprise'] },
  { label: 'SLA Guarantee', tiers: ['enterprise'] },
]

export default async function PlanPage() {
  const session = await auth()
  const userId = session?.user?.id

  const subscription = userId
    ? await prisma.subscription.findFirst({
        where: { userId, status: { in: ['active', 'trialing', 'past_due'] } },
        orderBy: { createdAt: 'desc' },
      })
    : null

  const agentCount = userId
    ? await prisma.instance.count({
        where: { ownerId: userId, status: { in: ['provisioning', 'running'] } },
      })
    : 0

  const tier = subscription?.tier || null
  const limits = tier ? getTierLimits(tier) : null
  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const features = ALL_FEATURES.map((f) => ({
    ...f,
    included: tier ? f.tiers.includes(tier) : false,
  }))

  // Determine upgrade target
  const upgradeTier = tier === 'starter' ? 'pro' : tier === 'pro' ? 'enterprise' : null
  const upgradeInfo = upgradeTier ? getTierLimits(upgradeTier) : null

  if (!subscription) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Your Plan</h1>
          <p className="mt-1 text-zinc-400">Manage your subscription and usage</p>
        </div>

        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-8 text-center">
          <span className="text-5xl mb-4 block">💳</span>
          <h2 className="text-xl font-semibold text-white mb-2">No active subscription</h2>
          <p className="text-zinc-400 mb-6">Subscribe to deploy AI agents and connect your platforms.</p>
          <Link
            href="/pricing"
            className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Your Plan</h1>
        <p className="mt-1 text-zinc-400">Manage your subscription and usage</p>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-zinc-400 mb-1">Current Plan</p>
            <h2 className="text-xl font-bold text-white">{limits?.name || 'Unknown'}</h2>
            <p className="text-zinc-300 mt-1">
              <span className="text-2xl font-bold text-white">${limits?.price || 0}</span>
              <span className="text-zinc-400"> / month</span>
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium border ${
              subscription.status === 'active'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : subscription.status === 'past_due'
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
            }`}
          >
            {subscription.status === 'active'
              ? subscription.cancelAtPeriodEnd
                ? 'Canceling'
                : 'Active'
              : subscription.status}
          </span>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
            <p className="text-sm text-yellow-400">
              Your subscription will end on {renewalDate}. You can reactivate anytime before then.
            </p>
          </div>
        )}

        <p className="text-sm text-zinc-400 mb-4">
          {subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
          <span className="text-zinc-300">{renewalDate || '—'}</span>
        </p>

        {/* Usage Bar */}
        {limits && limits.maxAgents > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Agent Instances</span>
              <span className="text-zinc-300">
                {agentCount} of {limits.maxAgents} used
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-700">
              <div
                className="h-2 rounded-full bg-white transition-all"
                style={{
                  width: `${Math.min((agentCount / limits.maxAgents) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <ManageSubscriptionButton />
      </div>

      {/* Plan Features */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
        <h3 className="text-base font-semibold text-white mb-4">Plan Features</h3>
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature.label} className="flex items-center gap-3">
              {feature.included ? (
                <svg className="h-4 w-4 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 flex-shrink-0 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              <span className={feature.included ? 'text-sm text-zinc-300' : 'text-sm text-zinc-600'}>
                {feature.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade CTA */}
      {upgradeTier && upgradeInfo && (
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-white">Upgrade to {upgradeInfo.name}</h3>
            <span className="text-lg font-bold text-white">
              ${upgradeInfo.price}
              <span className="text-sm font-normal text-zinc-400">/mo</span>
            </span>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Unlock more agents, channels, and priority support.
          </p>
          <Link
            href="/pricing"
            className="inline-block rounded-lg bg-white hover:bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-black transition-colors"
          >
            Upgrade to {upgradeInfo.name}
          </Link>
        </div>
      )}
    </div>
  )
}
