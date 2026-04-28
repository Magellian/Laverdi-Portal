# Manual Testing Guide - Laverdi Portal

**Server:** http://localhost:3001  
**Status:** ✅ Dev server is running  

---

## 🎯 Quick Test Plan (15 minutes)

Open http://localhost:3001 and follow these steps:

### 1. Homepage & Navigation (2 min)
```
□ Homepage loads correctly
□ Logo visible
□ "Get Started" button works
□ Navigation menu visible
□ Footer loads
```

### 2. Signup Flow (3 min)
```
□ Go to /auth/signup
□ Form displays with email, password, confirm password fields
□ Click "Create Account" without entering data → errors show
□ Enter: test@example.com / testpass123 / testpass123
□ Click "Create Account"
□ Verify redirect to login with success message
```

### 3. Login Flow (2 min)
```
□ On login page, enter: test@example.com / testpass123
□ Click "Sign In"
□ Verify redirect to /dashboard
□ ⭐ IMPORTANT: Watch for Molty animation!
```

### 4. Molty Animation (4 min) ⭐ CRITICAL
**On first login, you should see:**

```
Stage 1 (0-1s): PULSE BACKGROUND
  □ Black background with red rotating torus rings
  □ Red point light creating atmosphere
  □ Smooth rotation animation
  
Stage 2 (1-1.5s): MOLTY APPEARS
  □ Red glowing torus knot appears in center
  □ Character rotates smoothly
  □ Emissive glow visible
  
Stage 3 (1.5-4.5s): PARTICLES EMERGE
  □ 2500 red particles rise from bottom
  □ Particles coalesce around Molty
  □ Additive blending creates glow effect
  □ Smooth physics-based animation
  
Stage 4 (4.5s+): FADE TO DASHBOARD
  □ Smooth fade-out of animation
  □ Main dashboard reveals beneath
```

