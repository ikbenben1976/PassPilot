export const APP_NAME = 'PassPilot';
export const APP_TAGLINE = 'Navigate Your All-You-Can-Fly Pass';
export const APP_DESCRIPTION =
  'The smarter way to search, discover, and book flights with your all-you-can-fly pass. See every available destination from your airport in one search.';

export const SUBSCRIPTION_PRICE_MONTHLY = 299; // $2.99
export const SUBSCRIPTION_PRICE_ANNUAL = 1188; // $11.88/yr ($0.99/mo)
export const PROMO_TRIAL_DURATION_HOURS = 24;

export const FRONTIER_AIRPORTS_COUNT = 100;
export const MAX_SEARCH_RESULTS = 200;

export const NAV_LINKS = [
  { label: 'Search', href: '/search', requiresAuth: true },
  { label: 'Calendar', href: '/calendar', requiresAuth: true },
  { label: 'Map', href: '/map', requiresAuth: true },
  { label: 'Alerts', href: '/alerts', requiresAuth: true },
  { label: 'Blog', href: '/blog', requiresAuth: false },
  { label: 'Pricing', href: '/pricing', requiresAuth: false },
] as const;

export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/#faq' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  resources: [
    { label: 'Pass Guide', href: '/blog/pass-guide' },
    { label: 'Booking Tips', href: '/blog/booking-tips' },
    { label: 'Destination Guides', href: '/blog/destinations' },
    { label: 'API Status', href: '/status' },
  ],
} as const;

export const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    location: 'Denver, CO',
    quote:
      "This tool cut my flight search time from 45 minutes to 30 seconds. I've flown to 12 cities this month alone.",
    avatar: 'SM',
    rating: 5,
  },
  {
    name: 'Marcus J.',
    location: 'Orlando, FL',
    quote:
      "The calendar view is a game-changer. I can see a whole month of availability at a glance and plan spontaneous trips instantly.",
    avatar: 'MJ',
    rating: 5,
  },
  {
    name: 'Rachel K.',
    location: 'Las Vegas, NV',
    quote:
      'Price alerts saved me so much money. Got notified about a $15 flight to Austin and booked it in seconds.',
    avatar: 'RK',
    rating: 5,
  },
  {
    name: 'David L.',
    location: 'Philadelphia, PA',
    quote:
      "Worth every penny. The map view showing all destinations with real-time pricing is exactly what Frontier's site should have built.",
    avatar: 'DL',
    rating: 5,
  },
] as const;

export const FEATURES = [
  {
    title: 'One-Click Search',
    description:
      'See every pass-eligible destination from your airport in a single search. No more clicking through dates one by one.',
    icon: 'Search',
  },
  {
    title: 'Calendar Heat Map',
    description:
      'Visual calendar showing flight availability across dates. Spot the best days to fly at a glance.',
    icon: 'Calendar',
  },
  {
    title: 'Interactive Map',
    description:
      'Explore destinations on a map with real-time pricing bubbles. Discover hidden gems you never considered.',
    icon: 'Map',
  },
  {
    title: 'Price Alerts',
    description:
      'Set alerts for your favorite routes. Get notified instantly when prices drop or seats become available.',
    icon: 'Bell',
  },
  {
    title: 'Smart Connections',
    description:
      'When direct flights sell out, we automatically find one-stop routes via hubs like Denver or Orlando.',
    icon: 'GitBranch',
  },
  {
    title: 'Trip Planner',
    description:
      'Plan multi-city trips with our route optimizer. Build the perfect spontaneous adventure.',
    icon: 'Route',
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: 'What is PassPilot?',
    answer:
      'PassPilot is a flight search tool built specifically for all-you-can-fly pass holders. We aggregate and display all available pass-eligible flights from your home airport so you can find and book flights in seconds instead of hours.',
  },
  {
    question: 'How does this work with my all-you-can-fly pass?',
    answer:
      'We scan publicly available flight data and filter it to show only pass-eligible flights. When you find a flight you want, we link you directly to the airline\'s booking page. We don\'t handle any booking or payment — that all happens through the airline.',
  },
  {
    question: 'Is this affiliated with any airline?',
    answer:
      'No. PassPilot is an independent third-party tool. We are not sponsored by, endorsed by, or affiliated with Frontier Airlines or any airline. We simply help organize publicly available flight information.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Absolutely. You can cancel at any time with no penalties. Your access continues through the end of your current billing period.',
  },
  {
    question: 'How do I try PassPilot for free?',
    answer:
      'We offer a free 1-day trial so you can experience the full platform. Just sign up with your email — no credit card required. After the trial, plans start at just $0.99/month.',
  },
  {
    question: 'How accurate is the flight data?',
    answer:
      'We update availability data multiple times daily. However, flight availability is dynamic and can change at any time. We always recommend confirming directly on the airline\'s website before booking.',
  },
] as const;
