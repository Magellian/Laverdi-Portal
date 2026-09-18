'use client';

import { useState } from 'react';

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: 19,
    description: 'Perfect for individuals and personal projects',
    features: [
      '1 Agent Instance',
      '1 Connected Platform',
      'Community Support',
      'Basic Analytics',
    ],
    priceId: 'price_1TeTlyPgT412N4dj2Uv4ue41',
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: 49,
    description: 'Great for small teams and power users',
    features: [
      '5 Agent Instances',
      '3 Connected Platforms',
      'Priority Support',
      'Advanced Analytics',
      'API Access',
    ],
    priceId: 'price_1TeTtKPgT412N4dj0CHQfbrs',
    cta: 'Subscribe Now',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For organizations with advanced needs',
    features: [
      '20 Agent Instances',
      'Unlimited Platforms',
      'Dedicated Support',
      'Advanced Analytics & Reporting',
      'Full API Access',
      'Custom Integrations',
      'SLA Guarantee',
    ],
    priceId: 'price_1TeTtfPgT412N4djm9Quvt69',
    cta: 'Contact Sales',
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, tierName: string) => {
    setLoading(tierName);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert('Failed to initiate checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to connect to checkout service');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] marble-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#0a1628]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L4 14L8 16L12 12L16 16L20 14L12 4Z" fill="var(--accent)" opacity="0.8"/>
              <path d="M12 4V12M12 12L8 16M12 12L16 16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-white font-bold text-lg">LaVerdi</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/download" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm transition-colors">Companion</a>
            <a href="/#features" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm transition-colors">Features</a>
            <a href="/login" className="bg-[var(--accent)] text-[#0a1628] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--accent-glow)] transition-all">Log In</a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Simple, <span className="text-[var(--accent)]">Transparent</span> Pricing
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
            Choose the perfect plan for your AI agent needs. All plans include a 7-day free trial.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-8 flex flex-col justify-between transition-all ${
                tier.highlighted
                  ? 'border-[var(--accent)] bg-[var(--surface)] gold-glow scale-105'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]'
              }`}
            >
              <div>
                {tier.highlighted && (
                  <span className="inline-block bg-[var(--accent)] text-[#0a1628] text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                    Recommended
                  </span>
                )}
                <h2 className="text-2xl font-bold text-white mb-2">{tier.name}</h2>
                <p className="text-[var(--muted)] text-sm mb-6">{tier.description}</p>

                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">${tier.price}</span>
                  <span className="text-[var(--muted)]">/month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-[var(--accent)] mt-1">✦</span>
                      <span className="text-[var(--muted)]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe(tier.priceId, tier.name)}
                disabled={loading === tier.name}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  tier.highlighted
                    ? 'bg-[var(--accent)] text-[#0a1628] hover:bg-[var(--accent-glow)] gold-glow'
                    : 'bg-[var(--surface)] text-white border border-[var(--border)] hover:border-[var(--accent)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === tier.name ? 'Redirecting...' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Greek Divider */}
        <div className="greek-divider max-w-3xl mx-auto mb-16" />

        {/* FAQ */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Do you offer refunds?</h3>
              <p className="text-[var(--muted)]">Yes, we offer a 7-day money-back guarantee. No questions asked.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I change plans anytime?</h3>
              <p className="text-[var(--muted)]">Absolutely. Upgrade or downgrade your plan at any time.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-[var(--muted)]">We accept all major credit cards via Stripe.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Is Companion a separate purchase?</h3>
              <p className="text-[var(--muted)]">No — Companion comes with every plan. Pair it with any of your agents from your dashboard whenever you want it working locally too.</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-[var(--muted)] mb-4">Questions? We&apos;re here to help.</p>
          <a
            href="mailto:support@laverdi.tech"
            className="text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors font-medium"
          >
            support@laverdi.tech
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center text-[var(--muted)] text-sm">
          <p>&copy; 2026 LaVerdi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}