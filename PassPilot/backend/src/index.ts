import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

import { initSchema } from './lib/db.js';
import { seedIfEmpty } from './lib/seed.js';
import { requireAuth } from './middleware/auth.js';
import { optionalAuth } from './middleware/auth.js';
import { requireSubscription } from './middleware/subscription.js';
import { rateLimit } from './middleware/rateLimit.js';
import { stripeWebhook } from './controllers/subscriptionController.js';
import { startScheduler } from './jobs/scheduler.js';

import authRoutes from './routes/auth.js';
import flightRoutes from './routes/flights.js';
import savedSearchRoutes from './routes/savedSearches.js';
import alertRoutes from './routes/alerts.js';
import subscriptionRoutes from './routes/subscription.js';
import blogRoutes from './routes/blog.js';
import notificationRoutes from './routes/notifications.js';
import promoRoutes from './routes/promo.js';
import { getAllAirports, searchAirports } from './lib/airports.js';

// ─── Initialize Database ─────────────────────────────────────────────────────

initSchema();
console.log('[DB] Schema initialized');

// Auto-seed flight data if the cache is empty (no manual step needed)
seedIfEmpty();

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();

// CORS
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));

// Stripe webhook needs raw body — mount BEFORE json parser
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// JSON body parser for all other routes
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} ${_res.statusCode} ${ms}ms`);
  });
  next();
});

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'passpilot-api',
  });
});

// ─── Public Routes ───────────────────────────────────────────────────────────

// Auth (signup/login are public, /me requires auth — handled in route file)
app.use('/api/auth', rateLimit(20, 60_000), authRoutes);

// Blog is public
app.use('/api/blog', blogRoutes);

// Promo trial (public, rate-limited)
app.use('/api/promo', rateLimit(5, 60_000), promoRoutes);

// Airport lookup (public, used for autocomplete)
app.get('/api/airports', (_req, res) => {
  res.json({ airports: getAllAirports() });
});

app.get('/api/airports/search', (req, res) => {
  const q = String(req.query.q || '');
  if (!q) {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }
  res.json({ airports: searchAirports(q) });
});

// ─── Authenticated Routes ────────────────────────────────────────────────────

// Subscription management (requires auth only)
app.use('/api/subscription', requireAuth, subscriptionRoutes);

// Notifications (requires auth only)
app.use('/api/notifications', requireAuth, notificationRoutes);

// ─── Subscriber-Only Routes ──────────────────────────────────────────────────

// Flight search, calendar, destinations (requires auth + active subscription)
app.use('/api/flights', requireAuth, requireSubscription, rateLimit(60, 60_000), flightRoutes);

// Saved searches (requires auth + active subscription)
app.use('/api/saved-searches', requireAuth, requireSubscription, savedSearchRoutes);

// Alerts (requires auth + active subscription)
app.use('/api/alerts', requireAuth, requireSubscription, alertRoutes);

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 5001;
const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`[Server] PassPilot API running on port ${PORT}`);
  console.log(`[Server] Endpoints:`);
  console.log(`  - Health:         GET  /api/health`);
  console.log(`  - Auth:           POST /api/auth/signup, /api/auth/login, GET /api/auth/me`);
  console.log(`  - Flights:        POST /api/flights/search, GET /api/flights/calendar, /api/flights/destinations`);
  console.log(`  - Saved Searches: GET|POST|DELETE /api/saved-searches`);
  console.log(`  - Alerts:         GET|POST|DELETE /api/alerts`);
  console.log(`  - Subscription:   GET|POST|DELETE /api/subscription`);
  console.log(`  - Blog:           GET  /api/blog, /api/blog/:slug`);
  console.log(`  - Notifications:  GET  /api/notifications, PATCH /api/notifications/:id/read`);
  console.log(`  - Airports:       GET  /api/airports, /api/airports/search?q=`);
  console.log(`  - Promo:          POST /api/promo/redeem, GET /api/promo/check`);
  console.log(`  - Webhook:        POST /api/webhooks/stripe`);

  // Start background jobs
  startScheduler();
});

export default app;
