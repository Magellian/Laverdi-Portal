'use client'

import { useEffect, useState, useCallback } from 'react'

interface Agent {
  id: string
  name: string | null
  status: string
}

interface DelegatedJob {
  id: string
  kind: string
  status: string
  payload: string | null
  resultSummary: string | null
  requestedAt: string
}

interface CompanionStatus {
  id: string
  companionStatus: string
  companionLastSeen: string | null
  delegationPolicy: string
  delegatedJobs: DelegatedJob[]
  delegationKillSwitchActive?: boolean
}

interface PairingInfo {
  instanceId: string
  pairingToken: string | null
  heartbeatUrl: string
}

const STATUS_COLORS: Record<string, string> = {
  paired: 'bg-green-500/10 border-green-500/20 text-green-400',
  unpaired: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
  offline: 'bg-red-500/10 border-red-500/20 text-red-400',
}

const JOB_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  approved: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  completed: 'bg-green-500/10 border-green-500/20 text-green-400',
  failed: 'bg-red-500/10 border-red-500/20 text-red-400',
  denied: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
}

const POLICY_OPTIONS = [
  { value: 'ask', label: 'Ask first', desc: 'Every delegated job waits here for approval before your companion sees it.' },
  { value: 'auto_trusted', label: 'Auto (trusted)', desc: 'Jobs go straight to your paired companion — no review step.' },
  { value: 'auto_all', label: 'Auto (all)', desc: 'Same as trusted for now — reserved for future per-kind trust rules.' },
  { value: 'server_only', label: 'Server only', desc: 'Delegation disabled. Blocked actions just fail in the sandbox.' },
]

