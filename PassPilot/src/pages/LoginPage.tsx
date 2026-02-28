import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { APP_NAME } from '@/lib/constants';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulated login — in production this would hit the API
    setTimeout(() => {
      login(
        {
          id: '1',
          email,
          name: 'Demo User',
          homeAirport: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
          subscription: { id: 's1', plan: 'monthly', status: 'active', currentPeriodEnd: '2026-03-28', cancelAtPeriodEnd: false },
          createdAt: '2026-01-15',
          preferences: { homeAirportCode: 'DEN', favoriteDestinations: [], priceAlerts: true, emailDigest: 'daily', darkMode: false },
        },
        'mock-jwt-token',
      );
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
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
            Welcome back
          </h1>
          <p className="mt-2 text-surface-500">
            Sign in to access your flight search tools
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

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
              placeholder="Enter your password"
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
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-surface-600">
                <input
                  type="checkbox"
                  className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-surface-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social auth */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="md">
              Google
            </Button>
            <Button variant="outline" size="md">
              Apple
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-surface-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="text-brand-600 hover:text-brand-700 font-medium"
          >
            Start your free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
