'use client'

import { useState } from 'react'
import CreateAgentStep from './CreateAgentStep'
import ConnectChannelStep from './ConnectChannelStep'
import CompanionStep from './CompanionStep'

interface Agent {
  id: string
  name: string | null
  status: string
}

const STEP_LABELS = ['Create Agent', 'Connect Channel', 'Companion App']

export default function AgentSetupWizard({
  tier,
  maxAgents,
  agentCount,
  initialAgentId,
  initialStep = 0,
  onFinished,
}: {
  tier: string
  maxAgents: number
  agentCount: number
  initialAgentId?: string
  initialStep?: number
  onFinished: () => void
}) {
  const [step, setStep] = useState(initialStep)
  const [agentId, setAgentId] = useState<string | undefined>(initialAgentId)

  const goTo = (i: number) => {
    if (i === 1 || i === 2) {
      if (!agentId) return // can't jump ahead without an agent yet
    }
    setStep(i)
  }

  const handleCreated = (agent: Agent) => {
    setAgentId(agent.id)
    setStep(1)
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold text-white">Getting Started</h2>
        <button onClick={onFinished} className="text-xs text-zinc-500 hover:text-zinc-300">
          Skip wizard →
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => goTo(i)}
              disabled={i > 0 && !agentId}
              className="flex items-center gap-2 group"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i === step
                    ? 'bg-white text-black'
                    : i < step || (i > 0 && agentId)
                    ? 'bg-zinc-700 text-zinc-200 group-hover:bg-zinc-600'
                    : 'bg-zinc-800 text-zinc-600'
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  i === step ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div className="flex-1 h-px bg-zinc-800 mx-3" />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <CreateAgentStep
          tier={tier}
          maxAgents={maxAgents}
          agentCount={agentCount}
          onCreated={handleCreated}
        />
      )}

      {step === 1 && agentId && (
        <>
          <ConnectChannelStep agentId={agentId} compact />
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(0)} className="text-sm text-zinc-400 hover:text-white transition-colors">
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Next: Companion App →
            </button>
          </div>
        </>
      )}

      {step === 2 && agentId && (
        <>
          <CompanionStep agentId={agentId} compact />
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(1)} className="text-sm text-zinc-400 hover:text-white transition-colors">
              ← Back
            </button>
            <button
              onClick={onFinished}
              className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Finish →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
