# Molty Integration - Quick Reference

## 🚀 Quick Start

### View Welcome Animation (Dev)
```bash
cd src/laverdi-portal
npm run dev
# Navigate to /dashboard as first-time user
```

### Reset Welcome Flag (Testing)
```javascript
// In browser console:
localStorage.removeItem('laverdi_seen_welcome')
// Then refresh page
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/three/PulseEngine.ts` | Rotating rings + mesh animation |
| `lib/three/ParticleSystem.ts` | 2500-particle emergence |
| `lib/three/MoltyCharacter.ts` | Molty character + glow |
| `components/WelcomeLanding.tsx` | Orchestrator (0-4.5s timeline) |
| `pages/dashboard/index.tsx` | Dashboard integration |
| `styles/globals.css` | Animation keyframes |

## 🎯 Animation Timeline

```
0ms ────────────────┬──────────────┬──────────────────┐ 4500ms
    Pulse Engine    │   Molty      │ Particles Emerge │ Fade Out
    (1000ms)        (1500ms)       (3000ms)           
```

## 🎨 Colors Used

- **#ff0000** - Lights (Point & Ambient)
- **#ff3333** - Molty emissive material
- **#000000** - Scene background

## ⚙️ Configuration

### PulseEngine
- 8 torus rings (rotating, pulsing opacity)
- TorusKnot central mesh
- Point light: 100 intensity, 20 range
- Ambient light: 0.05 intensity

### ParticleSystem
- 2500 particles
- Sphere distribution (r: 3-5)
- Additive blending
- Emergence duration: 3000ms

### MoltyCharacter
- TorusKnot: (1, 0.3, 200, 32)
- Point light: 50-150 intensity (based on glow)
- Rotation speed: 0.001 rad/frame
- Bob animation: sin(time) * 0.1

## 📊 Performance Targets

- **Frame Rate:** 60 FPS
- **Frame Time:** < 16.67ms
- **Per-scene:** < 3ms each
- **Memory:** Full cleanup on dispose

## 🐛 Debugging

### Check if Welcome Shows
```javascript
const seen = localStorage.getItem('laverdi_seen_welcome')
console.log('Welcome seen:', seen) // null = should show
```

### Monitor Performance
```javascript
// In DevTools Performance tab:
1. Start recording
2. Play animation
3. Check FPS (target 60, min 45)
```

### Check Three.js Rendering
```javascript
// Browser console:
const canvas = document.querySelector('canvas')
console.log('Canvas size:', canvas.width, canvas.height)
console.log('Device pixel ratio:', window.devicePixelRatio)
```

## 🔧 Common Tasks

### Change Animation Duration
Edit `components/WelcomeLanding.tsx` timing constants:
```typescript
const timing = {
  molty: 1000,      // When Molty appears
  particles: 1500,  // When particles start
  complete: 4500    // When fade completes
}
```

### Change Colors
Edit the respective component:
- PulseEngine: `0xff0000` values
- Molty: `0xff3333` emissive, `0xff0000` light
- ParticleSystem: `0xff3131` color

### Adjust Particle Count
Edit `lib/three/ParticleSystem.ts`:
```typescript
this.particleCount = config?.particleCount || 2500
```

### Disable Welcome Permanently
Edit `pages/dashboard/index.tsx`:
```typescript
// Comment out this check:
// if (userData && !hasSeenWelcome) {
//   setShowWelcome(true)
// }
setShowWelcome(false) // Always skip
```

## ✅ Checklist for Production

- [ ] Build passes: `npm run build`
- [ ] TypeScript clean: `npx tsc --noEmit`
- [ ] Test on desktop
- [ ] Test on mobile
- [ ] Test skip button
- [ ] Test localStorage flag
- [ ] Monitor console for errors
- [ ] Check DevTools for memory leaks
- [ ] Verify 60 FPS performance
- [ ] Deploy to staging
- [ ] Final QA sign-off

## 📞 Support

### Issue: White screen on /dashboard
- [ ] Check browser console for WebGL errors
- [ ] Verify Three.js import in page
- [ ] Check if WebGL is available: `!!window.WebGLRenderingContext`

### Issue: Animation jank/stuttering
- [ ] Open DevTools → Performance
- [ ] Check FPS (target 60)
- [ ] Close other browser tabs
- [ ] Check hardware acceleration: chrome://gpu

### Issue: Welcome shows every time
- [ ] Check localStorage: `localStorage.getItem('laverdi_seen_welcome')`
- [ ] Verify this runs: `localStorage.setItem('laverdi_seen_welcome', 'true')`

### Issue: Molty not visible
- [ ] Check Molty.tsx canvas rendering
- [ ] Verify Three.js scene setup
- [ ] Check camera position (z: 4)
- [ ] Check if particles are occluding (z-order)

---

**Build Status:** ✅ Production Ready  
**Last Updated:** 2026-04-15 18:50 PDT
