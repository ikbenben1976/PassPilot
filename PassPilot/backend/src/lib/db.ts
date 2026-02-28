import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || resolve(__dirname, '../../data/passpilot.db');

// Ensure the directory for the database file exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

// Performance pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

export function generateId(): string {
  return randomUUID();
}

// ─── Schema ──────────────────────────────────────────────────────────────────

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      home_airport_code TEXT,
      favorite_destinations TEXT DEFAULT '[]',
      price_alerts_enabled INTEGER DEFAULT 1,
      email_digest TEXT DEFAULT 'daily' CHECK(email_digest IN ('daily','weekly','none')),
      dark_mode INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      stripe_subscription_id TEXT,
      stripe_customer_id TEXT,
      plan TEXT NOT NULL CHECK(plan IN ('monthly','annual')),
      status TEXT NOT NULL DEFAULT 'trialing' CHECK(status IN ('active','canceled','past_due','trialing')),
      current_period_end TEXT NOT NULL,
      cancel_at_period_end INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS flight_cache (
      id TEXT PRIMARY KEY,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      flight_number TEXT NOT NULL,
      price INTEGER NOT NULL,
      gowild_available INTEGER DEFAULT 0,
      seats_remaining INTEGER,
      duration INTEGER NOT NULL,
      stops INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available' CHECK(status IN ('available','limited','sold_out')),
      fetched_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_flight_cache_origin ON flight_cache(origin);
    CREATE INDEX IF NOT EXISTS idx_flight_cache_origin_date ON flight_cache(origin, departure_time);
    CREATE INDEX IF NOT EXISTS idx_flight_cache_expires ON flight_cache(expires_at);
    CREATE INDEX IF NOT EXISTS idx_flight_cache_route ON flight_cache(origin, destination);

    CREATE TABLE IF NOT EXISTS saved_searches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      params TEXT NOT NULL,
      alert_enabled INTEGER DEFAULT 0,
      last_checked TEXT DEFAULT (datetime('now')),
      new_results INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_searches_alert ON saved_searches(alert_enabled);

    CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      target_price INTEGER NOT NULL,
      current_price INTEGER DEFAULT 0,
      triggered INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_price_alerts_route ON price_alerts(origin, destination);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('price_drop','new_route','deal_alert','system')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      action_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      cover_image TEXT DEFAULT '',
      author_name TEXT NOT NULL,
      author_avatar TEXT DEFAULT '',
      author_bio TEXT DEFAULT '',
      category TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      published_at TEXT DEFAULT (datetime('now')),
      read_time INTEGER DEFAULT 5
    );

    CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

    -- Track Frontier data refresh metadata
    CREATE TABLE IF NOT EXISTS data_refresh_log (
      id TEXT PRIMARY KEY,
      origin TEXT NOT NULL,
      destination TEXT,
      flights_fetched INTEGER DEFAULT 0,
      flights_updated INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      status TEXT DEFAULT 'success' CHECK(status IN ('success','partial','failed')),
      error_message TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_data_refresh_origin ON data_refresh_log(origin);

    -- Promotional trial redemptions (1-day free trial, unique per IP + email)
    CREATE TABLE IF NOT EXISTS promo_redemptions (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      ip_address TEXT NOT NULL UNIQUE,
      redeemed_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_promo_email ON promo_redemptions(email);
    CREATE INDEX IF NOT EXISTS idx_promo_ip ON promo_redemptions(ip_address);

    -- Track which airports are actively monitored
    CREATE TABLE IF NOT EXISTS monitored_airports (
      code TEXT PRIMARY KEY,
      priority INTEGER DEFAULT 0,
      last_refreshed TEXT,
      refresh_interval_minutes INTEGER DEFAULT 30,
      active INTEGER DEFAULT 1
    );
  `);
}

export default db;
