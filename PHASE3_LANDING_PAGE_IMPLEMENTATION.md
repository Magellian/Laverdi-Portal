# PHASE 3: LANDING PAGE REDESIGN - IMPLEMENTATION GUIDE

**Status:** READY TO EXECUTE  
**Estimated Time:** 3-4 hours  
**Priority:** HIGH (Conversion optimization, marketing)  
**Date:** 2026-04-18 PM

---

## OVERVIEW

Complete redesign of landing page with new messaging and layout based on APPROVED SPECS:

**Brand Colors:**
- Primary: #0EA5E9 (Teal) - CTAs, highlights
- Accent: #FF6B35 (Warm Orange) - Secondary CTAs, icons
- Background: #F8FAFC (Light Slate)
- Text: #1E293B (Dark Slate)
- Borders: #E2E8F0 (Light Gray)

**Typography:**
- Font: Inter (all sizes)
- Headlines: Bold, 36-48px
- Subheadlines: Regular, 18-24px
- Body: Regular, 14-16px
- Small: Regular, 12-14px

**Messaging:**
- Hero: "Automate without code. No setup required."
- Subheadline: "Talk to Molty. Watch automation happen."
- Trial: "🎉 Free 2-week trial • No credit card • Cancel anytime"

---

## DELIVERABLES

- [ ] Updated `pages/index.tsx` (complete rewrite)
- [ ] Tailwind CSS styling (responsive)
- [ ] 10 page sections fully implemented
- [ ] Mobile responsive (375px, 768px tested)
- [ ] All CTAs functional
- [ ] Hero animation integrated
- [ ] Performance optimized (<2 seconds load)

---

## STRUCTURE OVERVIEW

### Page Sections (in order)

1. **Header/Navigation**
2. **Hero Section** (with Molty)
3. **Trial Banner**
4. **How It Works** (3 columns)
5. **Why Choose Laverdi** (4 feature cards)
6. **Pricing** (3-4 tiers)
7. **Quickstart Guide** (3 steps)
8. **Community Section**
9. **Security & Trust**
10. **Footer CTA**

---

## PART A: Update pages/index.tsx

**File:** `pages/index.tsx`

Create complete new landing page:

