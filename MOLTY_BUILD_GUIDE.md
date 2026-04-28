# Molty Integration Build Guide

**Goal:** Convert pulse engine + particle system to React components and integrate into dashboard landing

**Timeline:** ~3 hours  
**Status:** Ready to build (waiting for sub-pages to complete)

---

## Phase 1: Extract Three.js Code from Prototypes (30 min)

### Source Files
1. `prototype_pulse.html` — pulse engine (rotating tendrils)
2. `visual-engine-prototype.html` — particle system (2500 lobster-red particles)
3. `molty_storybook.html` — Molty character (torus knot with light)
4. `src/laverdi-portal/components/MoltyScene.tsx` — existing implementation (reference)

### Extract: PulseEngine.ts
```typescript
// lib/three/PulseEngine.ts
import * as THREE from 'three'

export class PulseEngineScene {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  pulses: Array<any>
  mesh: THREE.Mesh
  animationId: number

  constructor(canvas: HTMLCanvasElement) {
    // Initialize scene, camera, renderer
    // Create 8 rotating torus rings
    // Create central object (TorusKnot)
    // Setup lobster-red lighting
  }

  animate(time: number) {
    // Rotate mesh
    // Update pulses (rotation + opacity)
    // Render scene
  }

  dispose() {
    // Clean up geometries, materials, renderer
  }

  onWindowResize() {
    // Update camera aspect + renderer size
  }
}
```

### Extract: ParticleSystem.ts
```typescript
// lib/three/ParticleSystem.ts
import * as THREE from 'three'

export class ParticleSystemScene {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  points: THREE.Points
  positions: Float32Array
  velocities: Float32Array
  animationId: number
  isAnimating: boolean

  constructor(canvas: HTMLCanvasElement) {
    // Initialize scene with 2500 particles
    // Create sphere distribution
    // Setup lobster-red material
    // Setup additive blending
  }

  startEmergenceAnimation(duration: number = 3000) {
    // Animate particles rising from bottom
    // Coalesce toward center point
    // Calls onComplete callback when done
  }

  animate(time: number, deltaTime: number) {
    // Update particle positions
    // Apply gravity/physics
    // Update velocities
  }

  dispose() {
    // Clean up
  }
}
```

### Extract: MoltyCharacter.ts
```typescript
// lib/three/MoltyCharacter.ts
import * as THREE from 'three'

export class MoltyCharacter {
  mesh: THREE.Mesh
  light: THREE.PointLight
  rotationSpeed: number

  constructor(scene: THREE.Scene) {
    // Create torus knot geometry
    // Apply red emissive material
    // Add point light (lobster red)
    // Position at center
  }

  animate(deltaTime: number) {
    // Rotate mesh
    // Pulse light intensity
  }

  setGlowIntensity(intensity: number) {
    // Update emissive intensity based on animation state
  }
}
```

---

## Phase 2: Create React Components (45 min)

### Component: PulseEngine.tsx
```typescript
// components/PulseEngine.tsx
import { useEffect, useRef } from 'react'
import { PulseEngineScene } from '@/lib/three/PulseEngine'

export function PulseEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<PulseEngineScene | null>(null)
  const animationIdRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize scene
    sceneRef.current = new PulseEngineScene(canvasRef.current)

    // Animation loop
    const animate = (time: number) => {
      sceneRef.current?.animate(time)
      animationIdRef.current = requestAnimationFrame(animate)
    }
    animationIdRef.current = requestAnimationFrame(animate)

    // Handle resize
    const handleResize = () => sceneRef.current?.onWindowResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationIdRef.current!)
      sceneRef.current?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}
```

