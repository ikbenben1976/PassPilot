import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Compass, Bell, User, LogOut, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { NAV_LINKS, APP_NAME } from '@/lib/constants';

export function Header() {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { mobileMenuOpen, toggleMobileMenu } = useUIStore();

  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.requiresAuth || isAuthenticated,
  );

  const isLanding = pathname === '/';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        isLanding
          ? 'bg-transparent'
          : 'bg-white/80 backdrop-blur-xl border-b border-surface-200',
      )}
    >
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl transition-colors',
                isLanding
                  ? 'bg-white/20 text-white group-hover:bg-white/30'
                  : 'bg-brand-100 text-brand-600 group-hover:bg-brand-200',
              )}
            >
              <Compass className="w-5 h-5" />
            </div>
            <span
              className={cn(
                'font-display font-bold text-lg',
                isLanding ? 'text-white' : 'text-surface-900',
              )}
            >
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  pathname === link.href
                    ? isLanding
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-50 text-brand-700'
                    : isLanding
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Quick search */}
                <button
                  className={cn(
                    'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors',
                    isLanding
                      ? 'bg-white/10 text-white/70 hover:bg-white/20'
                      : 'bg-surface-100 text-surface-500 hover:bg-surface-200',
                  )}
                >
                  <Search className="w-4 h-4" />
                  <span>Search...</span>
                  <kbd className="text-xs bg-surface-200/50 px-1.5 py-0.5 rounded">
                    /
                  </kbd>
                </button>

                {/* Notifications */}
                <button
                  className={cn(
                    'relative p-2 rounded-xl transition-colors',
                    isLanding
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100',
                  )}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                </button>

                {/* Profile */}
                <Link
                  to="/account"
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors',
                    isLanding
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-surface-600 hover:bg-surface-100',
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant={isLanding ? 'ghost' : 'ghost'}
                    size="sm"
                    className={cn(
                      isLanding && 'text-white hover:bg-white/10',
                    )}
                  >
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    variant={isLanding ? 'accent' : 'primary'}
                    size="sm"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className={cn(
                'md:hidden p-2 rounded-xl transition-colors',
                isLanding
                  ? 'text-white hover:bg-white/10'
                  : 'text-surface-600 hover:bg-surface-100',
              )}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && <MobileMenu />}
    </header>
  );
}

function MobileMenu() {
  const { pathname } = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { closeMobileMenu } = useUIStore();

  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.requiresAuth || isAuthenticated,
  );

  return (
    <div className="md:hidden absolute inset-x-0 top-16 bg-white border-b border-surface-200 shadow-float animate-fade-in">
      <nav className="container-wide py-4 space-y-1">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            onClick={closeMobileMenu}
            className={cn(
              'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              pathname === link.href
                ? 'bg-brand-50 text-brand-700'
                : 'text-surface-600 hover:bg-surface-50',
            )}
          >
            {link.label}
          </Link>
        ))}

        <hr className="my-3 border-surface-200" />

        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">
                  {user?.name}
                </p>
                <p className="text-xs text-surface-500">{user?.email}</p>
              </div>
            </div>
            <Link
              to="/account"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-surface-600 hover:bg-surface-50"
            >
              <User className="w-4 h-4" />
              Account Settings
            </Link>
            <button
              onClick={() => {
                logout();
                closeMobileMenu();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2 px-4 py-2">
            <Link to="/login" onClick={closeMobileMenu}>
              <Button variant="outline" fullWidth>
                Log in
              </Button>
            </Link>
            <Link to="/signup" onClick={closeMobileMenu}>
              <Button variant="primary" fullWidth>
                Start Free Trial
              </Button>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
