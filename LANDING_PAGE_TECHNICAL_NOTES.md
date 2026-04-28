# Technical Architecture & Implementation Notes

**Document:** Landing Page Technical Deep Dive  
**Date:** 2026-04-16  
**Level:** Developer Reference

---

## 🏗️ Architecture Overview

```
Landing Page Architecture
│
├── React Components Layer
│   ├── pages/index.tsx (Layout + Content)
│   └── components/LandingHeroScene.tsx (Three.js Integration)
│
├── Animation Layer
│   ├── GSAP ScrollTrigger (Scroll animations)
│   └── Three.js RequestAnimationFrame (Canvas animations)
│
├── Rendering Layer
│   ├── Three.js WebGL Scene
│   ├── DOM Elements (Text, buttons)
│   └── Canvas (Molty + Particles)
│
└── Asset Layer
    ├── SVG Icons (/public/icons/)
    └── Typography (System fonts)
```

---

## 📝 File-by-File Breakdown

### `pages/index.tsx` - Main Landing Page

**Structure:**
```tsx
export default function Home() {
  // Refs for each section
  const containerRef = useRef<HTMLDivElement>(null)
  const heroTextRef = useRef<HTMLDivElement>(null)
  const problemSectionRef = useRef<HTMLDivElement>(null)
  // ... etc

  // Animation setup in useEffect
  useEffect(() => {
    // Create GSAP timeline with ScrollTrigger
    // Animate each section on scroll
  }, [])

  return (
    <div className="relative bg-black text-white">
      {/* Hero Scene - Three.js canvas */}
      <LandingHeroScene />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Sections */}
      <section className="h-screen">Hero</section>
      <section className="min-h-screen">Problem</section>
      <section>Solution</section>
      <section>Features</section>
      <section>CTA</section>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
```

**Key Techniques:**
1. **Refs for Animation:** Each section has a `useRef` for GSAP targeting
2. **Timeline-Based:** All animations use single GSAP timeline
3. **ScrollTrigger:** Tied to scroll progress
4. **Stagger:** Elements in lists use `stagger` for cascade
5. **Element Selectors:** Query selectors within refs

**Animation Pattern:**
```tsx
gsap.from(element, {
  scrollTrigger: {
    trigger: element,
    start: "top 80%",      // When element top is 80% of viewport
    toggleActions: "play none none reverse"
  },
  opacity: 0,
  duration: 0.8,
  stagger: 0.1             // Delay between each item
})
```

---

### `components/LandingHeroScene.tsx` - Three.js Scene

**Structure:**
```tsx
export default function LandingHeroScene() {
  const mountRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // 1. Scene Setup
    const scene = new THREE.Scene()
    
    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(...)
    
    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer(...)
    
    // 4. Create Molty
    const moltyGroup = new THREE.Group()
    // - Main geometry
    // - Glow sphere
    // - Outer rings
    
    // 5. Create Particles
    const particles: Particle[] = []
    // - Generate 30 particles in sphere
    // - Assign random icon to each
    // - Create plane meshes
    
    // 6. Animation Loop
    function animate() {
      // Update Molty position (rising)
      // Update particle orbits
      // Update camera
      // Render scene
    }
    
    // 7. Cleanup
    return () => {
      // Remove listeners
      // Cancel animation
      // Dispose resources
    }
  }, [])
  
  return <div ref={mountRef} />
}
```

**Key Patterns:**

#### 1. Molty Character Creation
```tsx
const moltyGroup = new THREE.Group()

// Main body - TorusKnot
const bodyGeo = new THREE.TorusKnotGeometry(1.2, 0.4, 200, 32)
const bodyMat = new THREE.MeshStandardMaterial({
  color: 0xff3333,
  roughness: 0.15,
  metalness: 0.85,
  emissive: 0xff3333,
  emissiveIntensity: 0.3
})
moltyGroup.add(new THREE.Mesh(bodyGeo, bodyMat))

// Glow sphere wrapper
const glowGeo = new THREE.SphereGeometry(2.5, 32, 32)
const glowMat = new THREE.MeshBasicMaterial({
  color: 0xff3333,
  transparent: true,
  opacity: 0.05,
  blending: THREE.AdditiveBlending  // Key: adds to background
})
moltyGroup.add(new THREE.Mesh(glowGeo, glowMat))

// Outer rings - loop creates 3 rings
for (let i = 0; i < 3; i++) {
  const ringGeo = new THREE.TorusGeometry(2.8 + i * 0.5, 0.08, 16, 100)
  // Create with increasing opacity falloff
}
```

**Why TorusKnot?** - Complex geometry creates interesting visual motion when rotated

#### 2. Particle System
```tsx
interface Particle {
  position: THREE.Vector3        // Current position
  velocity: THREE.Vector3        // Not used but structure ready
  originalPosition: THREE.Vector3 // For reference
  rotation: number               // Individual rotation
  rotationSpeed: number          // Speed of rotation
  iconIndex: number              // Which SVG icon (0-6)
  mesh?: THREE.Mesh              // Reference to visual mesh
}

// Generation: Fibonacci sphere distribution
for (let i = 0; i < particleCount; i++) {
  const phi = Math.acos(2 * Math.random() - 1)
  const theta = Math.random() * Math.PI * 2
  const r = 3.5 + Math.random() * 2
  
  // Results in even distribution across sphere
}
```

