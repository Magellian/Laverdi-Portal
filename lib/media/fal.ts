/**
 * Thin client for fal.ai's synchronous REST endpoints (fal.run/<model>).
 * See the Vendor options section of the media add-on scoping doc for why
 * fal.ai: pay-per-call, no monthly minimum, wraps Flux (image) and
 * MiniMax/Kling (video) behind one API and one key.
 *
 * Requires FAL_API_KEY in the environment. Until it's set, both calls
 * below throw FalNotConfiguredError so the rest of the render_job flow
 * (credit hold, job bookkeeping) can be built and tested without a real
 * key, and the agent gets a clear "not available yet" message instead of
 * a confusing failure.
 */

export class FalNotConfiguredError extends Error {
  constructor() {
    super('Media generation is not configured yet (FAL_API_KEY is unset).')
    this.name = 'FalNotConfiguredError'
  }
}

export class FalRequestError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'FalRequestError'
  }
}

function getApiKey(): string {
  const key = process.env.FAL_API_KEY
  if (!key) throw new FalNotConfiguredError()
  return key
}

// Keep these as the one place a model choice lives -- see Rollout phases:
// Phase 1 ships with exactly one model per media kind, swappable later
// without touching the request-handling code.
export const IMAGE_MODEL = process.env.FAL_IMAGE_MODEL || 'fal-ai/flux/schnell'
export const VIDEO_MODEL = process.env.FAL_VIDEO_MODEL || 'fal-ai/minimax/hailuo-02-fast/text-to-video'

async function falRun(model: string, input: Record<string, unknown>, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    })

    const body = await res.json().catch(() => null)

    if (!res.ok) {
      const detail = body?.detail || body?.error || res.statusText
      throw new FalRequestError(`fal.ai request failed (${res.status}): ${JSON.stringify(detail)}`, res.status)
    }

    return body
  } catch (err) {
    if (err instanceof FalNotConfiguredError || err instanceof FalRequestError) throw err
    const reason = err instanceof Error && err.name === 'AbortError' ? 'timed out' : String(err)
    throw new FalRequestError(`fal.ai request error: ${reason}`)
  } finally {
    clearTimeout(timer)
  }
}

export interface GeneratedImage {
  url: string
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const result = await falRun(IMAGE_MODEL, { prompt }, 30_000)
  const url = result?.images?.[0]?.url
  if (!url) throw new FalRequestError(`fal.ai returned no image url: ${JSON.stringify(result)}`)
  return { url }
}

export interface GeneratedVideo {
  url: string
  /** fal.ai doesn't hand back an expiry itself; we apply our own conservative window. */
  expiresAt: Date
}

const VIDEO_RESULT_TTL_HOURS = 24

export async function generateVideo(prompt: string, durationSeconds: number): Promise<GeneratedVideo> {
  const result = await falRun(
    VIDEO_MODEL,
    { prompt, duration: String(Math.max(1, Math.min(10, Math.round(durationSeconds)))) },
    120_000
  )
  const url = result?.video?.url
  if (!url) throw new FalRequestError(`fal.ai returned no video url: ${JSON.stringify(result)}`)
  return { url, expiresAt: new Date(Date.now() + VIDEO_RESULT_TTL_HOURS * 60 * 60 * 1000) }
}