**Check During Animation:**
- [ ] Smooth 60 FPS animation (no jank/stuttering)
- [ ] Red (#ff0000 / #ff3333) colors throughout
- [ ] "Skip ↓" button visible in bottom-right
- [ ] Welcome text with username visible
- [ ] No console errors (open F12)

### 5. Skip Button (1 min)
```
□ If animation still playing, click "Skip ↓"
□ Animation should disappear immediately
□ Dashboard should show
```

### 6. Dashboard Check (2 min)
```
□ Dashboard loads with user data
□ Current plan visible ("Starter" tier)
□ API key visible (masked)
□ Usage meter displayed
□ Instance status shown
□ All navigation links work
```

### 7. Sub-Pages (2 min)
```
□ Click "API Keys" link
  - New page loads
  - "Create New Key" button visible
  
□ Click "Settings" link
  - Profile info displays
  - Email, password fields visible
  
□ Click "Billing" link
  - Subscription info displays
  - Plan details visible
```

---

## 🔍 Detailed Molty Animation Test

### Visual Checklist

**Pulse Engine (Background):**
- [ ] 8 concentric rings rotating
- [ ] Red color (#ff0000)
- [ ] Different sizes (expanding)
- [ ] Varying opacity
- [ ] Central TorusKnot object
- [ ] Metallic material on center object

**Molty Character:**
- [ ] Torus knot geometry visible
- [ ] Red emissive material glowing
- [ ] Point light illuminating surroundings
- [ ] Smooth rotation (no pause)
- [ ] Glow intensity increases over time

**Particle System:**
- [ ] 2500 particles spawn
- [ ] Rise smoothly from bottom
- [ ] Move toward center (coalesce)
- [ ] Additive blending creates glow
- [ ] Physics looks natural (gravity, velocity)
- [ ] Particles don't flicker or pop

**Fade Transition:**
- [ ] Smooth opacity fade-out
- [ ] Dashboard content visible beneath
- [ ] No jarring cutoff
- [ ] Takes ~1 second

---

## 🎮 Interactive Tests

### Test localStorage (First-Load Detection)

**First Load (Animation plays):**
```
1. Open http://localhost:3001/dashboard
2. Verify WelcomeLanding shows
3. Animation plays
4. After complete, refresh page (Ctrl+R)
5. Dashboard shows IMMEDIATELY (no animation)
```

**Clear localStorage to Reset:**
```
1. Open DevTools (F12)
2. Go to Console
3. Paste: localStorage.removeItem('laverdi_seen_welcome')
4. Press Enter
5. Refresh page (Ctrl+R)
6. Animation plays again
```

### Test Skip Button

```
1. Clear localStorage (see above)
2. Refresh dashboard
3. Animation starts playing
4. Click "Skip ↓" button (bottom-right)
5. Animation stops immediately
6. Dashboard shows
```

### Test Responsive Design

**Desktop:**
```
Press F12 to open DevTools
Do NOT enable device mode yet
Verify:
  □ Animation fills full screen
  □ Text overlay centered
  □ Buttons visible and clickable
  □ No horizontal scroll
```

**Tablet (iPad):**
```
F12 → Device Toggle (Ctrl+Shift+M)
Select: iPad
Verify:
  □ Canvas scales to viewport
  □ Animation still smooth
  □ Touch interaction works
  □ Text readable
```

**Mobile (iPhone 12):**
```
F12 → Device Toggle
Select: iPhone 12
Verify:
  □ Canvas full-width
  □ Animation plays (may be 30 FPS on mobile, OK)
  □ Skip button touchable (48px min height)
  □ Text visible on small screen
```

---

## 🐛 Troubleshooting

### Animation Doesn't Play
```
Check:
1. Browser console (F12) for errors
2. localStorage flag (see above to reset)
3. WebGL support: http://get.webgl.org
4. Three.js import working (check Network tab)
```

### Animation Stutters (Janky)
```
Possible Causes:
- Browser running other heavy tasks
- GPU driver outdated
- Browser extension interfering
- Low system memory

Test:
1. Close other apps/tabs
2. Try incognito window
3. Try different browser (Chrome, Firefox, Safari)
```

### Molty Character Not Visible
```
Check:
1. Is background pulse visible? If yes, issue is character layer
2. Check console for Three.js errors
3. Verify "isEmerging" prop is working
4. Check glow intensity (should increase from 0.5 → 1)
```

### Particles Not Appearing
```
Check:
1. Is pulse + Molty visible? If yes, particle timing may be off
2. Verify stage transitions (pulse → molty → particles)
3. Check Console for geometry disposal errors
4. Verify additive blending is enabled
```

### Performance Issues (Low FPS)
```
Solutions:
1. Close DevTools while testing (DevTools impacts FPS)
2. Close other browser tabs
3. Reduce viewport size
4. Try different browser
5. Check GPU usage (Task Manager → GPU)
```

---

## 📊 Performance Checklist

**Use DevTools Performance Tab:**

```
1. Open DevTools (F12)
2. Go to "Performance" tab
3. Click record (red circle)
4. Reload page
5. Let animation play through
6. Stop recording

Check:
  □ Frame rate ≥ 55 FPS (target 60)
  □ No long tasks > 50ms
  □ GPU utilization reasonable
  □ Memory stable (no spikes)
```

---

## ✅ Sign-Off Criteria

**Animation is PASS if:**
- ✅ All 4 stages play smoothly (pulse → molty → particles → fade)
- ✅ 60 FPS or close (minimum 50 FPS acceptable)
- ✅ No console errors
- ✅ Red colors visible throughout
- ✅ Skip button works
- ✅ localStorage prevents repeat
- ✅ Responsive on mobile

**Portal is PASS if:**
- ✅ Signup → Login → Dashboard flow works
- ✅ Molty animation plays on first load
- ✅ All dashboard pages load
- ✅ API keys page works
- ✅ Settings page works
- ✅ Billing page works
- ✅ No console errors on any page

---

## 📝 Test Results

**Date:** _______________  
**Tester:** _______________

| Test | Result | Notes |
|------|--------|-------|
| Signup | □ PASS □ FAIL | |
| Login | □ PASS □ FAIL | |
| Molty Animation | □ PASS □ FAIL | |
| Skip Button | □ PASS □ FAIL | |
| Dashboard | □ PASS □ FAIL | |
| API Keys | □ PASS □ FAIL | |
| Settings | □ PASS □ FAIL | |
| Billing | □ PASS □ FAIL | |
| Responsive | □ PASS □ FAIL | |
| Performance | □ PASS □ FAIL | |
| Console Errors | □ NONE □ SOME | |

---

## 🚀 Ready to Deploy?

**Deploy ONLY if:**
- ✅ All tests PASS
- ✅ No console errors
- ✅ Molty animation smooth
- ✅ Tested on mobile/tablet
- ✅ Signup/login flow works
- ✅ Dashboard loads correctly

---

## 📞 Contact

**Server:** http://localhost:3001  
**Build Status:** ✅ Successful  
**Dev Time:** 3.3 seconds startup  

If issues arise, check TESTING_CHECKLIST.md for detailed test procedures.

