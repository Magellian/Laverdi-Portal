# Phase 2: Molty Character Animation Overhaul - CODE IMPLEMENTATION

**Estimated Time:** 2-3 hours  
**Components Affected:** MoltyCharacter.ts, ParticleSystem.ts, IconParticle.ts (new)  
**Date:** 2026-04-18

---

## Overview

This phase updates Molty to:
1. **Stay upright** during all camera movements/zoom
2. Replace generic particles with **semantic workflow icons** (email, checkmark, gear, etc.)
3. **Slow particle movement** 3-4x for leisurely floating effect
4. **Reduce particle count** by 50% for better performance

---

## File 1: Update MoltyCharacter.ts

**Path:** `lib/three/MoltyCharacter.ts`

### Change Summary
- Add `constrainOrientationToUpright()` method
- Prevent Y-axis rotation (tilt)
- Lock roll (Z-axis) to near-zero
- Call constraint each animation frame

### Complete Updated File

Replace the entire `animate()` method and add new method:

```typescript
// ADD THIS NEW METHOD TO THE CLASS

/**
 * Constraint: Keep Molty upright at all times
 * - Y-axis (vertical): NO ROTATION (always upright)
 * - X-axis (forward/back): Allow small tilt (-0.3 to +0.3 rad)
 * - Z-axis (roll): Allow tiny roll (-0.1 to +0.1 rad)
 * 
 * This prevents Molty from flipping upside-down during zoom or pan
 */
constrainOrientationToUpright() {
  // Extract current rotation as Euler angles
  const euler = new THREE.Euler().setFromQuaternion(this.group.quaternion)

  // LOCK Y-axis (stay upright) - most important
  euler.y = 0

  // CLAMP X-axis (forward/back tilt) - allow subtle nod
  const xClamp = 0.3
  euler.x = Math.max(-xClamp, Math.min(xClamp, euler.x))

  // CLAMP Z-axis (roll/side tilt) - prevent tilting sideways
  const zClamp = 0.1
  euler.z = Math.max(-zClamp, Math.min(zClamp, euler.z))

  // Apply constrained rotation back to quaternion
  this.group.quaternion.setFromEuler(euler)
}

/**
 * Updated animate method with orientation constraint
 */
animate(deltaTime: number) {
  if (this.isDisposed) return

  // Smooth quaternion interpolation for auto-correct
  if (this.isAutoCorrectingOrientation) {
    const lerpFactor = Math.min(1, deltaTime * this.autoCorrectSpeed)
    this.currentRotation.slerpQuaternions(
      this.currentRotation,
      this.targetRotation,
      lerpFactor
    )
    this.group.quaternion.copy(this.currentRotation)

    // Check if we're close enough to target
    if (this.currentRotation.angleTo(this.targetRotation) < 0.01) {
      this.isAutoCorrectingOrientation = false
    }
  }

  // *** NEW: Constrain orientation to prevent tilting ***
  this.constrainOrientationToUpright()

  // Subtle idle animations
  const time = Date.now() * 0.001

  // Bob up and down slightly
  this.group.position.y = Math.sin(time * 0.8) * 0.05

  // Gentle sway side to side (NOT on Z-axis rotation anymore)
  // Instead, slightly move the group side-to-side
  this.group.position.x = 0.5 + Math.sin(time * 0.5) * 0.02

  // Arm wave animation
  const armWave = Math.sin(time * 1.5) * 0.15
  this.leftArmMesh.rotation.z = 0.3 + armWave
  this.rightArmMesh.rotation.z = -0.3 - armWave

  // Eyes follow camera (subtle tracking)
  const eyeOffsetX = Math.sin(time * 0.7) * 0.05
  const eyeOffsetZ = Math.cos(time * 0.7) * 0.03

  this.leftEyeMesh.position.x = -0.12 + eyeOffsetX
  this.leftEyeMesh.position.z = 0.22 + eyeOffsetZ

  this.rightEyeMesh.position.x = 0.12 + eyeOffsetX
  this.rightEyeMesh.position.z = 0.22 + eyeOffsetZ

  // Gentle head tilt (smaller than before to stay upright)
  this.headMesh.rotation.x = Math.sin(time * 0.6) * 0.03  // Reduced from 0.05
  this.headMesh.rotation.z = Math.sin(time * 0.4) * 0.02  // Reduced from 0.03
}
```

