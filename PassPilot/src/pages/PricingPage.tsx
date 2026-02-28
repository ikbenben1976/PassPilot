import { Link } from 'react-router-dom';
import { Check, Zap, Star, Shield, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';

export function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const allFeatures = [
    'Unlimited flight searches across all destinations',
    'Calendar heat map with daily flight counts & prices',
    'Interactive destination map with real-time pricing',
    'Price drop alerts via email & push notifications',
    'Smart connection finder (one-stop routes via hubs)',
    'Save unlimited searches',
    'Multi-city trip planner',
    'Historical price trend data',
    'Priority data refresh rates',
    'Early access to new features',
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="container-narrow text-center py-16">
          <Badge variant="brand" className="mb-4">Pricing</Badge>
          <h1 className="text-4xl font-display font-bold text-surface-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-surface-500 max-w-xl mx-auto">
            One plan with everything. No feature gating, no surprise fees.
            Just search and fly.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!annual ? 'text-surface-900' : 'text-surface-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-brand-600' : 'bg-surface-300'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-surface-900' : 'text-surface-500'}`}>
              Annual <Badge variant="success" size="sm">Save 67%</Badge>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing card */}
      <div className="container-narrow -mt-4 relative z-10 pb-16">
        <Card variant="elevated" className="max-w-lg mx-auto border-2 border-brand-500">
          <div className="p-8 text-center border-b border-surface-100">
            <h2 className="text-xl font-semibold text-surface-900">
              {annual ? 'Annual' : 'Monthly'} Membership
            </h2>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-surface-900">
                {annual ? '$0.99' : '$2.99'}
              </span>
              <span className="text-surface-500">/month</span>
            </div>
            {annual && (
              <p className="text-sm text-surface-500 mt-2">
                Billed as $11.88/year
              </p>
            )}
            <Link to="/signup" className="block mt-6">
              <Button size="xl" variant="accent" fullWidth icon={<Zap className="w-5 h-5" />}>
                Try Free for 1 Day
              </Button>
            </Link>
            <p className="text-xs text-surface-400 mt-3">
              No credit card required for trial
            </p>
          </div>

          <div className="p-8">
            <h3 className="font-semibold text-surface-900 mb-4">
              Everything included:
            </h3>
            <ul className="space-y-3">
              {allFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-surface-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
          {[
            { icon: Shield, label: 'Secure Payments', desc: 'Powered by Stripe' },
            { icon: Star, label: '2,000+ Members', desc: 'Trusted by travelers' },
            { icon: Headphones, label: 'Email Support', desc: 'We respond fast' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <item.icon className="w-6 h-6 text-brand-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-surface-900">{item.label}</p>
              <p className="text-xs text-surface-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