```typescript
import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { WelcomeLanding } from '@/components/WelcomeLanding'

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro' | 'enterprise'>('free')

  return (
    <>
      <Head>
        <title>Laverdi - Automate Without Code</title>
        <meta name="description" content="Talk to Molty. Watch automation happen. No code, no setup." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* SECTION 1: HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="font-bold text-lg text-slate-900">Laverdi</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition">
              Features
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition">
              Pricing
            </a>
            <a href="#community" className="text-slate-600 hover:text-slate-900 transition">
              Community
            </a>
            <a href="#" className="text-slate-600 hover:text-slate-900 transition">
              Docs
            </a>
          </div>

          {/* Sign Up Button */}
          <Link
            href="/auth/signup"
            className="px-6 py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* SECTION 2: HERO SECTION */}
      <section className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="flex flex-col justify-center">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Automate without code.
                <br />
                <span className="text-teal-500">No setup required.</span>
              </h1>

              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Talk to Molty. Watch automation happen.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/auth/signup?trial=true"
                  className="px-8 py-4 bg-teal-500 text-white rounded-lg font-bold text-lg hover:bg-teal-600 transition transform hover:scale-105 text-center"
                >
                  Start Free Trial
                </Link>
                <button
                  onClick={() => {
                    // Placeholder for video modal
                    alert('Video: See It In Action (placeholder)')
                  }}
                  className="px-8 py-4 border-2 border-teal-500 text-teal-500 rounded-lg font-bold text-lg hover:bg-teal-50 transition text-center"
                >
                  See It In Action
                </button>
              </div>

              {/* Trial Badge */}
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <span className="text-lg">🎉</span> Free 2-week trial • No credit card • Cancel anytime
              </p>
            </div>

            {/* Right: Molty Animation */}
            <div className="hidden lg:block h-[500px] rounded-2xl overflow-hidden bg-black">
              <WelcomeLanding />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TRIAL BANNER */}
      <section className="bg-teal-50 border-y border-teal-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-teal-900 text-lg font-semibold">
            🎉 Free 2-week trial • No credit card • Cancel anytime
          </p>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Tell Molty</h3>
              <p className="text-slate-600">Describe what you want automated. Simple conversation.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">It Happens</h3>
              <p className="text-slate-600">Molty executes your task on your infrastructure.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Done</h3>
              <p className="text-slate-600">Your automation is live. It runs on schedule.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: WHY CHOOSE LAVERDI */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">Why Choose Laverdi?</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1: Your VPS, Your Data */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Your VPS, Your Data</h3>
              <p className="text-slate-600">
                Everything runs on your infrastructure. Your data stays yours. No vendor lock-in.
              </p>
            </div>

            {/* Card 2: No Coding */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">No Coding</h3>
              <p className="text-slate-600">
                Just talk. No technical skills needed. Anyone can automate.
              </p>
            </div>

            {/* Card 3: Community-Driven */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Community-Driven</h3>
              <p className="text-slate-600">
                Built by & for automation enthusiasts. Share recipes. Learn together.
              </p>
            </div>

            {/* Card 4: Instant Setup */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Setup</h3>
              <p className="text-slate-600">
                Live in minutes, not hours. Connect your services. Start automating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: PRICING */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-slate-600 mb-16">
            Start free. Upgrade only when you scale.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {/* FREE TIER */}
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <p className="text-slate-600 mb-6">Always free</p>

              <div className="mb-6">
                <p className="text-slate-600 text-sm">Features:</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 50 API calls/day
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 2 projects
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Community support
                  </li>
                </ul>
              </div>

              <Link
                href="/auth/signup"
                className="w-full py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition text-center block"
              >
                Get Started
              </Link>
            </div>

            {/* STARTER - MOST POPULAR */}
            <div className="bg-white p-8 rounded-xl border-2 border-teal-500 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-600 mb-2">$29/month</p>
              <p className="text-slate-600 text-sm mb-6">2-week free trial</p>

              <div className="mb-6">
                <p className="text-slate-600 text-sm">Features:</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 2,000 API calls/day
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 10 projects
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Email support (24h)
                  </li>
                </ul>
              </div>

              <Link
                href="/auth/signup?trial=true"
                className="w-full py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition text-center block"
              >
                Start Free Trial
              </Link>
            </div>

            {/* PRO */}
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
              <p className="text-slate-600 mb-2">$99/month</p>
              <p className="text-slate-600 text-sm mb-6">2-week free trial</p>

              <div className="mb-6">
                <p className="text-slate-600 text-sm">Features:</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 20,000 API calls/day
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 50 projects
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Priority email (4h)
                  </li>
                </ul>
              </div>

              <Link
                href="/auth/signup?trial=true"
                className="w-full py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition text-center block"
              >
                Start Free Trial
              </Link>
            </div>

            {/* ENTERPRISE */}
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-600 mb-2">Custom pricing</p>
              <p className="text-slate-600 text-sm mb-6">Talk to us</p>

              <div className="mb-6">
                <p className="text-slate-600 text-sm">Features:</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Unlimited calls
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Unlimited projects
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Phone + Slack support
                  </li>
                </ul>
              </div>

              <button className="w-full py-2 border-2 border-slate-900 text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: QUICKSTART */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">
            Live in 5 Minutes
          </h2>
          <p className="text-center text-slate-600 mb-16">
            Three simple steps to your first automation.
          </p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-teal-500 text-white font-bold text-lg">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Sign Up (30 seconds)</h3>
                <p className="text-slate-600">
                  Create account with email/password. No credit card required.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-teal-500 text-white font-bold text-lg">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Talk to Molty (1 minute)</h3>
                <p className="text-slate-600">
                  Open dashboard. Chat: "Send me a summary email every morning"
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-teal-500 text-white font-bold text-lg">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Done! (3 minutes)</h3>
                <p className="text-slate-600">
                  Automation is live. Molty executes on schedule. You're automating!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: COMMUNITY */}
      <section id="community" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Join the Builders</h2>
          <p className="text-lg text-slate-600 mb-12">
            Built by people who love automation
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <a
              href="#"
              className="flex items-center gap-3 px-6 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <span className="text-2xl">🐦</span>
              <span className="font-semibold text-slate-900">Twitter</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-6 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <span className="text-2xl">💬</span>
              <span className="font-semibold text-slate-900">Discord</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-6 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <span className="text-2xl">🐙</span>
              <span className="font-semibold text-slate-900">GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 9: SECURITY & TRUST */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
            Security & Privacy
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Your Data on Your VPS</h3>
              <p className="text-slate-600">
                Everything runs on your infrastructure. We never see your data.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">👁️</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">No Tracking</h3>
              <p className="text-slate-600">
                No analytics. No ads. No behavioral tracking. Just you & Molty.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💻</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Open Source</h3>
              <p className="text-slate-600">
                Core components open source where it matters. Full transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FOOTER CTA */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Automate?</h2>
          <p className="text-xl text-teal-50 mb-10">
            Join thousands of builders automating their workflows.
          </p>

          <Link
            href="/auth/signup?trial=true"
            className="inline-block px-10 py-4 bg-white text-teal-600 rounded-lg font-bold text-lg hover:bg-teal-50 transition transform hover:scale-105"
          >
            Start Free Trial
          </Link>

          <p className="mt-6 text-teal-100 text-sm">
            🎉 No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Discord</a></li>
                <li><a href="#" className="hover:text-white transition">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>© 2026 Laverdi. All rights reserved. Your VPS, Your Data.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
```

