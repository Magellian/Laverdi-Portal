/**
 * pages/index.tsx
 * Laverdi Landing Page — AI Assistant VPS Edition
 *
 * DESIGN SPECIFICATIONS:
 * - Brand Colors: Deep Red (#DC2626 / red-600) + Black (#1A1A1A) + White (#FFFFFF)
 * - Font: Inter (all sizes)
 * - Mobile-First Responsive (375px - 1440px)
 * - All 10 sections fully implemented
 * - Hero with Molty animation integration (visible on all screen sizes)
 *
 * SECTIONS:
 * 1. Header (logo + nav + CTA)
 * 2. Hero (headline + subheadline + Molty + CTAs)
 * 3. Trial banner (notification style)
 * 4. How-it-works (3-column flow)
 * 5. Why-laverdi (4 feature cards)
 * 6. Pricing (3 tiers)
 * 7. Quickstart (5-step timeline)
 * 8. Community (social links)
 * 9. Security (3 trust points)
 * 10. CTA footer
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  CheckCircle,
  Settings,
  FileText,
  Link as LinkIcon,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Lock,
  Code,
  Server,
  Smartphone,
  Star,
} from 'lucide-react';
import { Molty2D } from '../components/Molty2D';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ============================================
          1. HEADER & NAVIGATION
          ============================================ */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-bold text-black hidden sm:inline">
                  LaVerdi
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#how-it-works"
                className="text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                How It Works
              </Link>
              <Link
                href="#pricing"
                className="text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                Pricing
              </Link>
              <Link
                href="#why-laverdi"
                className="text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                Why LaVerdi
              </Link>
              <Link
                href="#community"
                className="text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                Community
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="hidden sm:inline-block px-4 py-2 text-gray-700 font-semibold hover:text-red-600 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="hidden sm:inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
              >
                Start Free Trial
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100">
              <nav className="flex flex-col gap-4 py-4">
                <Link
                  href="#how-it-works"
                  className="text-gray-700 hover:text-red-600 transition-colors font-medium px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  href="#pricing"
                  className="text-gray-700 hover:text-red-600 transition-colors font-medium px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="#why-laverdi"
                  className="text-gray-700 hover:text-red-600 transition-colors font-medium px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Why LaVerdi
                </Link>
                <Link
                  href="#community"
                  className="text-gray-700 hover:text-red-600 transition-colors font-medium px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Community
                </Link>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-700 font-semibold hover:text-red-600 transition-colors duration-200 text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 text-center"
                >
                  Start Free Trial
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* ============================================
          2. HERO SECTION
          ============================================ */}
      <section className="relative py-12 md:py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-gray-50 -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6 md:space-y-8">
              <div className="inline-block px-4 py-2 bg-red-100 rounded-full">
                <span className="text-red-600 font-semibold text-sm">
                  🦞 Powered by OpenClaw — Open Source AI
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight">
                Your Own AI Assistant. Set Up. Secure. Running 24/7.
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
                Get a personal OpenClaw AI assistant deployed on its own Virtual Private Server.
                It manages your email, calendar, files, and more — all while keeping your data
                completely private.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/auth/signup"
                  className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-8 py-4 border-2 border-black text-black rounded-lg font-bold text-lg hover:bg-black hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                >
                  See How It Works
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Your own private server</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>No credit card needed</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Visual (Molty 2D Animation) — visible on all screen sizes */}
            <div className="relative flex items-center justify-center h-[500px] w-full">
              <Molty2D />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          3. TRIAL BANNER
          ============================================ */}
      <section className="py-6 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-red-400 flex-shrink-0" />
              <p className="font-bold text-lg">
                14-Day Free Trial • Your Own VPS • No Credit Card Required
              </p>
            </div>
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 whitespace-nowrap"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          4. HOW IT WORKS (3-Column)
          ============================================ */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From signup to your personal AI assistant running in minutes — no technical skills required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {/* Step 1 */}
            <div className="relative bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-2xl p-8">
              <div className="absolute top-0 left-8 -translate-y-1/2 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div className="mt-6 space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-black">Sign Up in Seconds</h3>
                <p className="text-gray-600">
                  Create your account with just an email. No credit card, no complicated setup.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-2xl p-8">
              <div className="absolute top-0 left-8 -translate-y-1/2 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div className="mt-6 space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-black">We Deploy Your AI</h3>
                <p className="text-gray-600">
                  In under 2 minutes, your personal AI assistant is running on its own secure Virtual Private Server.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-2xl p-8">
              <div className="absolute top-0 left-8 -translate-y-1/2 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div className="mt-6 space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-black">Start Automating</h3>
                <p className="text-gray-600">
                  Chat with your AI from any device. Connect your email, calendar, and apps. Let it handle the busy work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          5. WHY LAVERDI (4 Feature Cards)
          ============================================ */}
      <section id="why-laverdi" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Why LaVerdi?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your AI assistant, on your terms — private, powerful, and beginner-friendly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Server className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Your Own Private Server</h3>
              <p className="text-gray-600 leading-relaxed">
                Your AI runs on a dedicated VPS. Your data never touches shared infrastructure. Full privacy, full control.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Built for Beginners</h3>
              <p className="text-gray-600 leading-relaxed">
                No coding, no terminal, no tech skills needed. Sign up, and your AI is ready. We handle all the technical setup.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Automate Everything</h3>
              <p className="text-gray-600 leading-relaxed">
                Email management, calendar scheduling, file organization, social media — your AI assistant handles it all, 24/7.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Open Source &amp; Transparent</h3>
              <p className="text-gray-600 leading-relaxed">
                Built on OpenClaw, the leading open-source AI assistant platform. No black boxes, no vendor lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          6. PRICING (3 Tiers)
          ============================================ */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start free. Upgrade when you're ready. Your VPS is always included.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Trial */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-black mb-2">Free Trial</h3>
              <p className="text-gray-600 mb-6">14 days to explore everything</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-black">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <Link
                href="/auth/signup"
                className="w-full px-6 py-3 border-2 border-black text-black rounded-lg font-bold hover:bg-black hover:text-white transition-colors duration-200 text-center block mb-8"
              >
                Start Free Trial
              </Link>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">14-day trial</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Haiku 4.5 AI model</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">50K tokens/day</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Your own VPS</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Web chat + mobile apps</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Email &amp; chat support</span>
                </li>
              </ul>
            </div>

            {/* Starter (Featured) */}
            <div className="bg-black text-white rounded-2xl p-8 relative transform md:scale-105 md:-my-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 px-4 py-1 rounded-full">
                <span className="font-bold text-sm">Most Popular</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-300 mb-6">For individuals and small teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Link
                href="/auth/signup"
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors duration-200 text-center block mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Sonnet 4.6 AI model</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>500K tokens/day</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Your own VPS</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>WhatsApp, Telegram, Signal, Discord, Slack</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Custom automations</span>
                </li>
              </ul>
            </div>

            {/* Professional */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-black mb-2">Professional</h3>
              <p className="text-gray-600 mb-6">For power users and businesses</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-black">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <Link
                href="/auth/signup"
                className="w-full px-6 py-3 border-2 border-black text-black rounded-lg font-bold hover:bg-black hover:text-white transition-colors duration-200 text-center block mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Opus 4.6 AI model (most powerful)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">2M tokens/day</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Your own VPS</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">All platforms + API access</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Dedicated support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Advanced integrations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          7. QUICKSTART (5-Step Timeline)
          ============================================ */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Up and Running in Minutes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Five simple steps to your own personal AI assistant — no tech skills needed.
            </p>
          </div>

          <div className="relative max-w-2xl mx-auto">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600 to-red-300" />

            <div className="space-y-8 md:space-y-12">
              {/* Step 1 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-bold relative z-10">
                    1
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-black mb-2">Create Your Account</h3>
                  <p className="text-gray-600">
                    Sign up with email. Verified in seconds. No credit card needed.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-bold relative z-10">
                    2
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-black mb-2">Your AI Deploys Automatically</h3>
                  <p className="text-gray-600">
                    We provision your private server and install your AI assistant. Takes about 2 minutes.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-bold relative z-10">
                    3
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-black mb-2">Open Your Dashboard</h3>
                  <p className="text-gray-600">
                    Access your AI through our web interface, or download the mobile app.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-bold relative z-10">
                    4
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-black mb-2">Connect Your Apps</h3>
                  <p className="text-gray-600">
                    Link your email, calendar, Google Drive, and messaging apps. Your AI learns how to help.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-bold relative z-10">
                    5
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-black mb-2">Sit Back &amp; Automate</h3>
                  <p className="text-gray-600">
                    Your AI handles emails, schedules meetings, organizes files, and more. You focus on what matters.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors duration-200"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          8. COMMUNITY (Social Links)
          ============================================ */}
      <section id="community" className="py-16 md:py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Join the OpenClaw Community
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Thousands of users automating their lives with OpenClaw. Come hang out, ask questions,
              and help shape the future of personal AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {/* Discord */}
            <a
              href="https://discord.gg/clawd"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-900 hover:bg-red-600 rounded-2xl transition-colors duration-200 text-center"
            >
              <span className="text-3xl">💬</span>
              <span className="font-semibold text-lg">Discord</span>
              <span className="text-sm text-gray-400 group-hover:text-white">Join the chat</span>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/openclaw/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-900 hover:bg-red-600 rounded-2xl transition-colors duration-200 text-center"
            >
              <span className="text-3xl">⭐</span>
              <span className="font-semibold text-lg">GitHub</span>
              <span className="text-sm text-gray-400">Star the project</span>
            </a>

            {/* Twitter/X */}
            <a
              href="https://twitter.com/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-900 hover:bg-red-600 rounded-2xl transition-colors duration-200 text-center"
            >
              <span className="text-3xl">𝕏</span>
              <span className="font-semibold text-lg">Twitter / X</span>
              <span className="text-sm text-gray-400">Follow for updates</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================
          9. SECURITY & TRUST
          ============================================ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Your Privacy Is Non-Negotiable
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We built LaVerdi around a simple principle: your data belongs to you, on your server.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Security 1 */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Server className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Your Data, Your Server</h3>
              <p className="text-gray-600">
                Every assistant runs on its own isolated VPS. No shared databases, no data mixing.
                Your information stays yours.
              </p>
            </div>

            {/* Security 2 */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">End-to-End Encryption</h3>
              <p className="text-gray-600">
                All connections secured with TLS 1.3. Data encrypted at rest. Your conversations
                are private.
              </p>
            </div>

            {/* Security 3 */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Code className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Open Source Transparency</h3>
              <p className="text-gray-600">
                Built on OpenClaw — fully open source. Inspect the code, verify the security.
                No black boxes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          10. CTA FOOTER
          ============================================ */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-black via-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Meet Your AI Assistant?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Your own AI, your own server, running 24/7. Start your free trial — no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:support@laverdi.tech"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-black transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Questions?
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="bg-black text-gray-400 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">L</span>
                </div>
                <span className="text-white font-bold text-lg">LaVerdi</span>
              </div>
              <p className="text-sm text-gray-500">
                Your personal AI assistant, running on your own private server.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#how-it-works" className="hover:text-red-600 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-red-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#why-laverdi" className="hover:text-red-600 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#community" className="hover:text-red-600 transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-red-600 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-600 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@laverdi.tech"
                    className="hover:text-red-600 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-red-600 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-600 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-600 transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2026 LaVerdi. All rights reserved. Built on{' '}
              <a
                href="https://github.com/openclaw/openclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600 transition-colors"
              >
                OpenClaw
              </a>
              .
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a
                href="https://discord.gg/clawd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                Discord
              </a>
              <a
                href="https://github.com/openclaw/openclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                GitHub
              </a>
              <a
                href="https://twitter.com/openclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
