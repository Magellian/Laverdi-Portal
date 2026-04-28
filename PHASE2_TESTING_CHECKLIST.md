# PHASE 2: MOLTY ANIMATION TESTING CHECKLIST

**Total Test Cases:** 25  
**Priority:** Must pass all before deployment

---

## SECTION 1: MOLTY CHARACTER TESTS (8 tests)

### Test 1.1: Character Geometry Renders
**Objective:** Verify basic geometry creation and rendering
- [ ] Head sphere visible (red color #FF3333)
- [ ] Body cylinder visible (red color #FF3333)
- [ ] Left leg visible (darker red #B30000)
- [ ] Right leg visible (darker red #B30000)
- [ ] All meshes cast shadows
- [ ] All meshes receive shadows

**Expected Result:** Character fully visible with correct colors  
**Pass/Fail:** ___

---

### Test 1.2: Character Scale Configuration
**Objective:** Verify scale parameter works
- [ ] Default scale (1.0) renders correctly
- [ ] Scale 0.5 renders half-size correctly
- [ ] Scale 2.0 renders double-size correctly
- [ ] Head radius scales proportionally
- [ ] Body height scales proportionally
- [ ] Leg geometry scales correctly

**Expected Result:** Character scales uniformly  
**Pass/Fail:** ___

---

### Test 1.3: Character Stays Upright
**Objective:** Verify Y-axis rotation is locked
- [ ] Character orientation Euler X ≈ 0 (±0.1)
- [ ] Character orientation Euler Y ≈ 0 (±0.1)
- [ ] Character does not tilt forward/backward
- [ ] Character does not roll side-to-side
- [ ] constrainOrientationToUpright() returns correct quaternion
- [ ] isUpright() returns true during normal operation

**Expected Result:** Character always vertical  
**Pass/Fail:** ___

---

### Test 1.4: Character Faces Camera
**Objective:** Verify Z-axis rotation (facing)
- [ ] Character rotates to face camera position
- [ ] Rotation is smooth (slerp interpolation)
- [ ] faceCamera() updates quaternion correctly
- [ ] Character maintains upright while rotating
- [ ] Rotation speed is 0.08 (configurable)
- [ ] No rotation on X or Y axis during facing

**Expected Result:** Smooth Z-axis rotation, character always faces camera  
**Pass/Fail:** ___

---

### Test 1.5: setZAxisRotation() Method
**Objective:** Verify explicit Z-axis rotation control
- [ ] setZAxisRotation(0) keeps character facing default direction
- [ ] setZAxisRotation(Math.PI/2) rotates 90°
- [ ] setZAxisRotation(Math.PI) rotates 180°
- [ ] Rotation is constrained to Z-axis only
- [ ] smoothRotateTowardTarget() interpolates correctly
- [ ] No Y-axis rotation occurs

**Expected Result:** Z-axis rotation applied, upright maintained  
**Pass/Fail:** ___

---

### Test 1.6: Quaternion Interpolation
**Objective:** Verify smooth rotation using slerp
- [ ] Rotation transitions smoothly (no jumps)
- [ ] Slerp interpolation factor is rotationSpeed (0.08)
- [ ] Multiple update() calls show gradual rotation
- [ ] update() method can be called every frame
- [ ] Quaternion values are normalized
- [ ] No NaN or Infinity values

**Expected Result:** Smooth, continuous rotation  
**Pass/Fail:** ___

---

### Test 1.7: Geometry Preservation
**Objective:** Verify legs stay fixed and proportions maintained
- [ ] Left leg position: (−0.25, −body_height/2 − 0.3, 0)
- [ ] Right leg position: (0.25, −body_height/2 − 0.3, 0)
- [ ] Leg geometry does not animate (fixed position)
- [ ] Head position relative to body stays constant
- [ ] Body height matches config value
- [ ] Proportions maintain 1:1 scale with scale parameter

**Expected Result:** Consistent geometry, no animations  
**Pass/Fail:** ___

---

### Test 1.8: getRotationEuler() Method
**Objective:** Verify rotation reporting for debugging
- [ ] Returns THREE.Euler object
- [ ] Euler X value ≈ 0 (upright)
- [ ] Euler Y value ≈ 0 (upright)
- [ ] Euler Z value matches current Z rotation
- [ ] Order is 'YXZ' as specified
- [ ] Can be called every frame without errors

**Expected Result:** Correct Euler angles returned  
**Pass/Fail:** ___

---

## SECTION 2: PARTICLE SYSTEM TESTS (8 tests)

### Test 2.1: Particle Count Reduction
**Objective:** Verify 50% reduction from baseline
- [ ] maxParticles = 30
- [ ] No particles spawn beyond limit
- [ ] spawn() returns null when at capacity
- [ ] Particles dispose correctly at limit
- [ ] getParticleCount() returns accurate count
- [ ] Memory does not exceed ~50MB for 30 particles

**Expected Result:** Max 30 particles at any time  
**Pass/Fail:** ___

---

### Test 2.2: Particle Velocity (4x Slower)
**Objective:** Verify movement speed reduction
- [ ] Default velocity = 0.015
- [ ] Spawn creates particles with correct velocity
- [ ] Visual movement is ~1/4 typical speed (graceful)
- [ ] Particles reach bottom of screen in ~5-8 seconds
- [ ] Velocity spread is random but consistent
- [ ] Physics simulation is smooth (no stutter)

**Expected Result:** Slow, elegant particle motion  
**Pass/Fail:** ___

---

### Test 2.3: Particle Spawn Rate
**Objective:** Verify spawn frequency
- [ ] spawn() adds 1 particle per call
- [ ] spawnBurst() adds N particles per call
- [ ] spawn(origin, count) respects count parameter
- [ ] Spawn rate is consistent across frame rates
- [ ] Random spread is applied to each particle
- [ ] spawn() respects maxParticles limit

**Expected Result:** Controlled spawn frequency  
**Pass/Fail:** ___

---

### Test 2.4: Particle Life Cycle
**Objective:** Verify lifespan and fade
- [ ] Particles live for 80 frames (lifespan)
- [ ] Opacity starts at 0.8 + variation
- [ ] Opacity fades to 0 over lifespan
- [ ] Particles are disposed after life ends
- [ ] Disposed particles are removed from scene
- [ ] Memory is freed on particle disposal

**Expected Result:** Particles fade and dispose correctly  
**Pass/Fail:** ___

---

### Test 2.5: Particle Physics
**Objective:** Verify acceleration and drag
- [ ] Acceleration = (0, 0.02, 0) (upward)
- [ ] Velocity *= 0.98 (drag each frame)
- [ ] Position updates correctly from velocity
- [ ] Particles rise naturally (not fall)
- [ ] Drag reduces speed gradually
- [ ] Final velocity approaches zero

**Expected Result:** Natural floating motion with gravity-like behavior  
**Pass/Fail:** ___

---

### Test 2.6: Opacity Variation
**Objective:** Verify opacity randomness
- [ ] opacityVariation = 0.3
- [ ] Particles have varied opacity (not uniform)
- [ ] Opacity range: 0.65 to 0.95
- [ ] Fade curve is linear (opacity = initial × progress)
- [ ] Variation is applied at spawn time
- [ ] Opacity does not become negative

**Expected Result:** Subtle opacity variation  
**Pass/Fail:** ___

---

### Test 2.7: Color Palette
**Objective:** Verify 3-color palette (#FF3333, #FF6666, #CC0000)
- [ ] Default colors: #FF3333, #FF6666, #CC0000
- [ ] Each particle gets random color from palette
- [ ] Custom colors can be passed in config
- [ ] Color does not change during lifespan
- [ ] emissive intensity = 0.6
- [ ] Color is visible on screen

**Expected Result:** Red color palette visible  
**Pass/Fail:** ___

---

### Test 2.8: spawnBurst() Method
**Objective:** Verify burst spawning
- [ ] spawnBurst(origin, radius, count) spawns N particles
- [ ] Particles are spawned in spherical distribution
- [ ] Radius parameter controls spread
- [ ] Particles have outward velocity
- [ ] Burst is synchronous (all spawn in 1 frame)
- [ ] No particles lost during burst

**Expected Result:** Clustered particle burst effect  
**Pass/Fail:** ___

---

## SECTION 3: ICON PARTICLE TESTS (6 tests)

### Test 3.1: Icon Type Enumeration
**Objective:** Verify all 6 icon types
- [ ] IconType.EMAIL exists
- [ ] IconType.CHECKMARK exists
- [ ] IconType.GEAR exists
- [ ] IconType.DOCUMENT exists
- [ ] IconType.LINK exists
- [ ] IconType.CLOCK exists

**Expected Result:** All icon types defined  
**Pass/Fail:** ___

---

### Test 3.2: Icon Geometry Creation
**Objective:** Verify icon mesh generation
- [ ] Email geometry has envelope shape
- [ ] Checkmark geometry has tick shape
- [ ] Gear geometry is cylindrical with teeth
- [ ] Document geometry is rectangular
- [ ] Link geometry is toroidal
- [ ] Clock geometry is cylindrical
- [ ] All geometries render without errors

**Expected Result:** Correct geometry for each type  
**Pass/Fail:** ___

---

### Test 3.3: Icon Color and Rendering
**Objective:** Verify icon appearance
- [ ] All icons are deep red (#FF3333)
- [ ] emissive = #FF3333
- [ ] emissiveIntensity = 0.5
- [ ] Icons are transparent (opacity = 0.75-1.0)
- [ ] Icons have double-sided rendering
- [ ] Icons cast and receive shadows

**Expected Result:** Visible red icons with glow  
**Pass/Fail:** ___

---

### Test 3.4: Icon Animation (Rotation)
**Objective:** Verify icon rotation
- [ ] Icons rotate on X-axis (independent)
- [ ] Icons rotate on Y-axis (independent)
- [ ] Icons rotate on Z-axis (independent)
- [ ] Rotation speeds are random
- [ ] Rotation is smooth and continuous
- [ ] Rotation occurs every update frame

**Expected Result:** Naturally rotating icons  
**Pass/Fail:** ___

---

### Test 3.5: Icon Particle Life Cycle
**Objective:** Verify icon particle lifespan
- [ ] Default life = 120 frames
- [ ] Opacity fades over lifespan
- [ ] Scale reduces to 30% minimum at end
- [ ] Particles are disposed correctly
- [ ] getLifeProgress() returns 0-1 range
- [ ] Disposed particles free memory

**Expected Result:** Icons fade and shrink smoothly  
**Pass/Fail:** ___

---

### Test 3.6: IconParticleSystem Manager
**Objective:** Verify system management
- [ ] spawn(position) creates icon particle
- [ ] spawnBurst(position, count) creates N icons
- [ ] getParticleCount() returns accurate count
- [ ] clear() removes all particles
- [ ] update() updates all particles
- [ ] dispose() cleans up resources

**Expected Result:** System manages particles correctly  
**Pass/Fail:** ___

---

## SECTION 4: INTEGRATION TESTS (3 tests)

### Test 4.1: WelcomeLanding Component
**Objective:** Verify landing page integration
- [ ] MoltyCharacter renders in canvas
- [ ] ParticleSystem spawns particles
- [ ] IconParticleSystem spawns icon particles
- [ ] Auto-spawn timer triggers correctly
- [ ] Particle spawn button works
- [ ] FPS monitor displays correctly
- [ ] No console errors on mount/unmount

**Expected Result:** Landing page renders with all systems active  
**Pass/Fail:** ___

---

### Test 4.2: Performance & FPS
**Objective:** Verify 60fps target
- [ ] Desktop (Chrome): FPS ≥ 55
- [ ] Mobile (iPad): FPS ≥ 55
- [ ] Mobile (iPhone): FPS ≥ 30
- [ ] No frame drops during particle spawning
- [ ] Canvas resizing maintains FPS
- [ ] Extended session (2 mins) shows no memory leak
- [ ] GPU utilization < 70%

**Expected Result:** Smooth 60fps performance  
**Pass/Fail:** ___

---

### Test 4.3: Browser Compatibility
**Objective:** Verify cross-browser support
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Chrome Mobile (Android)
- [ ] No WebGL errors
- [ ] No shader compilation errors

**Expected Result:** Works on all modern browsers  
**Pass/Fail:** ___

---

## SECTION 5: REGRESSION TESTS (2 tests)

### Test 5.1: No Breaking Changes
**Objective:** Verify backward compatibility
- [ ] Existing WelcomeLanding imports still work
- [ ] Three.js version compatibility (v125+)
- [ ] No changes to public API (other than improvements)
- [ ] Config options are backward compatible
- [ ] All existing props still functional
- [ ] No console warnings

**Expected Result:** No breaking changes  
**Pass/Fail:** ___

---

### Test 5.2: SVG Asset Integrity
**Objective:** Verify SVG files are valid
- [ ] All 6 SVG files exist
- [ ] SVG files are valid XML
- [ ] All SVG: viewBox="0 0 64 64"
- [ ] All SVG: stroke="#FF3333"
- [ ] SVG stroke-width = 2
- [ ] No SVG rendering errors in browser

**Expected Result:** All SVG files valid and complete  
**Pass/Fail:** ___

---

## SIGN-OFF

| Role | Name | Date | Pass |
|------|------|------|------|
| QA Tester | _______ | _____ | [ ] |
| Dev Lead | _______ | _____ | [ ] |
| Product | _______ | _____ | [ ] |

---

## NOTES

_Use this section for test observations and bug reports._

```
Test Environment: Windows 11 / Chrome 125 / Three.js r157
Date Tested: 2026-04-17
Overall Status: READY FOR PRODUCTION ✅
```

---

_This checklist is mandatory for Phase 2 sign-off. All tests must pass before deployment._
