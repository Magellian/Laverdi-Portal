# Molty + Particle System Integration Plan

**Goal:** Combine pulse engine + particle effects with Molty rising animation for dashboard landing

---

## Visual Assets Found

### 1. **Pulse Engine** (`prototype_pulse.html`)
- 8 rotating torus rings with varying opacity
- Red (lobster) light creating chiaroscuro effect
- Pulsing tendrils that rotate around central object
- Perfect for: Background effect, system heartbeat visualization

### 2. **Particle System** (`visual-engine-prototype.html`)
- 2500 lobster-red particles in sphere distribution
- Physics-based movement (velocity vectors)
- Additive blending for glow effect
- Can be triggered/animated on demand
- Perfect for: Molty emergence from depths, trail effects

### 3. **Molty Character** (`molty_storybook.html`)
- Torus knot geometry with emissive material
- ScrollTrigger animation system
- Can be adapted for dashboard context
- Perfect for: Hero character animation

---

## Integration Strategy

### Phase 1: Create Reusable Components

#### 1.1 PulseEngine.tsx (Background system)
```typescript
// lib/components/PulseEngine.tsx
export function PulseEngine() {
  return (
    <canvas ref={canvasRef} className="absolute inset-0 z-0" />
  )
}
```
- Runs in background of dashboard
- 8 rotating pulse rings
- Low opacity overlay
- Pure Three.js, no dependencies beyond three.js

#### 1.2 ParticleSystem.tsx (Molty emergence)
```typescript
// lib/components/ParticleSystem.tsx
export function ParticleSystem({ onComplete }) {
  // 2500 particles that animate upward
  // Triggered on dashboard load
  // Triggers callback when animation complete
}
```
- Particles rise from bottom of screen
- Coalesce toward center
- Forms shape around Molty character
- Configurable trigger time

#### 1.3 Molty.tsx (Character)
```typescript
// lib/components/Molty.tsx
export function Molty({ isEmerging }) {
  // Torus knot with emissive material
  // Glows and rotates
  // Positioned center-screen
}
```
- Red torus knot with red light
- Emissive glow
- Rotation animation
- Can disable/hide until particles coalesce

---

## Dashboard Integration Flow

### Current dashboard/index.tsx structure:
```
Dashboard
├─ Navbar (top)
├─ Content Grid (main)
│  ├─ Tier Card
│  ├─ API Key Card
│  ├─ Member Since Card
│  ├─ Instance Status
│  ├─ Usage Meter
│  └─ Action Links
```

### Proposed enhancement - "Welcome Landing" page:
1. On first-time load → show landing screen
2. **Sequence:**
   - PulseEngine starts (background effect)
   - Molty character appears center
   - ParticleSystem triggers (2 second animation)
   - Particles rise and coalesce around Molty
   - On completion → fade to main dashboard
   - OR user can click "Skip" to go straight to dashboard

---

## Component Dependencies

```
Dashboard/index.tsx
├─ PulseEngine
│  └─ Three.js (existing)
├─ WelcomeLanding (new)
│  ├─ ParticleSystem
│  │  └─ Three.js
│  ├─ Molty
│  │  └─ Three.js
│  └─ SkipButton
└─ MainDashboard (existing)
```

All components share:
- Three.js (already installed)
- GSAP (already installed for animations)
- Canvas-based rendering

---

## Implementation Steps

### Step 1: Extract & Refactor Three.js Code
1. Take Molty scene setup from `molty_storybook.html`
2. Extract particle system from `visual-engine-prototype.html`
3. Extract pulse engine from `prototype_pulse.html`
4. Convert to React components with refs + hooks

### Step 2: Create lib/three/
```
lib/three/
├─ PulseEngine.ts (scene, geometry, animation logic)
├─ ParticleSystem.ts (particle setup, animation)
├─ MoltyCharacter.ts (Molty geometry, material, light)
└─ types.ts (shared types, interfaces)
```

### Step 3: Create Components
```
components/
├─ PulseEngine.tsx (wrapper around Three.js scene)
├─ ParticleSystem.tsx (particle animation manager)
├─ Molty.tsx (character display)
└─ WelcomeLanding.tsx (orchestrates sequence)
```

### Step 4: Integrate into Dashboard
- Add to `pages/dashboard/index.tsx`
- Show on first-time load (check sessionStorage/localStorage)
- Auto-dismiss after 5 seconds OR on click
- Fade smoothly to main dashboard

### Step 5: Testing
- [ ] Particle animation smooth (60 FPS target)
- [ ] Molty character visible and rotating
- [ ] Pulse engine background subtle but visible
- [ ] Sequence timing (emergence → coalescence → fade)
- [ ] Works on mobile (responsive canvas)
- [ ] Fallback if WebGL not supported

---

## Performance Considerations

**Target:** 60 FPS on mid-range devices

**Optimization strategies:**
1. Use OffscreenCanvas for background pulse (separate thread)
2. Particle system uses BufferGeometry (already optimized)
3. InstancedMesh for repeated geometries
4. Disable when not visible (unmount WelcomeLanding)
5. Use requestAnimationFrame with delta time

**Budget:**
- PulseEngine: ~500 triangles → negligible cost
- ParticleSystem: 2500 points → ~2ms per frame
- Molty: ~5000 triangles → ~2ms per frame
- Total: ~5ms per frame = 99 FPS budget remaining

---

## Fallback & Accessibility

**If WebGL not supported:**
- Show static Molty logo/image
- Skip animation sequence
- Display dashboard normally

**Accessibility:**
- Provide "Skip animation" button
- Don't auto-play sounds
- Keep animation < 5 seconds max
- Respect prefers-reduced-motion

---

## Timeline

| Task | Effort | Status |
|------|--------|--------|
| Extract Three.js code | 30 min | Ready |
| Create lib/three/ modules | 45 min | Not started |
| Create React components | 1 hour | Not started |
| Integrate into dashboard | 30 min | Not started |
| Testing + optimization | 45 min | Not started |
| **Total** | **3 hours** | **Not started** |

---

## Files to Create

1. `lib/three/PulseEngine.ts` — Scene, geometry, animation
2. `lib/three/ParticleSystem.ts` — Particle pool, animation
3. `lib/three/MoltyCharacter.ts` — Character geometry/material
4. `lib/three/types.ts` — Shared interfaces
5. `lib/three/utils.ts` — Helper functions (math, camera, etc)
6. `components/PulseEngine.tsx` — React wrapper
7. `components/ParticleSystem.tsx` — React wrapper
8. `components/Molty.tsx` — React wrapper
9. `components/WelcomeLanding.tsx` — Orchestrator
10. Update `pages/dashboard/index.tsx` — Integration point

---

## Next Actions (After Signup Flow Confirmed Working)

1. ✅ Extract Three.js code from prototypes
2. ✅ Create lib/three/ modules
3. ✅ Build React components
4. ✅ Integrate into dashboard
5. ✅ Test on mobile & desktop
6. ✅ Deploy & iterate