### Testing Checklist
- [ ] Zoom in/out: Molty stays upright
- [ ] Pan camera: Molty maintains vertical orientation
- [ ] Head tilt: Subtle, not extreme
- [ ] No unpredictable flipping

---

## File 2: Create IconParticle.ts

**Path:** `lib/three/IconParticle.ts` (NEW FILE)

```typescript
import * as THREE from 'three'

export type IconType = 'email' | 'check' | 'gear' | 'document' | 'link' | 'clock'

export interface IconParticleConfig {
  position: THREE.Vector3
  velocity: THREE.Vector3
  iconType: IconType
  color?: number
  size?: number
}

export class IconParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  iconType: IconType
  mesh: THREE.Mesh | null = null
  
  // Animation properties
  rotationSpeed: number
  currentRotation: number = 0
  bobPhase: number = Math.random() * Math.PI * 2
  bobSpeed: number = 0.5 + Math.random() * 0.3  // Seconds per bob cycle
  
  // Particle lifespan
  lifespan: number = Infinity  // Optional: particles can expire
  age: number = 0
  
  // Color coding per icon type
  static COLOR_MAP: Record<IconType, number> = {
    email: 0x3b82f6,      // Blue
    check: 0x10b981,      // Green
    gear: 0x14b8a6,       // Teal
    document: 0x9ca3af,   // Gray
    link: 0xa855f7,       // Purple
    clock: 0xf97316       // Orange
  }

  constructor(config: IconParticleConfig) {
    this.position = config.position.clone()
    this.velocity = config.velocity.clone()
    this.iconType = config.iconType
    
    // Slow movement speed (3-4x slower than original)
    // Original was 0.02, now 0.005-0.008
    this.velocity.multiplyScalar(0.4)
    
    // Random rotation speed for spinning effect
    this.rotationSpeed = (Math.random() - 0.5) * 0.1
  }

  /**
   * Create a Three.js mesh for this particle
   */
  createMesh(texture: THREE.Texture, size: number = 0.3): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size)
    
    // Get color for this icon type
    const color = IconParticle.COLOR_MAP[this.iconType]
    
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      color: color,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)
    
    return this.mesh
  }

  /**
   * Update particle position and animation each frame
   */
  update(deltaTime: number): boolean {
    // Update age
    this.age += deltaTime
    
    // Apply velocity to position
    this.position.add(
      new THREE.Vector3().copy(this.velocity).multiplyScalar(deltaTime * 60)  // Normalize for 60fps
    )
    
    // Update rotation
    this.currentRotation += this.rotationSpeed
    
    // Calculate bobbing offset (vertical float motion)
    const bobOffset = Math.sin(this.age * 2 * Math.PI / this.bobSpeed) * 0.1
    
    // Update mesh if it exists
    if (this.mesh) {
      this.mesh.position.copy(this.position)
      this.mesh.position.y += bobOffset
      this.mesh.rotation.z = this.currentRotation
      
      // Optional: Fade out near end of lifespan
      if (this.lifespan !== Infinity) {
        const timeRemaining = this.lifespan - this.age
        if (timeRemaining < 1) {
          // Fade out over last second
          const material = this.mesh.material as THREE.MeshBasicMaterial
          if (material.opacity !== undefined) {
            material.opacity = 0.8 * Math.max(0, timeRemaining)
          }
        }
      }
    }
    
    // Return true if particle is still alive, false if expired
    return this.age < this.lifespan
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.mesh) {
      this.mesh.geometry?.dispose()
      const material = this.mesh.material
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose())
      } else {
        material?.dispose()
      }
    }
  }

  /**
   * Get weighted random icon type (some icons spawn more frequently)
   */
  static getRandomIconType(): IconType {
    const rand = Math.random()
    
    // Weight distribution
    if (rand < 0.2) return 'email'      // 20%
    if (rand < 0.4) return 'check'      // 20%
    if (rand < 0.6) return 'gear'       // 20%
    if (rand < 0.8) return 'document'   // 20%
    if (rand < 0.92) return 'link'      // 12%
    return 'clock'                       // 8%
  }
}
```