### Component: ParticleSystem.tsx
```typescript
// components/ParticleSystem.tsx
import { useEffect, useRef } from 'react'
import { ParticleSystemScene } from '@/lib/three/ParticleSystem'

interface ParticleSystemProps {
  isActive: boolean
  duration?: number
  onComplete?: () => void
}

export function ParticleSystem({ isActive, duration = 3000, onComplete }: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<ParticleSystemScene | null>(null)
  const animationIdRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current || !isActive) return

    sceneRef.current = new ParticleSystemScene(canvasRef.current)
    
    // Start emergence animation
    sceneRef.current.startEmergenceAnimation(duration)
    
    // Animation loop
    let lastTime = performance.now()
    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000
      lastTime = time
      
      sceneRef.current?.animate(time, deltaTime)
      animationIdRef.current = requestAnimationFrame(animate)
    }
    animationIdRef.current = requestAnimationFrame(animate)

    // Wait for animation to complete
    const timer = setTimeout(() => {
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(animationIdRef.current!)
      sceneRef.current?.dispose()
    }
  }, [isActive, duration, onComplete])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}
```

### Component: Molty.tsx
```typescript
// components/Molty.tsx
import { useEffect, useRef } from 'react'
import { MoltyCharacter } from '@/lib/three/MoltyCharacter'

interface MoltyProps {
  isEmerging?: boolean
  glowIntensity?: number
}

export function Molty({ isEmerging = false, glowIntensity = 0.5 }: MoltyProps) {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const moltyRef = useRef<MoltyCharacter | null>(null)

  useEffect(() => {
    if (!moltyRef.current) return

    moltyRef.current.setGlowIntensity(isEmerging ? 1 : glowIntensity)
  }, [isEmerging, glowIntensity])

  return <div className="relative w-full h-full" />
}
```

### Component: WelcomeLanding.tsx (Orchestrator)
```typescript
// components/WelcomeLanding.tsx
import { useState, useEffect } from 'react'
import { PulseEngine } from './PulseEngine'
import { ParticleSystem } from './ParticleSystem'
import { Molty } from './Molty'

interface WelcomeLandingProps {
  userName: string
  onComplete?: () => void
}

export function WelcomeLanding({ userName, onComplete }: WelcomeLandingProps) {
  const [stage, setStage] = useState<'pulse' | 'molty' | 'particles' | 'complete'>('pulse')
  const [showSkip, setShowSkip] = useState(true)

  // Sequence timing
  useEffect(() => {
    const timing = {
      pulse: 1000,        // Pulse background starts
      molty: 1500,        // Molty appears
      particles: 3000,    // Particles emerge
      complete: 6000,     // Fade to dashboard
    }

    const timeline = [
      setTimeout(() => setStage('molty'), timing.molty),
      setTimeout(() => setStage('particles'), timing.particles),
      setTimeout(() => {
        setStage('complete')
        setShowSkip(false)
        onComplete?.()
      }, timing.complete),
    ]

    return () => timeline.forEach(clearTimeout)
  }, [onComplete])

  const handleSkip = () => {
    setStage('complete')
    setShowSkip(false)
    onComplete?.()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Pulse background layer */}
      <div className="absolute inset-0 z-0">
        <PulseEngine />
      </div>

      {/* Particle system layer */}
      {stage !== 'pulse' && (
        <div className="absolute inset-0 z-10">
          <ParticleSystem isActive={stage === 'particles'} />
        </div>
      )}

      {/* Molty character */}
      {stage !== 'pulse' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <Molty isEmerging={stage === 'particles'} />
        </div>
      )}

      {/* Text overlay */}
      {stage !== 'complete' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-white pointer-events-none">
          <h1 className="text-6xl font-bold text-red-500 mb-4 animate-fade-in">
            Welcome, {userName}
          </h1>
          <p className="text-2xl text-gray-300 animate-fade-in-delayed">
            Let's bring your vision to life
          </p>
        </div>
      )}

      {/* Skip button */}
      {showSkip && (
        <button
          onClick={handleSkip}
          className="absolute bottom-8 right-8 z-40 px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Skip ↓
        </button>
      )}

      {/* Fade out overlay */}
      {stage === 'complete' && (
        <div className="absolute inset-0 z-40 bg-black animate-fade-out" />
      )}
    </div>
  )
}
```

---

## Phase 3: Integrate into Dashboard (30 min)