#### 3. Icon Texture Atlas
```tsx
// Create canvas to hold all icons
const canvas = document.createElement('canvas')
canvas.width = 256
canvas.height = 256 * ICON_KEYS.length  // Stack all icons

// Draw each SVG onto canvas
const ctx = canvas.getContext('2d')!
for (let i = 0; i < ICON_KEYS.length; i++) {
  const img = new Image()
  img.src = WORKFLOW_ICONS[key]  // Base64 SVG
  img.onload = () => {
    ctx.drawImage(img, 0, i * 256, 256, 256)
  }
}

// Convert to texture
const texture = new THREE.CanvasTexture(canvas)

// For each particle, set UV offset
pMesh.geometry.attributes.uv.array[1] = vOffset
pMesh.geometry.attributes.uv.array[3] = vOffset + 1 / ICON_KEYS.length
```

**Why Texture Atlas?** - One material for all particles instead of 30 materials = massive performance boost

#### 4. Animation Loop
```tsx
const startTime = Date.now()

function animate() {
  animationIdRef.current = requestAnimationFrame(animate)
  const elapsed = (Date.now() - startTime) / 1000
  
  // Molty rises over first 3 seconds
  const riseProgress = Math.min(elapsed / 3, 1)
  moltyGroup.position.y = -4 + riseProgress * 4
  
  // Idle rotation
  moltyGroup.children[0].rotation.x += 0.0015
  moltyGroup.children[0].rotation.y += 0.002
  
  // Particle orbits
  particles.forEach((particle, idx) => {
    const angle = idx * (Math.PI * 2 / count) + elapsed * speed
    const radius = 3.5 + Math.sin(elapsed * 0.5) * 0.3
    particle.position.x = Math.cos(angle) * radius
    particle.position.y = Math.sin(elapsed * 0.5 + idx) * 1.5 - 2
    particle.position.z = Math.sin(angle) * radius
  })
  
  renderer.render(scene, camera)
}
```

---

## 🎬 Animation Choreography

### Timeline: First 3 Seconds
```
t=0.0s: User lands on page
        - Molty at Y = -4 (bottom of viewport)
        - Particles visible but static
        - Hero text fades in

t=1.5s: Molty halfway risen
        - Y = 0 (center)
        - Light intensity increasing
        - Text animations complete

t=3.0s: Molty fully risen
        - Y = 4 (top, but off-screen)
        - Idle animations begin
        - Ready for scroll interactions
```

### Timeline: Scroll Through Sections
```
Section: Hero
- No scroll-based animation
- Molty stays in view
- Particles continue orbiting

Section: Problem (top to 80% of viewport)
- Problem items slide in from left (staggered)
- Opacity: 0 → 1
- X: -50px → 0px

Section: Solution
- Text fades in
- Icons appear
- Slow scroll parallax

Section: Features
- Cards appear with stagger (each 0.15s apart)
- Opacity: 0 → 1
- Y: 60px → 0px

Section: CTA
- Content scales up (0.95 → 1.0)
- Opacity: 0 → 1
- Entrance animation on view
```

---

## 🎨 Styling Deep Dive

### Color System
```css
/* Primary Colors */
--color-bg: #000000      /* Pure black backgrounds */
--color-accent: #ff3333  /* Vibrant red accents */
--color-text: #ffffff    /* White text */

/* Derived Colors */
--color-gray-300: #cccccc   /* Light gray secondary text */
--color-gray-400: #999999   /* Medium gray */
--color-gray-900: #111111   /* Very dark gray for cards */
```

### Tailwind Overrides
```tsx
// Classes used from Tailwind
className="bg-black"                    // #000000
className="text-[#ff3333]"              // Arbitrary color
className="border-[#ff3333]"            // Arbitrary color
className="hover:bg-red-600"            // Tailwind red-600
className="bg-gray-900/30"              // Gray with opacity
className="border-gray-800"             // Tailwind gray-800

// Custom animations applied with GSAP
// (not using Tailwind animation utilities for scroll)
```

### Responsive Breakpoints Used
```tsx
// Mobile First (375px base)
<h1 className="text-6xl md:text-7xl lg:text-8xl">

// Grid Responsive
<div className="grid grid-cols-1 md:grid-cols-2">

// Padding Responsive
className="px-6 md:px-[10%]"
```

---

## 🔄 Data Flow

### State Management
```
No Redux/Context - Purely React

Page Component
├── heroTextRef ──→ GSAP targets hero text
├── problemSectionRef ──→ GSAP targets problem items
├── featureSectionRef ──→ GSAP targets feature cards
└── ctaSectionRef ──→ GSAP targets CTA

LandingHeroScene
├── sceneRef ──→ Three.js scene reference
├── cameraRef ──→ Three.js camera reference
├── rendererRef ──→ Three.js renderer reference
├── particlesRef ──→ Array of particle objects
└── animationIdRef ──→ RAF callback ID
```