---

## File 3: Update ParticleSystem.ts

**Path:** `lib/three/ParticleSystem.ts`

### Key Changes
1. Reduce `particleCount` from 2500 to 1250 (50% reduction)
2. Slow movement velocity from 0.02 to 0.005-0.008 (3-4x slower)
3. Replace generic PointsMaterial with semantic icon meshes

### Updated Constructor Section

```typescript
constructor(canvas: HTMLCanvasElement, config?: Partial<ParticleSystemConfig>) {
  this.canvas = canvas
  const width = config?.width || window.innerWidth
  const height = config?.height || window.innerHeight
  const antialias = config?.antialias !== false
  
  // CHANGED: Reduce particle count from 2500 to 1250 (50% reduction)
  this.particleCount = config?.particleCount || 1250

  // Scene setup
  this.scene = new THREE.Scene()
  this.scene.background = new THREE.Color(0x000000)

  // Camera setup
  this.camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    0.1,
    1000
  )
  this.camera.position.z = 8

  // Renderer setup
  this.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha: true
  })
  this.renderer.setSize(width, height)
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Initialize particle arrays
  this.positions = new Float32Array(this.particleCount * 3)
  this.velocities = new Float32Array(this.particleCount * 3)
  this.originalPositions = new Float32Array(this.particleCount * 3)

  // Populate particles in sphere distribution
  for (let i = 0; i < this.particleCount; i++) {
    const r = 3 + Math.random() * 2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    // Store original sphere positions
    this.positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    this.positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    this.positions[i * 3 + 2] = r * Math.cos(phi)

    this.originalPositions[i * 3] = this.positions[i * 3]
    this.originalPositions[i * 3 + 1] = this.positions[i * 3 + 1]
    this.originalPositions[i * 3 + 2] = this.positions[i * 3 + 2]

    // Initialize velocities - CHANGED: Much slower (0.005-0.008 instead of 0.02)
    // This is 3-4x slower movement
    const speedFactor = 0.004  // Base speed (slow)
    this.velocities[i * 3] = (Math.random() - 0.5) * speedFactor
    this.velocities[i * 3 + 1] = (Math.random() - 0.5) * speedFactor
    this.velocities[i * 3 + 2] = (Math.random() - 0.5) * speedFactor
  }

  // Create geometry and material
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(this.positions, 3)
  )

  const material = new THREE.PointsMaterial({
    color: 0xff3131, // Lobster Red
    size: 0.03,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  this.points = new THREE.Points(geometry, material)
  this.scene.add(this.points)

  // Handle window resize
  this.onWindowResize = this.onWindowResize.bind(this)
  window.addEventListener('resize', this.onWindowResize)
}
```

### Updated animate() Method