export default function CompanionPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  const [status, setStatus] = useState<CompanionStatus | null>(null)
  const [pairing, setPairing] = useState<PairingInfo | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [revealToken, setRevealToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [jobActionId, setJobActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => {
        const usable = (data.instances || []).filter((a: Agent) => a.status === 'running')
        setAgents(usable)
        if (usable.length === 1) setSelectedAgent(usable[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  const loadDetail = useCallback(async (agentId: string) => {
    setLoadingDetail(true)
    setError(null)
    try {
      const [statusRes, pairRes] = await Promise.all([
        fetch(`/api/agents/${agentId}/companion/status`),
        fetch(`/api/agents/${agentId}/companion/pair`),
      ])
      const statusData = await statusRes.json()
      const pairData = await pairRes.json()
      if (!statusRes.ok) throw new Error(statusData.error || 'Failed to load companion status')
      if (!pairRes.ok) throw new Error(pairData.error || 'Failed to load pairing info')
      setStatus(statusData)
      setPairing(pairData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load companion info')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      setRevealToken(false)
      loadDetail(selectedAgent)
    } else {
      setStatus(null)
      setPairing(null)
    }
  }, [selectedAgent, loadDetail])

  const rotateToken = async () => {
    if (!selectedAgent) return
    setRotating(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${selectedAgent}/companion/pair`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to rotate pairing token')
      setPairing(data)
      setRevealToken(true)
      loadDetail(selectedAgent)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rotate pairing token')
    } finally {
      setRotating(false)
    }
  }

  const copyToken = async () => {
    if (!pairing?.pairingToken) return
    try {
      await navigator.clipboard.writeText(pairing.pairingToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  const changePolicy = async (policy: string) => {
    if (!selectedAgent) return
    setSavingPolicy(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${selectedAgent}/companion/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegationPolicy: policy }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update policy')
      setStatus(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update policy')
    } finally {
      setSavingPolicy(false)
    }
  }

  const actOnJob = async (jobId: string, action: 'approve' | 'deny') => {
    if (!selectedAgent) return
    setJobActionId(jobId)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${selectedAgent}/companion/jobs/${jobId}/${action}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to ${action} job`)
      loadDetail(selectedAgent)
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action} job`)
    } finally {
      setJobActionId(null)
    }
  }

  const maskedToken = pairing?.pairingToken
    ? `${pairing.pairingToken.slice(0, 6)}${'•'.repeat(20)}`
    : '—'

  const pairCommand = pairing?.pairingToken && selectedAgent
    ? `node index.js pair --instance ${selectedAgent} --token ${pairing.pairingToken} --base-url https://laverdi.tech`
    : null

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white">Companion App</h1>
        <p className="text-zinc-400 mt-2">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Companion App</h1>
        <p className="mt-1 text-zinc-400">
          Pair a local companion app to your agent so it can delegate work your sandboxed
          agent can&apos;t do on its own — installing packages, running heavier local commands.
        </p>
      </div>

      <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
        The companion app is an early, source-only Node.js CLI (Windows first) — there&apos;s no
        packaged installer yet. Pairing and delegated installs work end-to-end; a system-tray
        app and other platforms are still to come.
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-red-500 hover:text-red-300 mt-1">
            Dismiss
          </button>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 text-center mb-6">
          <p className="text-sm text-zinc-400">
            You need a running agent first.{' '}
            <a href="/dashboard/agents" className="text-white hover:underline">
              Deploy one →
            </a>
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-xs text-zinc-500 mb-1.5">Agent</label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-white focus:border-white focus:outline-none"
          >
            <option value="">Select an agent…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || `Agent ${a.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedAgent && loadingDetail && !status && (
        <p className="text-zinc-400 text-sm">Loading companion info…</p>
      )}

      {selectedAgent && status && (
        <>
          {status.delegationKillSwitchActive && (
            <div className="rounded-xl bg-amber-900/30 border border-amber-700 p-4 mb-6">
              <p className="text-amber-400 text-sm font-medium">Delegation is temporarily paused</p>
              <p className="text-amber-400/80 text-xs mt-1">
                We've paused delegated jobs platform-wide while we look into something. Your
                pairing and policy settings are unaffected and everything will resume
                automatically — no action needed on your end.
              </p>
            </div>
          )}

          {/* Pairing card */}
          <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Pairing</h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {status.companionLastSeen
                    ? `Last heartbeat: ${new Date(status.companionLastSeen).toLocaleString()}`
                    : 'No heartbeat received yet.'}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  STATUS_COLORS[status.companionStatus] || STATUS_COLORS.unpaired
                }`}
              >
                {status.companionStatus}
              </span>
            </div>

            <label className="block text-xs text-zinc-500 mb-1.5">Pairing Token</label>
            <div className="flex items-center gap-2 mb-3">
              <code className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300 font-mono break-all">
                {pairing?.pairingToken ? (revealToken ? pairing.pairingToken : maskedToken) : '—'}
              </code>
              {pairing?.pairingToken && (
                <>
                  <button
                    onClick={() => setRevealToken((v) => !v)}
                    className="rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {revealToken ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    onClick={copyToken}
                    className="rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={rotateToken}
              disabled={rotating}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors disabled:opacity-50 mb-4"
            >
              {rotating ? 'Rotating…' : pairing?.pairingToken ? 'Rotate Token' : 'Generate Token'}
            </button>

            {pairCommand && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  Run this from the companion-app folder on your machine
                </label>
                <code className="block rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-xs text-zinc-300 font-mono break-all">
                  {pairCommand}
                </code>
              </div>
            )}
          </div>

          {/* Delegation policy card */}
          <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Delegation Policy</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Controls what happens when your sandboxed agent hits something it can&apos;t do
              itself (like installing a package) and wants to hand it to your companion app.
            </p>
            <div className="space-y-2">
              {POLICY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    status.delegationPolicy === opt.value
                      ? 'border-white bg-zinc-900'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="delegationPolicy"
                    value={opt.value}
                    checked={status.delegationPolicy === opt.value}
                    onChange={() => changePolicy(opt.value)}
                    disabled={savingPolicy}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="text-xs text-zinc-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Audit trail */}
          <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Delegated Jobs</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Recent work your agent has asked the companion to run, most recent first.
            </p>

            {status.delegatedJobs.length === 0 ? (
              <p className="text-sm text-zinc-500">No delegated jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {status.delegatedJobs.map((job) => {
                  let payloadSummary = ''
                  try {
                    if (job.payload) {
                      const parsed = JSON.parse(job.payload)
                      payloadSummary = parsed.command || JSON.stringify(parsed)
                    }
                  } catch {
                    payloadSummary = job.payload || ''
                  }
                  return (
                    <div key={job.id} className="rounded-lg bg-zinc-900 border border-zinc-700 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wide">
                              {job.kind.replace('_', ' ')}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                                JOB_STATUS_COLORS[job.status] || JOB_STATUS_COLORS.pending
                              }`}
                            >
                              {job.status}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {new Date(job.requestedAt).toLocaleString()}
                            </span>
                          </div>
                          {payloadSummary && (
                            <code className="block text-xs text-zinc-400 font-mono break-all mb-1">
                              {payloadSummary}
                            </code>
                          )}
                          {job.resultSummary && (
                            <p className="text-xs text-zinc-500 break-all">{job.resultSummary}</p>
                          )}
                        </div>
                        {job.status === 'pending' && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => actOnJob(job.id, 'approve')}
                              disabled={jobActionId === job.id}
                              className="rounded-lg bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => actOnJob(job.id, 'deny')}
                              disabled={jobActionId === job.id}
                              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 transition-colors disabled:opacity-50"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
