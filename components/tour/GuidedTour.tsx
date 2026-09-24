'use client'

import { useEffect, useRef, useState } from 'react'

export interface TourStep {
  target: string
  title: string
  body: string
  onEnter?: () => void
}

interface GuidedTourProps {
  tourId: string
  steps: TourStep[]
  replaySignal?: number
}

const STORAGE_PREFIX = 'laverdi_tour_done_'

export function isTourDone(tourId: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + tourId) === '1'
  } catch {
    return false
  }
}

export default function GuidedTour({ tourId, steps, replaySignal }: GuidedTourProps) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [bubbleStyle, setBubbleStyle] = useState<{ top: number; left: number; placement: 'above' | 'below' }>({
    top: 0,
    left: 0,
    placement: 'below',
  })
  const initialMount = useRef(true)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_PREFIX + tourId) !== '1') {
        setStepIndex(0)
        setActive(true)
      }
    } catch {
      setStepIndex(0)
      setActive(true)
    }
  }, [])

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }
    setStepIndex(0)
    setActive(true)
  }, [replaySignal])

  const measure = () => {
    const step = steps[stepIndex]
    if (!step) return
    const el = document.getElementById(step.target)
    if (!el) {
      setRect(null)
      return
    }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })

    const bubbleWidth = 320
    const margin = 14
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    let left = r.left
    if (left + bubbleWidth + 16 > viewportW) left = Math.max(16, viewportW - bubbleWidth - 16)
    if (left < 16) left = 16

    const spaceBelow = viewportH - r.bottom
    const placement: 'above' | 'below' = spaceBelow < 220 && r.top > 220 ? 'above' : 'below'
    const top = placement === 'below' ? r.bottom + margin : Math.max(16, r.top - margin)

    setBubbleStyle({ top, left, placement })
  }

  useEffect(() => {
    if (!active) return
    const step = steps[stepIndex]
    step?.onEnter?.()

    const el = document.getElementById(step?.target || '')
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })

    const t = setTimeout(measure, 220)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [active, stepIndex])

  const finish = () => {
    setActive(false)
    try {
      localStorage.setItem(STORAGE_PREFIX + tourId, '1')
    } catch {}
  }

  const next = () => {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1)
    else finish()
  }
  const prev = () => setStepIndex((i) => Math.max(0, i - 1))

  if (!active || steps.length === 0) return null
  const step = steps[stepIndex]

  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          pointerEvents: 'none',
          transition: 'box-shadow 0.25s ease',
          ...(rect
            ? {
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                borderRadius: 10,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                border: '2px solid var(--accent, #eab308)',
              }
            : {
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
              }),
        }}
      />

      <div
        role="dialog"
        aria-label={`Tutorial step ${stepIndex + 1} of ${steps.length}`}
        style={{
          position: 'fixed',
          top: bubbleStyle.top,
          left: bubbleStyle.left,
          width: 320,
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
        className="rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
            Step {stepIndex + 1} of {steps.length}
          </span>
          <button
            onClick={finish}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Skip
          </button>
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">{step.body}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={stepIndex === 0}
            className="text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
          >
            {'←'} Back
          </button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === stepIndex ? 'bg-amber-400' : 'bg-zinc-700'}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="rounded-lg bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 transition-colors"
          >
            {stepIndex < steps.length - 1 ? 'Next' : 'Done'}
          </button>
        </div>
      </div>
    </>
  )
}
