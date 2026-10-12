'use client'

import { useEffect, useState, useCallback } from 'react'

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

export default function CompanionStep({
  agentId,
  compact = false,
}: {
  agentId: string
  compact?: boolean
}) {
  const [status, setStatus] = useState<CompanionStatus | null>(null)
  const [pairing, setPairing] = useState<PairingInfo | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [revealToken, setRevealToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [jobActionId, setJobActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(!compact)

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    setError(null)
    try {
      const [statusRes, pairRes] = await Promise.all([
        fetch(`/api/agents/${id}/companion/status`),
        fetch(`/api/agents/${id}/companion/pair`),
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
    setRevealToken(false)
    loadDetail(agentId)
  }, [agentId, loadDetail])

  const rotateToken = async () => {
    setRotating(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${agentId}/companion/pair`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to rotate pairing token')
      setPairing(data)
      setRevealToken(true)
      loadDetail(agentId)
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
    setSavingPolicy(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${agentId}/companion/status`, {
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
    setJobActionId(jobId)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${agentId}/companion/jobs/${jobId}/${action}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to ${action} job`)
      loadDetail(agentId)
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action} job`)
    } finally {
      setJobActionId(null)
    }
  }

  const maskedToken = pairing?.pairingToken
    ? `${pairing.pairingToken.slice(0, 6)}${'•'.repeat(20)}`
    : '—'

  const pairCommand = pairing?.pairingToken
    ? `LaVerdiCompanion.exe pair --instance ${agentId} --token ${pairing.pairingToken} --base-url https://laverdi.tech`
    : null
  const startCommand = pairCommand ? 'LaVerdiCompanion.exe start' : null

  const agentPrompt = pairing?.pairingToken
    ? `I've paired the LaVerdi Companion app with your instance. You can now run commands on my local machine by calling:

  delegate --command "the command here"

For example:
  delegate --command "nvidia-smi"
  delegate --command "pip install pandas"
  delegate --command "cat /etc/os-release"

This creates a job that my companion picks up, runs on my machine, and returns the output. It blocks until the job completes (up to 90 seconds).

When to use this:
- Installing packages (pip install, npm install -g, apt-get install)
- Running commands that need my GPU, local files, or Windows tools
- Anything your Docker sandbox can't do

When NOT to use:
- Web searches, API calls, sandbox file ops — you can do those yourself
- Commands that could damage my system — flag those and I'll review`
    : null

  if (loadingDetail && !status) {
    return <p className="text-sm text-zinc-400">Loading companion info…</p>
  }

  return (
    <div>
      {compact && (
        <div className="flex gap-4 mb-6">
          <span className="flex-shrink-0 text-4xl">⬇️</span>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Get the companion app</h2>
            <p className="text-sm text-zinc-400">
              A small app for your own computer so your agent can delegate work it can&apos;t do
              in its sandbox — installing packages, running local commands. Optional, but handy.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
        The companion app is an early build — Windows only for now, macOS/Linux aren&apos;t built yet.
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-red-500 hover:text-red-300 mt-1">Dismiss</button>
        </div>
      )}

      {status?.delegationKillSwitchActive && (
        <div className="rounded-xl bg-amber-900/30 border border-amber-700 p-4 mb-6">
          <p className="text-amber-400 text-sm font-medium">Delegation is temporarily paused</p>
          <p className="text-amber-400/80 text-xs mt-1">
            We've paused delegated jobs platform-wide while we look into something. Your pairing
            and policy settings are unaffected and everything will resume automatically.
          </p>
        </div>
      )}

      {/* Pairing card */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {compact ? 'Download & Pair' : 'Pairing'}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {status?.companionLastSeen
                ? `Last heartbeat: ${new Date(status.companionLastSeen).toLocaleString()}`
                : 'No heartbeat received yet.'}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[status?.companionStatus || 'unpaired']}`}>
            {status?.companionStatus || 'unpaired'}
          </span>
        </div>

        <div className="mb-4">
          <a
            id="tour-wizard-companion-download"
            href={`/api/agents/${agentId}/companion/download`}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-zinc-100 transition-colors"
          >
            Download &amp; pair installer
          </a>
          <p className="text-xs text-zinc-500 mt-2">
            One click: this installer is already paired to this agent. Run it and it pairs
            itself, then runs in the background automatically every login. A single Windows
            permission prompt during install is expected and normal.
          </p>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-zinc-500 hover:text-zinc-300 mb-3"
        >
          {showAdvanced ? '▼' : '▶'} Advanced: pairing token &amp; manual pairing
        </button>

        {showAdvanced && (pairCommand || startCommand || pairing?.pairingToken) && (
          <div>
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1.5">Pairing Token</label>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300 font-mono break-all">
                  {pairing?.pairingToken ? (revealToken ? pairing.pairingToken : maskedToken) : '—'}
                </code>
                {pairing?.pairingToken && (
                  <>
                    <button onClick={() => setRevealToken((v) => !v)} className="rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
                      {revealToken ? 'Hide' : 'Reveal'}
                    </button>
                    <button onClick={copyToken} className="rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={rotateToken}
                disabled={rotating}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors disabled:opacity-50"
              >
                {rotating ? 'Rotating…' : pairing?.pairingToken ? 'Rotate Token' : 'Generate Token'}
              </button>
              <p className="text-xs text-zinc-500 mt-1.5">
                Rotating invalidates any currently paired app using the old token — only needed if
                you suspect it leaked or want to re-pair a different machine.
              </p>
            </div>

            {pairCommand && (
              <div className="mb-4">
                <label className="block text-xs text-zinc-500 mb-1.5">
                  1. After installing the generic installer, choose &quot;Pair LaVerdi
                  Companion&quot; from the Start Menu and run:
                </label>
                <code className="block rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-xs text-zinc-300 font-mono break-all">
                  {pairCommand}
                </code>
              </div>
            )}

            {startCommand && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  2. Then run this too, and leave the window open — this is what actually listens
                  for delegated jobs (pairing alone doesn&apos;t start it):
                </label>
                <code className="block rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-xs text-zinc-300 font-mono break-all">
                  {startCommand}
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      {agentPrompt && (
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Share with your agent</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Paste this into a chat with your agent so it knows how to use the companion.
              </p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(agentPrompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {}) }}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-400 hover:text-white transition-colors shrink-0"
            >
              {copied ? 'Copied!' : 'Copy prompt'}
            </button>
          </div>
          <pre className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-words overflow-x-auto max-h-80 overflow-y-auto">
{agentPrompt}
          </pre>
        </div>
      )}

      {showAdvanced && status && (
        <>
          <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Delegation Policy</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Controls what happens when your sandboxed agent hits something it can&apos;t do
              itself and wants to hand it to your companion app.
            </p>
            <div className="space-y-2">
              {POLICY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    status.delegationPolicy === opt.value ? 'border-white bg-zinc-900' : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <input
                    type="radio"
                    name={`delegationPolicy-${agentId}`}
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
                            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wide">{job.kind.replace('_', ' ')}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${JOB_STATUS_COLORS[job.status] || JOB_STATUS_COLORS.pending}`}>{job.status}</span>
                            <span className="text-[11px] text-zinc-500">{new Date(job.requestedAt).toLocaleString()}</span>
                          </div>
                          {payloadSummary && <code className="block text-xs text-zinc-400 font-mono break-all mb-1">{payloadSummary}</code>}
                          {job.resultSummary && <p className="text-xs text-zinc-500 break-all">{job.resultSummary}</p>}
                        </div>
                        {job.status === 'pending' && (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => actOnJob(job.id, 'approve')} disabled={jobActionId === job.id} className="rounded-lg bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50">Approve</button>
                            <button onClick={() => actOnJob(job.id, 'deny')} disabled={jobActionId === job.id} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 transition-colors disabled:opacity-50">Deny</button>
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
