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
        headers: {
          'Content-Type': 'application/json',
        },
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
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Choose the perfect plan for your AI agent needs. All plans include 7-day free trial.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border p-8 flex flex-col justify-between transition-all ${
                tier.name === 'Pro'
                  ? 'border-white bg-zinc-800 shadow-lg scale-105'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
              }`}
            >
              {/* Tier Info */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h2>
                <p className="text-zinc-400 text-sm mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">
                    ${tier.price}
                  </span>
                  <span className="text-zinc-400">/month</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-green-400 mt-1">✓</span>
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(tier.priceId, tier.name)}
                disabled={loading === tier.name}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  tier.name === 'Pro'
                    ? 'bg-white text-black hover:bg-zinc-100'
                    : 'bg-zinc-800 text-white border border-zinc-700 hover:border-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === tier.name ? 'Redirecting...' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-zinc-400">
                Yes, we offer a 7-day money-back guarantee. No questions asked.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-zinc-400">
                Absolutely. Upgrade or downgrade your plan at any time.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-zinc-400">
                We accept all major credit cards via Stripe.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Need a custom plan?
              </h3>
              <p className="text-zinc-400">
                Contact our sales team for enterprise solutions.
              </p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-zinc-400 mb-4">
            Questions? We're here to help.
          </p>
          <a
            href="mailto:support@laverdi.tech"
            className="text-white hover:text-zinc-300 transition-colors"
          >
            contact support
          </a>
        </div>
      </div>
    </div>
  );
}
