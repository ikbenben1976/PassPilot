import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MOCK_BLOG_POSTS } from '@/lib/mockData';
import { formatDate } from '@/lib/format';
import type { BlogCategory } from '@/types';

const CATEGORY_LABELS: Record<BlogCategory, string> = {
  tips: 'Tips & Guides',
  destinations: 'Destinations',
  'pass-news': 'Pass News',
  'travel-hacks': 'Travel Hacks',
  deals: 'Deals',
};

const CATEGORY_COLORS: Record<BlogCategory, 'brand' | 'success' | 'warning' | 'info' | 'danger'> = {
  tips: 'brand',
  destinations: 'success',
  'pass-news': 'warning',
  'travel-hacks': 'info',
  deals: 'danger',
};

export function BlogPage() {
  const featured = MOCK_BLOG_POSTS[0]!;
  const rest = MOCK_BLOG_POSTS.slice(1);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="container-wide py-12">
          <Badge variant="brand" className="mb-4">Blog</Badge>
          <h1 className="text-4xl font-display font-bold text-surface-900">
            Pass Tips, Guides & News
          </h1>
          <p className="mt-3 text-surface-500 max-w-2xl">
            Expert advice for getting the most out of your all-you-can-fly pass.
            Destination guides, booking strategies, and the latest news.
          </p>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-brand-600 text-white">
              All
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-surface-200 text-surface-600 hover:border-surface-300 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-wide py-10">
        {/* Featured post */}
        <Link to={`/blog/${featured.slug}`}>
          <Card
            variant="interactive"
            padding="none"
            className="overflow-hidden mb-10"
          >
            <div className="grid md:grid-cols-2">
              {/* Image placeholder */}
              <div className="bg-gradient-to-br from-brand-400 to-brand-700 min-h-[250px] md:min-h-[300px] flex items-center justify-center">
                <span className="text-6xl opacity-30">&#9992;</span>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <Badge
                  variant={CATEGORY_COLORS[featured.category]}
                  className="w-fit mb-3"
                >
                  {CATEGORY_LABELS[featured.category]}
                </Badge>
                <h2 className="text-2xl font-bold text-surface-900 mb-3">
                  {featured.title}
                </h2>
                <p className="text-surface-500 leading-relaxed mb-4">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-surface-400">
                  <span>{featured.author.name}</span>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featured.readTime} min read
                  </span>
                  <span>&middot;</span>
                  <span>{formatDate(featured.publishedAt)}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        {/* Post grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <Card variant="interactive" padding="none" className="h-full flex flex-col overflow-hidden">
                {/* Image placeholder */}
                <div className="bg-gradient-to-br from-surface-200 to-surface-300 h-44 flex items-center justify-center">
                  <span className="text-4xl opacity-20">&#9992;</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <Badge
                    variant={CATEGORY_COLORS[post.category]}
                    size="sm"
                    className="w-fit mb-2"
                  >
                    {CATEGORY_LABELS[post.category]}
                  </Badge>
                  <h3 className="text-lg font-semibold text-surface-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-surface-500 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
                    <span className="text-xs text-surface-400">
                      {post.readTime} min read
                    </span>
                    <span className="text-xs text-brand-600 font-medium flex items-center gap-1">
                      Read more <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