---

## PART B: TAILWIND CONFIGURATION

Ensure `tailwind.config.js` includes these colors:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfa',
          500: '#0ea5e9',
          600: '#0d9488',
          700: '#0f766e',
        },
        orange: {
          500: '#ff6b35',
          600: '#ff5722',
        },
        slate: {
          50: '#f8fafc',
          900: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

---

## PART C: RESPONSIVE DESIGN

### Mobile Breakpoints

**Mobile (375px):**
```css
@media (max-width: 640px) {
  /* Hero */
  h1 { font-size: 2rem; }
  
  /* Stack sections */
  .grid { grid-template-columns: 1fr; }
  
  /* Reduce padding */
  section { padding: 1rem; }
  
  /* Hide desktop elements */
  .hidden-mobile { display: none; }
}
```

**Tablet (768px):**
```css
@media (max-width: 768px) {
  h1 { font-size: 2.5rem; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

## TESTING CHECKLIST

- [ ] Hero section loads and displays correctly
- [ ] Molty animation integrated and visible
- [ ] All CTAs functional and route correctly
- [ ] Pricing cards display correctly
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] Navigation sticky and functional
- [ ] Images load efficiently
- [ ] No console errors
- [ ] Page loads in <2 seconds (lighthouse test)
- [ ] Trial message clear (2 weeks, no CC, cancel anytime)
- [ ] All external links work

---

## PERFORMANCE TARGETS

- **Load time:** <2 seconds
- **Lighthouse score:** 90+
- **Responsive:** Mobile, tablet, desktop
- **Accessibility:** WCAG AA compliant
- **SEO:** Meta tags, Open Graph

---

## ROLLBACK PLAN

If something breaks:

```bash
# Revert landing page
git checkout pages/index.tsx

# Restart dev server
npm run dev
```

---

## SUCCESS CRITERIA

✅ **Phase 3 Complete When:**
1. New hero section with text + CTAs visible
2. All 10 page sections present and styled
3. Mobile responsive (tested at 375px, 768px)
4. Copy updated with new messaging
5. CTAs route to correct pages (signup, trial, etc.)
6. Molty animation integrated into hero
7. Performance: <2s load time
8. No console errors
9. Pricing tiers display correctly
10. Trial messaging clear (2 weeks, no CC)

---

## NEXT STEPS

Once Phase 3 complete:
1. Test all flows end-to-end
2. Check mobile responsiveness
3. Verify signup flow works
4. Commit to git
5. Move to Phase 4: Full QA Testing

---

**Status:** READY FOR IMPLEMENTATION  
**Time:** ~3-4 hours  
**Blockers:** None  
**Risk Level:** LOW (cosmetic changes)
