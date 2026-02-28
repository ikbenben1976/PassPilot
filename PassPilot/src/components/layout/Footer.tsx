import { Link } from 'react-router-dom';
import { Compass, Github, Twitter, Mail } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, FOOTER_LINKS } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="bg-surface-950 text-surface-200">
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm text-surface-400 max-w-xs leading-relaxed">
              {APP_TAGLINE}. The smarter way to search, discover, and book
              flights with your all-you-can-fly pass. Built by travelers, for travelers.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <SocialLink href="https://twitter.com" icon={<Twitter className="w-4 h-4" />} label="Twitter" />
              <SocialLink href="https://github.com" icon={<Github className="w-4 h-4" />} label="GitHub" />
              <SocialLink href="mailto:hello@passpilot.com" icon={<Mail className="w-4 h-4" />} label="Email" />
            </div>
          </div>

          {/* Link Columns */}
          <FooterColumn title="Product" links={FOOTER_LINKS.product} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
          <FooterColumn title="Resources" links={FOOTER_LINKS.resources} />
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-500">
            &copy; {new Date().getFullYear()} {APP_NAME}. Not affiliated with
            Frontier Airlines.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/status"
              className="text-xs text-surface-500 hover:text-surface-300 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              All Systems Operational
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              to={link.href}
              className="text-sm text-surface-400 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white transition-colors"
    >
      {icon}
    </a>
  );
}
