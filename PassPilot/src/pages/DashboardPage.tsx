import { Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Plane,
  TrendingDown,
  Calendar,
  Bookmark,
  ArrowRight,
  Star,
  Map,
  Eye,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { formatPriceCompact, timeAgo } from '@/lib/format';
import {
  MOCK_FLIGHTS,
  MOCK_SAVED_SEARCHES,
  MOCK_NOTIFICATIONS,
} from '@/lib/mockData';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="container-wide py-8">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-surface-500 mt-1">
              Here&apos;s what&apos;s happening with your flights today.
            </p>
          </div>
          <Link to="/search">
            <Button icon={<Search className="w-4 h-4" />}>
              New Search
            </Button>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Searches Today"
            value="12"
            icon={<Search className="w-5 h-5" />}
            color="brand"
          />
          <StatCard
            label="Active Alerts"
            value="3"
            icon={<Bell className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            label="Flights Found"
            value="47"
            icon={<Plane className="w-5 h-5" />}
            color="emerald"
          />
          <StatCard
            label="Avg Savings"
            value="$42"
            icon={<TrendingDown className="w-5 h-5" />}
            color="violet"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick search shortcuts */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-900">
                  Quick Search
                </h2>
                <Link
                  to="/search"
                  className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Advanced <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Tomorrow', icon: Calendar, href: '/search?date=tomorrow' },
                  { label: 'This Weekend', icon: Star, href: '/search?date=weekend' },
                  { label: 'Under $20', icon: TrendingDown, href: '/search?maxPrice=20' },
                  { label: 'Explore Map', icon: Map, href: '/map' },
                ].map((shortcut) => (
                  <Link
                    key={shortcut.label}
                    to={shortcut.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors text-center group"
                  >
                    <shortcut.icon className="w-5 h-5 text-brand-500 group-hover:text-brand-600" />
                    <span className="text-sm font-medium text-surface-700">
                      {shortcut.label}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Saved Searches */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-brand-500" />
                  Saved Searches
                </h2>
                <Badge variant="brand">{MOCK_SAVED_SEARCHES.length}</Badge>
              </div>
              <div className="space-y-3">
                {MOCK_SAVED_SEARCHES.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <Search className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-surface-900 truncate">
                            {search.name}
                          </p>
                          {search.newResults > 0 && (
                            <Badge variant="brand" size="sm">
                              {search.newResults} new
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-surface-500">
                          Last checked {timeAgo(search.lastChecked)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg hover:bg-surface-200 text-surface-400 hover:text-surface-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Deals */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-emerald-500" />
                  Deals From Your Airport
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {MOCK_FLIGHTS.slice(0, 4).map((flight) => (
                  <div
                    key={flight.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-sm font-bold text-surface-900">
                          {flight.destination.code}
                        </p>
                        <p className="text-2xs text-surface-500">
                          {flight.destination.city}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        {formatPriceCompact(flight.price)}
                      </p>
                      {flight.stops === 0 && (
                        <p className="text-2xs text-surface-400">nonstop</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Notifications
                </h2>
                <Badge variant="warning">
                  {MOCK_NOTIFICATIONS.filter((n) => !n.read).length}
                </Badge>
              </div>
              <div className="space-y-3">
                {MOCK_NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl text-sm transition-colors cursor-pointer ${
                      notif.read
                        ? 'bg-surface-50 hover:bg-surface-100'
                        : 'bg-brand-50 hover:bg-brand-100'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-surface-900">
                          {notif.title}
                        </p>
                        <p className="text-surface-500 text-xs mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-surface-400 text-xs mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-sm text-brand-600 hover:text-brand-700 text-center py-2">
                View all notifications
              </button>
            </Card>

            {/* Membership status */}
            <Card
              padding="md"
              className="bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0"
            >
              <div className="flex items-center gap-2 mb-3">
                <Plane className="w-5 h-5 text-brand-200" />
                <h3 className="font-semibold">Your Membership</h3>
              </div>
              <p className="text-brand-200 text-sm mb-4">
                Monthly Plan &mdash; Active
              </p>
              <div className="bg-white/10 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-200">Next billing</span>
                  <span className="font-medium">Mar 28, 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-200">Member since</span>
                  <span className="font-medium">Jan 15, 2026</span>
                </div>
              </div>
              <Link to="/account" className="block mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="text-white hover:bg-white/10 border border-white/20"
                >
                  Manage Subscription
                </Button>
              </Link>
            </Card>

            {/* Tips */}
            <Card variant="bordered" padding="md">
              <h3 className="font-semibold text-surface-900 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-accent-500" />
                Pro Tip
              </h3>
              <p className="text-sm text-surface-600 leading-relaxed">
                Set up price alerts for your top 3 destinations. Members who
                use alerts book 2x more flights on average.
              </p>
              <Link to="/alerts">
                <Button variant="ghost" size="sm" className="mt-3">
                  Set Up Alerts <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'brand' | 'amber' | 'emerald' | 'violet';
}) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-surface-900">{value}</p>
          <p className="text-xs text-surface-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}
