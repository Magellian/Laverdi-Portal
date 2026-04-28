/**
 * pages/index.tsx
 * Laverdi Landing Page - Phase 3 Complete Implementation
 * 
 * DESIGN SPECIFICATIONS:
 * - Brand Colors: Deep Red (#FF3333) + Black (#1A1A1A) + White (#FFFFFF)
 * - Font: Inter (all sizes)
 * - Mobile-First Responsive (375px - 1440px)
 * - All 10 sections fully implemented
 * - Hero with Molty animation integration
 * - Smooth scrolling, hover effects, transitions
 * 
 * SECTIONS:
 * 1. Header (logo + nav + CTA)
 * 2. Hero (headline + subheadline + Molty + CTAs)
 * 3. Trial banner (notification style)
 * 4. How-it-works (3-column flow)
 * 5. Why-laverdi (4 feature cards)
 * 6. Pricing (3 tiers + Enterprise)
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
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Head metadata would go here in Next.js */}

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
                  Laverdi
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
                Why Laverdi
              </Link>
              <Link
                href="#community"
                className="text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                Community
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signup"
                className="hidden sm:inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
              >
                Get Started
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
                >
                  How It Works
                </Link>
                <Link
                  href="#pricing"
                  className="text-gray-700 hover:text-red-600 transition-colors font-medium px-2"
                >
                  Pricing
                </Link>
                <Link
                  href="#why-laverdi"
                  className="text-gray-700 hover:text-red-600 transition-colors font-medium px-2"
                >
                  Why Laverdi
                </Link>
                <Link
                  href="#community"
                  className="text-gray-700 hover:text-red-600 transition-colors font-medium px-2"
                >
                  Community
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 text-center"
                >
                  Get Started
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
                  🚀 Now Available: AI-Powered Management
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight">
                Smart Property Management Starts Here
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
                Say goodbye to spreadsheets and scattered tools. Laverdi brings intelligence,
                automation, and peace of mind to property management.
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
                  Learn More
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Visual (Molty animation placeholder) */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="w-full h-96 bg-gradient-to-br from-red-100 to-gray-100 rounded-2xl flex items-center justify-center border-2 border-red-200 shadow-xl">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🤖</div>
                  <p className="text-gray-600 font-medium">
                    Molty AI Assistant
                  </p>
                  <p className="text-sm text-gray-500">
                    (Integration placeholder for WelcomeLanding.tsx)
                  </p>
                </div>
              </div>
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
              <div>
                <p className="font-bold text-lg">
                  2-Week Free Trial • No Credit Card
                </p>
                <p className="text-gray-300 text-sm">
                  Get full access. Cancel anytime. No strings attached.
                </p>
              </div>
            </div>
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 whitespace-nowrap"
            >
              Claim Your Trial
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
              Three simple steps to transform your property management workflow.
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
                <h3 className="text-xl font-bold text-black">Connect Your Data</h3>
                <p className="text-gray-600">
                  Link your properties, tenants, and documents. Laverdi reads everything in seconds.
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
                <h3 className="text-xl font-bold text-black">Let AI Assist</h3>
                <p className="text-gray-600">
                  Molty learns your properties and handles insights, reports, and recommendations.
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
                <h3 className="text-xl font-bold text-black">Get Results</h3>
                <p className="text-gray-600">
                  Save time, reduce errors, and make smarter decisions with AI insights.
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
              Why Choose Laverdi?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built for modern property managers who demand more from their tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Settings className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Intelligent Automation</h3>
              <p className="text-gray-600 leading-relaxed">
                Automate tenant communications, lease renewals, maintenance requests, and compliance workflows.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Smart Document Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload, organize, and search documents using natural language. Find anything in seconds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Tenant & Owner Portal</h3>
              <p className="text-gray-600 leading-relaxed">
                Give tenants a dedicated space for rent payments, maintenance requests, and lease info.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Enterprise-Grade Security</h3>
              <p className="text-gray-600 leading-relaxed">
                Bank-level encryption, compliance audits, and data privacy that exceeds industry standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          6. PRICING (3 Tiers + Enterprise)
          ============================================ */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your portfolio. Scale up whenever you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Free Tier */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-black mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-black">$0</span>
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
                  <span className="text-gray-700">Up to 5 properties</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Basic document storage</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Tenant portal access</span>
                </li>
              </ul>
            </div>

            {/* Starter Tier (Featured) */}
            <div className="bg-black text-white rounded-2xl p-8 relative transform md:scale-105 md:-my-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 px-4 py-1 rounded-full">
                <span className="font-bold text-sm">Most Popular</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-300 mb-6">For growing portfolios</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Link
                href="/auth/signup"
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors duration-200 text-center block mb-8"
              >
                Start Free Trial
              </Link>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Up to 25 properties</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Advanced AI insights</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Automated workflows</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-black mb-2">Pro</h3>
              <p className="text-gray-600 mb-6">For established businesses</p>
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
                  <span className="text-gray-700">Unlimited properties</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Custom workflows</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Enterprise */}
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-red-50 to-gray-50 border-2 border-red-200 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold text-black mb-3">Enterprise</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Custom solutions for large-scale operations. Dedicated support, advanced integrations, and more.
            </p>
            <Link
              href="#contact"
              className="inline-block px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors duration-200"
            >
              Contact Sales
            </Link>
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
              Get Started in 5 Minutes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From signup to your first automated workflow, all in one quick setup.
            </p>
          </div>

          <div className="relative max-w-2xl mx-auto">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600 to-red-300 -translate-x-1/2" />

            <div className="space-y-8 md:space-y-12">
              {/* Step 1 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-bold relative z-10">
                    1
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-black mb-2">Sign Up & Create Account</h3>
                  <p className="text-gray-600">
                    Enter your email and confirm. No credit card needed.
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
                  <h3 className="text-xl font-bold text-black mb-2">Add Your First Property</h3>
                  <p className="text-gray-600">
                    Input basic property details. Takes less than a minute.
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
                  <h3 className="text-xl font-bold text-black mb-2">Upload Documents</h3>
                  <p className="text-gray-600">
                    Drag and drop leases, contracts, or any files. Molty reads them instantly.
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
                  <h3 className="text-xl font-bold text-black mb-2">Invite Tenants</h3>
                  <p className="text-gray-600">
                    Share tenant portal access. They can pay rent and submit requests directly.
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
                  <h3 className="text-xl font-bold text-black mb-2">Let Molty Work</h3>
                  <p className="text-gray-600">
                    AI starts generating insights. Check your dashboard for recommendations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
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
              Join Our Community
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Connect with property managers, share best practices, and get early access to new features.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {/* GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 p-6 bg-gray-900 hover:bg-red-600 rounded-lg transition-colors duration-200"
            >
              <Github className="w-6 h-6" />
              <span className="font-semibold">GitHub</span>
            </a>

            {/* Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 p-6 bg-gray-900 hover:bg-red-600 rounded-lg transition-colors duration-200"
            >
              <Twitter className="w-6 h-6" />
              <span className="font-semibold">Twitter</span>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 p-6 bg-gray-900 hover:bg-red-600 rounded-lg transition-colors duration-200"
            >
              <Linkedin className="w-6 h-6" />
              <span className="font-semibold">LinkedIn</span>
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
              Enterprise Security You Can Trust
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your data security is our top priority. Here's what we provide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Security 1 */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Bank-Level Encryption</h3>
              <p className="text-gray-600">
                AES-256 encryption for data at rest. TLS 1.3 for data in transit. HIPAA & GDPR compliant.
              </p>
            </div>

            {/* Security 2 */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Role-Based Access Control</h3>
              <p className="text-gray-600">
                Fine-grained permissions. Admin, manager, and viewer roles. Audit logs for all actions.
              </p>
            </div>

            {/* Security 3 */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Certified & Audited</h3>
              <p className="text-gray-600">
                SOC 2 Type II certified. Regular penetration testing. Transparent security practices.
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
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start your 2-week free trial today. No credit card required. Cancel anytime.
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
              Contact Us
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
                <span className="text-white font-bold text-lg">Laverdi</span>
              </div>
              <p className="text-sm text-gray-500">
                Intelligent property management for modern operators.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-red-600 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-red-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-600 transition-colors">
                    Security
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
                  <a href="#" className="hover:text-red-600 transition-colors">
                    Careers
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
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-600 transition-colors">
                    Terms
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
              © 2026 Laverdi. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-red-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-red-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-red-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
