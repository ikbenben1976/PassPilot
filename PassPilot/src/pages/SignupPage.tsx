import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Mail, Lock, User, Eye, EyeOff, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { APP_NAME } from '@/lib/constants';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login(
        {
          id: '1',
          email,
          name,
          homeAirport: null,
          subscription: { id: 's1', plan: 'monthly', status: 'trialing', currentPeriodEnd: '2026-03-07', cancelAtPeriodEnd: false },
          createdAt: new Date().toISOString(),
          preferences: { homeAirportCode: null, favoriteDestinations: [], priceAlerts: true, emailDigest: 'daily', darkMode: false },
        },
        'mock-jwt-token',
      );
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  const benefits = [
    'Search all 100+ pass-eligible destinations instantly',
    'Calendar heat map with daily availability',
    'Price drop alerts for favorite routes',
    'Interactive destination map',
    'Smart connection finder',
    'Cancel anytime, no questions asked',
  ];

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl text-surface-900">
                {APP_NAME}
              </span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-surface-900">
              Start your free trial
            </h1>
            <p className="mt-2 text-surface-500">
              Try free for 1 day, then $2.99/month. Cancel anytime.
            </p>
          </div>

          <Card variant="elevated" padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                icon={<Lock className="w-4 h-4" />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-surface-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                hint="Minimum 8 characters"
                required
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                variant="accent"
                loading={loading}
                icon={<Zap className="w-5 h-5" />}
              >
                Start Free Trial
              </Button>

              <p className="text-xs text-center text-surface-400">
                By signing up, you agree to our{' '}
                <Link to="/terms" className="text-brand-600 hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-brand-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </Card>

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Benefits panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-hero-pattern p-12">
        <div className="max-w-md text-white">
          <Badge className="bg-white/20 text-white border-0 mb-6">
            No credit card required
          </Badge>
          <h2 className="text-3xl font-display font-bold mb-4">
            Everything you need to maximize your all-you-can-fly pass
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Join 2,000+ members who stopped wasting time clicking through
            Frontier's website and started traveling more.
          </p>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