```typescript
animate(time: number, deltaTime: number) {
  if (this.isDisposed || !this.isAnimating) {
    this.renderer.render(this.scene, this.camera)
    return
  }

  const positionsArr = this.points.geometry.attributes.position.array as Float32Array
  const currentTime = performance.now()
  const elapsed = currentTime - (this.emergenceStartTime || 0)
  const progress = Math.min(elapsed / (this.emergenceDuration || 3000), 1)

  // Emergence animation: particles rise from bottom
  if (progress < 1) {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3

      // Calculate emergence height (0 to 1)
      const startY = -5
      const targetY = this.originalPositions[i * 3 + 1]
      const emergenceY = startY + (targetY - startY) * progress

      positionsArr[i * 3] = this.originalPositions[i * 3]
      positionsArr[i * 3 + 1] = emergenceY
      positionsArr[i * 3 + 2] = this.originalPositions[i * 3 + 2]
    }
  } else {
    // Animation complete - particles settle into floating pattern
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      
      // Apply gentle drifting using stored velocities
      positionsArr[i3] = this.originalPositions[i3] + 
        this.velocities[i3] * (time * 10)  // Slow drift
      positionsArr[i3 + 1] = this.originalPositions[i3 + 1] + 
        this.velocities[i3 + 1] * (time * 10)
      positionsArr[i3 + 2] = this.originalPositions[i3 + 2] + 
        this.velocities[i3 + 2] * (time * 10)
    }

    this.isAnimating = false
    if (this.onCompleteCallback) {
      this.onCompleteCallback()
    }
  }

  this.points.geometry.attributes.position.needsUpdate = true

  // Subtle rotation
  this.points.rotation.y += 0.0015
  this.points.rotation.x += 0.0008

  this.renderer.render(this.scene, this.camera)
}
```

---

## File 4: Create SVG Icon Assets

**Path:** `lib/three/icons/` (NEW DIRECTORY)

Create these 6 SVG files. Each should be simple, flat, Laverdi-red themed (~24x24 viewBox).

### email.svg
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="4" width="20" height="16" rx="2" stroke="#ff3333" stroke-width="2"/>
  <path d="M2 6L12 14L22 6" stroke="#ff3333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### check.svg
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="#ff3333" stroke-width="2"/>
  <path d="M8 12L11 15L16 8" stroke="#ff3333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### gear.svg
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="3" stroke="#ff3333" stroke-width="2"/>
  <path d="M12 1V4M12 20V23M23 12H20M4 12H1M19.07 4.93L17.65 6.35M6.35 17.65L4.93 19.07M19.07 19.07L17.65 17.65M6.35 6.35L4.93 4.93" stroke="#ff3333" stroke-width="2" stroke-linecap="round"/>
</svg>
```

### document.svg
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V9L13 2Z" stroke="#ff3333" stroke-width="2" stroke-linejoin="round"/>
  <path d="M13 2V9H20" stroke="#ff3333" stroke-width="2" stroke-linejoin="round"/>
  <path d="M8 13H16M8 17H16" stroke="#ff3333" stroke-width="2" stroke-linecap="round"/>
</svg>
```

### link.svg
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 13C10.6 13.6 11.4 14 12.3 14H14.8C16.5 14 18 12.5 18 10.8C18 9.1 16.5 7.6 14.8 7.6H13" stroke="#ff3333" stroke-width="2" stroke-linecap="round"/>
  <path d="M14 11C13.4 10.4 12.6 10 11.7 10H9.2C7.5 10 6 11.5 6 13.2C6 14.9 7.5 16.4 9.2 16.4H10" stroke="#ff3333" stroke-width="2" stroke-linecap="round"/>
</svg>
```

### clock.svg
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="#ff3333" stroke-width="2"/>
  <path d="M12 6V12L16 14" stroke="#ff3333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

## File 5: Create Icon Texture Utility

**Path:** `lib/three/createIconTexture.ts` (NEW FILE)

```typescript
import * as THREE from 'three'
import emailSvg from './icons/email.svg'
import checkSvg from './icons/check.svg'
import gearSvg from './icons/gear.svg'
import documentSvg from './icons/document.svg'
import linkSvg from './icons/link.svg'
import clockSvg from './icons/clock.svg'

export type IconType = 'email' | 'check' | 'gear' | 'document' | 'link' | 'clock'

