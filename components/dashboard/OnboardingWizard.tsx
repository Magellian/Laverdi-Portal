'use client'

import { useState } from 'react'

interface Step {
  icon: string
  title: string
  description: string
  cta: string
  href: string
}

const STEPS: Step[] = [
  {
    icon: '🤖',
    title: 'Deploy Your Agent',
    description:
      'An agent is your own private AI assistant, hosted and running 24/7. Deploy your first one and it will be ready in about a minute.',
    cta: 'Deploy Agent',
    href: '/dashboard/agents',
  },
  {
    icon: '🔌',
    title: 'Connect a Platform',
    description:
      "Link your agent to Telegram so you can chat with it from anywhere. Grab a bot token from BotFather and paste it into the Channels page.",
    cta: 'Connect Telegram',
    href: '/dashboard/channels',
  },
  {
    icon: '💬',
    title: 'Start Chatting',
    description:
      "You're all set. Open your agent and start chatting — it's available 24/7 on any platform you've connected.",
    cta: 'Open Agent',
    href: '/dashboard/agents',
  },
]

export default function OnboardingWizard({ agentCount }: { agentCount: number }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  if (agentCount !== 0) return null

  const goTo = (index: number) => {
    if (index === step) return
    setVisible(false)
    setTimeout(() => {
      setStep(index)
      setVisible(true)
    }, 150)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Getting Started</h2>
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                i === step
                  ? 'bg-white border-white'
                  : i < step
                  ? 'bg-zinc-400 border-zinc-400'
                  : 'bg-transparent border-zinc-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div
        className={`transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex gap-4">
          <span className="flex-shrink-0 text-4xl">{current.icon}</span>
          <div className="flex-1">
            <p className="text-xs text-zinc-500 mb-1">
              Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="text-base font-semibold text-white mb-1">{current.title}</h3>
            <p className="text-sm text-zinc-400 mb-4">{current.description}</p>
            <div className="flex items-center gap-3">
              <a
                href={current.href}
                className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
              >
                {current.cta}
              </a>
              {!isLast && (
                <button
                  onClick={() => goTo(step + 1)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