### Update: pages/dashboard/index.tsx
```typescript
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { WelcomeLanding } from '@/components/WelcomeLanding'
// ... other imports

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  // ... other state

  useEffect(() => {
    // Check if this is first-time load
    const hasSeenWelcome = localStorage.getItem('laverdi_seen_welcome')
    if (user && !hasSeenWelcome) {
      setShowWelcome(true)
      localStorage.setItem('laverdi_seen_welcome', 'true')
    }
  }, [user])

  if (showWelcome && user) {
    return (
      <WelcomeLanding
        userName={user.email.split('@')[0]}
        onComplete={() => setShowWelcome(false)}
      />
    )
  }

  // ... existing dashboard code
}
```

---

## Phase 4: Testing (45 min)

### Test Checklist
- [ ] PulseEngine renders without errors
- [ ] ParticleSystem particles animate upward
- [ ] Molty character visible and rotating
- [ ] Sequence timing correct (pulse → molty → particles → fade)
- [ ] Skip button works
- [ ] Animation smooth on desktop (60 FPS target)
- [ ] Works on mobile (canvas responsive)
- [ ] No memory leaks (dispose properly)
- [ ] Error handling if WebGL not supported

### Performance Targets
- PulseEngine: < 2ms per frame
- ParticleSystem: < 3ms per frame
- Molty: < 2ms per frame
- **Total budget:** < 16ms (60 FPS)

---

## Phase 5: Deployment & Iteration (Optional)

### Production Optimizations
1. **Lazy load Three.js** — only load when WelcomeLanding mounted
2. **Pre-allocate geometries** — avoid garbage collection during animation
3. **Use OffscreenCanvas** — render pulse engine on separate thread
4. **Add prefers-reduced-motion** — respect accessibility settings
5. **Implement fallback** — static image if WebGL unavailable

### Optional Enhancements
- Sound effects (subtle whoosh, pulse beat)
- Customizable animation duration
- Different Molty poses (rising, ready, waving)
- Analytics tracking (% of users who watch full animation)

---

## Implementation Order

1. ✅ Extract PulseEngine.ts from prototype_pulse.html
2. ✅ Extract ParticleSystem.ts from visual-engine-prototype.html
3. ✅ Extract MoltyCharacter.ts from molty_storybook.html
4. ✅ Create React wrapper components
5. ✅ Create WelcomeLanding orchestrator
6. ✅ Integrate into dashboard/index.tsx
7. ✅ Test and optimize
8. ✅ Deploy

---

## Files to Create/Modify

**New Files:**
- `lib/three/PulseEngine.ts`
- `lib/three/ParticleSystem.ts`
- `lib/three/MoltyCharacter.ts`
- `lib/three/types.ts`
- `components/PulseEngine.tsx`
- `components/ParticleSystem.tsx`
- `components/Molty.tsx`
- `components/WelcomeLanding.tsx`

**Modified Files:**
- `pages/dashboard/index.tsx` — Add WelcomeLanding integration
- `styles/globals.css` — Add animation keyframes

**CSS Keyframes to Add:**
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-delayed {
  0% { opacity: 0; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## Success Criteria

✅ Molty rises from depths with particle effect  
✅ Pulse engine creates dynamic background  
✅ Smooth 60 FPS animation on desktop  
✅ Works on mobile without lag  
✅ Skippable for impatient users  
✅ First-load experience only (not repeated)  
✅ No console errors  
✅ Proper resource cleanup  

---

## Rollback Plan

If issues arise:
1. Set `localStorage.setItem('laverdi_seen_welcome', 'true')` to skip animation
2. Comment out `WelcomeLanding` in dashboard/index.tsx
3. Deploy hotfix
4. Debug locally, iterate, redeploy

---

## Next Steps (After Sub-pages Complete)

1. Read `prototype_pulse.html` and extract PulseEngine logic
2. Read `visual-engine-prototype.html` and extract ParticleSystem logic
3. Build lib/three/ modules
4. Build React components
5. Integrate into dashboard
6. Test end-to-end

**ETA:** ~3 hours total  
**Ready to start:** Once sub-pages merge