### Event Flow
```
Window Scroll Event
  ↓
ScrollTrigger Listener (GSAP)
  ├─→ Check which sections are in viewport
  ├─→ Calculate scroll progress (0-1)
  ├─→ Update animation values
  └─→ Trigger element animations

Window Resize Event
  ↓
Resize Handler
  ├─→ Update camera aspect ratio
  ├─→ Update renderer size
  └─→ Continue animation with new dimensions

RAF Animation Frame
  ↓
LandingHeroScene animate()
  ├─→ Calculate elapsed time
  ├─→ Update Molty position
  ├─→ Update particle orbits
  ├─→ Update camera position
  └─→ Render Three.js scene
```

---

## 🚀 Performance Optimizations

### Rendering
```tsx
// Additive Blending - faster than normal blending
blending: THREE.AdditiveBlending

// Depth Write Disabled - particles don't write to depth
depthWrite: false

// Pixel Ratio Capped
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Alpha Channel - faster than opaque
renderer.setPixelRatio()  // Uses alpha channel
```

### Memory Management
```tsx
// Texture Atlas - 1 texture, 30 materials use same texture
const texture = new THREE.CanvasTexture(canvas)
// Reused across all 30 particles

// Geometry Reuse
const pGeo = new THREE.PlaneGeometry(0.4, 0.4)  // Created once
// Used by 30 meshes (each has reference, shared geometry)

// Proper Cleanup
scene.traverse((obj) => {
  if (obj instanceof THREE.Mesh) {
    obj.geometry?.dispose()
    obj.material?.dispose()
  }
})
renderer.dispose()
```

### Animation Performance
```tsx
// Single RequestAnimationFrame
// Not per-component RAF (one RAF loop = 60fps stable)

// GSAP ScrollTrigger
// Uses passive scroll listeners (no performance hit)

// Stagger Animations
// Spread out opacity changes (less GPU work at once)
```

---

## 🛠️ Debugging Tips

### Check Three.js Setup
```javascript
// In DevTools console
console.log(scene.children.length)  // Should be > 5
console.log(renderer.getPixelRatio())  // Check quality
const gl = renderer.getContext()
console.log(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS))  // Texture slots
```

### Monitor Performance
```javascript
// FPS Monitor
let lastTime = Date.now()
let frameCount = 0
animate = () => {
  const now = Date.now()
  if (now - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`)
    frameCount = 0
    lastTime = now
  }
  frameCount++
  // ... rest of animation
}

// Memory Usage
performance.memory.usedJSHeapSize / 1048576  // MB
```

### Debug Particle Rendering
```javascript
// Show particle coordinates
particles.forEach((p, i) => {
  console.log(`Particle ${i}: (${p.position.x.toFixed(2)}, ${p.position.y.toFixed(2)}, ${p.position.z.toFixed(2)})`)
})

// Check texture mapping
console.log(ICON_KEYS)  // Verify icons array
console.log(particles[0].iconIndex)  // Check assigned icon
```

---

## 🔗 Integration Points

### With Existing Codebase
```tsx
// Navbar integration
import Navbar from '@/components/Navbar'
<Navbar />  // Renders with existing styles

// Footer integration  
import Footer from '@/components/Footer'
<Footer />  // Renders at bottom

// Link integration
<Link href="/auth/signup">  // Uses Next.js Link
<a href="mailto:support@laverdi.tech">  // Standard anchor
```

### Environment Variables (Not Used)
- No new env vars needed
- No API calls from landing page
- Future: Waitlist form would need backend

---

## 📚 References & Resources

### Three.js Documentation
- **TorusKnot:** Complex knot geometry for visual interest
- **AdditiveBlending:** Makes glow effects visible
- **CanvasTexture:** Dynamically created from SVG

### GSAP ScrollTrigger Documentation
- **scrollTrigger.start:** CSS-like positioning (e.g., "top 80%")
- **toggleActions:** "play none none reverse" = play on enter, reverse on leave
- **stagger:** Time between each element animation

### Performance Patterns Used
- **Texture Atlas:** Multiple objects sharing one texture
- **Geometry Reuse:** Multiple meshes sharing one geometry
- **Passive Event Listeners:** ScrollTrigger uses these automatically
- **RequestAnimationFrame:** Syncs with browser refresh rate

---

## 🎯 Key Takeaways for Maintenance

1. **Never instantiate GSAP/Three.js outside useEffect** - Can cause memory leaks in dev mode

2. **Always cleanup in return of useEffect** - Remove listeners, cancel RAF, dispose resources

3. **Use refs for animation targets** - Direct DOM refs are more efficient than selectors

4. **Keep animation logic simple** - Complex timelines become hard to debug

5. **Monitor performance regularly** - Lighthouse scores, FPS, memory usage

6. **Test on real devices** - Mobile performance varies significantly

---

**This document serves as reference for future maintenance and enhancements.**

