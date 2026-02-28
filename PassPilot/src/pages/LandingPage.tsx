import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  Calendar,
  Map,
  Bell,
  GitBranch,
  Route,
  ChevronRight,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  Globe,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  FEATURES,
  TESTIMONIALS,
  FAQ_ITEMS,
  APP_DESCRIPTION,
  FRONTIER_AIRPORTS_COUNT,
} from '@/lib/constants';

const ICON_MAP: Record<string, React.ReactNode> = {
  Search: <Search className="w-6 h-6" />,
  Calendar: <Calendar className="w-6 h-6" />,
  Map: <Map className="w-6 h-6" />,
  Bell: <Bell className="w-6 h-6" />,
  GitBranch: <GitBranch className="w-6 h-6" />,
  Route: <Route className="w-6 h-6" />,
};

export function LandingPage() {
  return (
    <div className="-mt-16">
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingPreview />
      <FAQSection />
      <CTASection />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-hero-pattern">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float animate-delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/5 rounded-full blur-3xl" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative container-wide py-32">
        <div className="max-w-3xl">
          {/* Announcement badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent-400" />
            <span>Now with real-time availability tracking</span>
            <ChevronRight className="w-4 h-4" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black text-white leading-[1.1] tracking-tight animate-fade-up">
            Find open seats{' '}
            <span className="relative">
              <span className="gradient-text-accent">in seconds</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
              >
                <path
                  d="M2 8c40-6 80-6 120-2s60 4 76 2"
                  stroke="rgba(20,184,166,0.4)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            , not hours.
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed animate-fade-up animate-delay-100">
            {APP_DESCRIPTION} Stop clicking through dates one by one — just
            search, discover, and go.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up animate-delay-200">
            <Link to="/signup">
              <Button size="xl" variant="accent" icon={<Zap className="w-5 h-5" />}>
                Try Free for 1 Day
              </Button>
            </Link>
            <Link to="/search">
              <Button
                size="xl"
                variant="ghost"
                className="text-white hover:bg-white/10"
                iconRight={<ArrowRight className="w-5 h-5" />}
              >
                See Demo
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-6 animate-fade-up animate-delay-300">
            <div className="flex -space-x-2">
              {['SM', 'MJ', 'RK', 'DL', '+'].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-brand-900 bg-brand-700 flex items-center justify-center text-white text-2xs font-bold"
                >
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className="w-4 h-4 fill-accent-400 text-accent-400"
                  />
                ))}
              </div>
              <p className="text-sm text-white/60">
                Loved by 2,000+ pass members
              </p>
            </div>
          </div>
        </div>

        {/* Hero visual - Floating search card mockup */}
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-[420px]">
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-float animate-fade-in animate-delay-200">
              {/* Mock search results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-white/80 text-sm mb-4">
                  <span className="font-medium">From DEN &mdash; Tomorrow</span>
                  <Badge variant="success" size="sm">
                    23 flights
                  </Badge>
                </div>
                {[
                  { dest: 'Austin, TX', code: 'AUS', price: '$15', time: '6:05 AM' },
                  { dest: 'Miami, FL', code: 'MIA', price: '$29', time: '7:30 AM' },
                  { dest: 'Phoenix, AZ', code: 'PHX', price: '$12', time: '9:15 AM' },
                  { dest: 'Las Vegas, NV', code: 'LAS', price: '$18', time: '11:00 AM' },
                ].map((flight) => (
                  <div
                    key={flight.code}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                        <Compass className="w-4 h-4 text-brand-300" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {flight.dest}
                        </p>
                        <p className="text-white/50 text-xs">{flight.time}</p>
                      </div>
                    </div>
                    <span className="text-accent-400 font-bold text-sm">
                      {flight.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating notification */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-float animate-float animate-delay-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-900">
                    Price Alert!
                  </p>
                  <p className="text-2xs text-surface-500">
                    DEN→AUS dropped to $12
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { label: 'Destinations', value: `${FRONTIER_AIRPORTS_COUNT}+`, icon: <Globe className="w-5 h-5" /> },
    { label: 'Active Members', value: '2,000+', icon: <Star className="w-5 h-5" /> },
    { label: 'Avg Savings/Flight', value: '$45', icon: <Zap className="w-5 h-5" /> },
    { label: 'Flights Searched', value: '1.2M+', icon: <Search className="w-5 h-5" /> },
  ];

  return (
    <section className="relative -mt-8 z-10">
      <div className="container-wide">
        <div className="bg-white rounded-2xl shadow-float border border-surface-100 px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-surface-200">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 md:justify-center md:px-6"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-surface-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="container-wide">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-4">
            Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900">
            Everything you need to fly more,{' '}
            <span className="gradient-text">search less</span>
          </h2>
          <p className="mt-4 text-surface-500 leading-relaxed">
            We built the tools Frontier should have. See all your options at a
            glance, get alerted to deals, and never miss a flight again.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              variant="interactive"
              className="group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors mb-4">
                {ICON_MAP[feature.icon]}
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-surface-500 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Set Your Home Airport',
      description:
        'Tell us where you fly from. We save it so every search starts from your home base.',
      color: 'bg-brand-500',
    },
    {
      number: '02',
      title: 'Search Everywhere at Once',
      description:
        'One click shows every pass-eligible destination with real-time pricing and availability.',
      color: 'bg-accent-500',
    },
    {
      number: '03',
      title: 'Book on Frontier',
      description:
        'Found your flight? We link you straight to Frontier\'s booking page. Easy as that.',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <section className="py-24 bg-surface-50">
      <div className="container-wide">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900">
            Three steps to your next adventure
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px border-t-2 border-dashed border-surface-300" />
              )}

              <div className="text-center space-y-4">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.color} text-white text-xl font-bold shadow-lg`}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-surface-900">
                  {step.title}
                </h3>
                <p className="text-surface-500 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="container-wide">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-4">
            Testimonials
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900">
            Trusted by pass holders everywhere
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} variant="bordered" className="flex flex-col">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-accent-400 text-accent-400"
                  />
                ))}
              </div>
              <p className="text-sm text-surface-700 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-surface-100">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-surface-500">{t.location}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Preview ─────────────────────────────────────────────────────────

function PricingPreview() {
  return (
    <section className="py-24 bg-surface-50">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900">
            One plan. Everything included.
          </h2>
          <p className="mt-4 text-surface-500">
            No tiers, no feature gating. Every member gets the full experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Monthly */}
          <Card variant="bordered" className="relative">
            <h3 className="text-lg font-semibold text-surface-900">Monthly</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-surface-900">$2.99</span>
              <span className="text-surface-500">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                'Unlimited flight searches',
                'Calendar heat map',
                'Interactive destination map',
                'Price drop alerts',
                'Smart connection finder',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                  <Check className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="block mt-8">
              <Button variant="outline" fullWidth>
                Start Free Trial
              </Button>
            </Link>
          </Card>

          {/* Annual */}
          <Card variant="elevated" className="relative border-2 border-brand-500">
            <Badge variant="brand" className="absolute -top-3 left-6">
              Save 67%
            </Badge>
            <h3 className="text-lg font-semibold text-surface-900">Annual</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-surface-900">$0.99</span>
              <span className="text-surface-500">/month</span>
            </div>
            <p className="text-sm text-surface-500 mt-1">
              Billed as $11.88/year
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Everything in Monthly',
                'Priority data refresh',
                'Multi-city trip planner',
                'Historical price trends',
                'Early access to new features',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                  <Check className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup?plan=annual" className="block mt-8">
              <Button variant="primary" fullWidth>
                Start Free Trial
              </Button>
            </Link>
          </Card>
        </div>

        <p className="text-center text-sm text-surface-500 mt-8">
          Free 1-day trial. Cancel anytime, no questions asked.
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQSection() {
  return (
    <section id="faq" className="py-24">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.question} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-surface-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-surface-50 transition-colors"
      >
        <span className="text-sm font-medium text-surface-900 pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-surface-400 transition-transform duration-200 flex-shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-4 animate-fade-in">
          <p className="text-sm text-surface-500 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-24 bg-hero-pattern relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container-narrow text-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
          Ready to discover your next destination?
        </h2>
        <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
          Join thousands of pass holders who stopped wasting time searching
          and started traveling.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="xl" variant="accent" icon={<Compass className="w-5 h-5" />}>
              Start Your Free Trial
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-white/50">
          No credit card required for trial
        </p>
      </div>
    </section>
  );
}