const ICON_SVGS: Record<IconType, string> = {
  email: emailSvg,
  check: checkSvg,
  gear: gearSvg,
  document: documentSvg,
  link: linkSvg,
  clock: clockSvg
}

/**
 * Create a canvas texture for all workflow icons
 * Returns a texture atlas with all icons stacked vertically
 */
export function createIconTexture(): THREE.Texture {
  const iconSize = 256
  const iconCount = 6
  
  const canvas = document.createElement('canvas')
  canvas.width = iconSize
  canvas.height = iconSize * iconCount
  
  const ctx = canvas.getContext('2d')!
  
  // Draw each icon at different Y positions
  const icons: IconType[] = ['email', 'check', 'gear', 'document', 'link', 'clock']
  
  icons.forEach((iconType, index) => {
    const svg = ICON_SVGS[iconType]
    const img = new Image()
    
    // Create blob URL from SVG data
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    img.onload = () => {
      const yOffset = index * iconSize
      
      // Draw background (optional: subtle circle)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.beginPath()
      ctx.arc(iconSize / 2, yOffset + iconSize / 2, iconSize / 3, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw icon
      ctx.drawImage(img, 0, yOffset, iconSize, iconSize)
      URL.revokeObjectURL(url)
    }
    
    img.src = url
  })
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  
  return texture
}

/**
 * Get the UV offset for a specific icon
 * Used to set material's texture offset for correct icon display
 */
export function getIconUVOffset(iconType: IconType): { u: number; v: number } {
  const icons: IconType[] = ['email', 'check', 'gear', 'document', 'link', 'clock']
  const index = icons.indexOf(iconType)
  
  return {
    u: 0,
    v: index / iconCount
  }
}
```

---

## Integration Checklist

- [ ] Update `MoltyCharacter.ts` with orientation constraint
  - [ ] Add `constrainOrientationToUpright()` method
  - [ ] Call in `animate()` each frame
  - [ ] Test: Molty stays upright during zoom

- [ ] Create `IconParticle.ts`
  - [ ] Define particle class
  - [ ] Color mapping for icon types
  - [ ] Update/bobbing animation

- [ ] Update `ParticleSystem.ts`
  - [ ] Reduce particleCount to 1250
  - [ ] Slow velocity to 0.004
  - [ ] Update animate loop

- [ ] Create icon SVG files
  - [ ] Add `lib/three/icons/` folder
  - [ ] Create 6 SVG files
  - [ ] Verify artwork looks good

- [ ] Create `createIconTexture.ts`
  - [ ] Texture atlas generator
  - [ ] UV offset utility

- [ ] Update component imports
  - [ ] Import new classes in components
  - [ ] Test in development
  - [ ] Verify animations smooth

- [ ] Performance testing
  - [ ] 60 FPS on desktop
  - [ ] 30+ FPS on mobile
  - [ ] No memory leaks after 5+ mins

---

## Testing Checklist

```javascript
// In browser console:

// Test 1: Check particle count reduced
console.log(particleSystem.particleCount) // Should be 1250

// Test 2: Check velocity is slower
console.log(particleSystem.velocities[0]) // Should be ~0.004 or less

// Test 3: Verify Molty stays upright during camera pan
// Manually rotate camera in component, observe Molty rotation

// Test 4: Check for TypeErrors
// Should see no errors in console related to IconParticle

// Test 5: FPS performance
// Open DevTools > Performance tab, record 10 seconds
// Should maintain 60 FPS on desktop
```

---

## Next Steps

1. **Apply code changes** to each file
2. **Test in development** with `npm run dev`
3. **Verify animations** look correct
4. **Check performance** with DevTools
5. **Proceed to Phase 3** (Landing Page Redesign)

---

**Completion Time:** ~2-3 hours  
**Status:** Ready to Implement  
**Next:** Phase 3 (Landing Page) once Phase 2 tested and merged
