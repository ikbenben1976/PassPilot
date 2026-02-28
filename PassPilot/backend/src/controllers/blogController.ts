import type { Response } from 'express';
import db from '../lib/db.js';
import type { AuthenticatedRequest, BlogPostRow } from '../types/index.js';

/**
 * GET /api/blog?category=tips
 */
export const listPosts = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { category } = req.query;

    let rows: BlogPostRow[];
    if (category) {
      rows = db
        .prepare('SELECT * FROM blog_posts WHERE category = ? ORDER BY published_at DESC')
        .all(String(category)) as BlogPostRow[];
    } else {
      rows = db
        .prepare('SELECT * FROM blog_posts ORDER BY published_at DESC')
        .all() as BlogPostRow[];
    }

    const posts = rows.map(formatPost);
    res.json({ posts });
  } catch (error) {
    console.error('List posts error:', error);
    res.status(500).json({ error: 'Failed to load blog posts' });
  }
};

/**
 * GET /api/blog/:slug
 */
export const getPost = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { slug } = req.params;

    const row = db
      .prepare('SELECT * FROM blog_posts WHERE slug = ?')
      .get(slug) as BlogPostRow | undefined;

    if (!row) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json({ post: formatPost(row) });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to load post' });
  }
};

function formatPost(row: BlogPostRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image,
    author: {
      name: row.author_name,
      avatar: row.author_avatar,
      bio: row.author_bio,
    },
    category: row.category,
    tags: JSON.parse(row.tags || '[]'),
    publishedAt: row.published_at,
    readTime: row.read_time,
  };
}
