import type { Request, Response } from 'express';
import Stripe from 'stripe';
import db, { generateId } from '../lib/db.js';
import type { AuthenticatedRequest, SubscriptionRow } from '../types/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const PRICES: Record<string, { amount: number; interval: 'month' | 'year' }> = {
  monthly: { amount: 299, interval: 'month' },
  annual: { amount: 1188, interval: 'year' },
};

/**
 * GET /api/subscription
 */
export const getSubscription = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;

    const sub = db
      .prepare('SELECT * FROM subscriptions WHERE user_id = ?')
      .get(userId) as SubscriptionRow | undefined;

    if (!sub) {
      res.json({ subscription: null });
      return;
    }

    res.json({
      subscription: {
        id: sub.id,
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to load subscription' });
  }
};

/**
 * POST /api/subscription
 *
 * Create or update subscription. Returns a Stripe client secret for
 * completing payment on the frontend.
 */
export const createSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { plan } = req.body;

    if (!plan || !PRICES[plan]) {
      res.status(400).json({ error: 'Plan must be "monthly" or "annual"' });
      return;
    }

    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as
      | { email: string }
      | undefined;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get or create Stripe customer
    const existingSub = db
      .prepare('SELECT * FROM subscriptions WHERE user_id = ?')
      .get(userId) as SubscriptionRow | undefined;

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Create Stripe subscription with payment
    const priceData = PRICES[plan]!;
    // Use `as any` for SDK version compat — runtime API is stable
    const stripeSub: Record<string, unknown> = await (stripe.subscriptions.create as Function)({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: priceData.amount,
            recurring: { interval: priceData.interval },
            product_data: { name: `PassPilot — ${plan === 'annual' ? 'Annual' : 'Monthly'}` },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = stripeSub['latest_invoice'] as Record<string, unknown>;
    const paymentIntent = invoice['payment_intent'] as Record<string, unknown>;
    const periodEnd = new Date((stripeSub['current_period_end'] as number) * 1000).toISOString();

    if (existingSub) {
      db.prepare(
        `UPDATE subscriptions
         SET stripe_subscription_id = ?, stripe_customer_id = ?, plan = ?,
             status = 'active', current_period_end = ?, cancel_at_period_end = 0,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      ).run(stripeSub['id'], customerId, plan, periodEnd, userId);
    } else {
      db.prepare(
        `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, stripe_customer_id, plan, status, current_period_end)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      ).run(generateId(), userId, stripeSub['id'], customerId, plan, periodEnd);
    }

    res.json({ clientSecret: paymentIntent['client_secret'] });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

/**
 * DELETE /api/subscription
 *
 * Cancel subscription at end of current period.
 */
export const cancelSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const sub = db
      .prepare('SELECT * FROM subscriptions WHERE user_id = ?')
      .get(userId) as SubscriptionRow | undefined;

    if (!sub) {
      res.status(404).json({ error: 'No active subscription' });
      return;
    }

    // Cancel on Stripe (at period end)
    if (sub.stripe_subscription_id) {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      } as Stripe.SubscriptionUpdateParams);
    }

    // Update local record
    db.prepare(
      `UPDATE subscriptions
       SET status = 'canceled', cancel_at_period_end = 1, updated_at = datetime('now')
       WHERE user_id = ?`,
    ).run(userId);

    res.json({ message: 'Subscription will cancel at end of billing period' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events for subscription lifecycle.
 * NOTE: This endpoint requires raw body (not JSON-parsed).
 */
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, endpointSecret);
  } catch (err) {
    console.error('Stripe webhook verification failed:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  const obj = event.data.object as unknown as Record<string, unknown>;

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const subId = obj['subscription'] as string | undefined;
      if (subId) {
        db.prepare(
          `UPDATE subscriptions SET status = 'active', updated_at = datetime('now')
           WHERE stripe_subscription_id = ?`,
        ).run(subId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const subId = obj['subscription'] as string | undefined;
      if (subId) {
        db.prepare(
          `UPDATE subscriptions SET status = 'past_due', updated_at = datetime('now')
           WHERE stripe_subscription_id = ?`,
        ).run(subId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      db.prepare(
        `UPDATE subscriptions SET status = 'canceled', updated_at = datetime('now')
         WHERE stripe_subscription_id = ?`,
      ).run(obj['id']);
      break;
    }

    case 'customer.subscription.updated': {
      const periodEnd = new Date((obj['current_period_end'] as number) * 1000).toISOString();
      db.prepare(
        `UPDATE subscriptions
         SET current_period_end = ?, cancel_at_period_end = ?, updated_at = datetime('now')
         WHERE stripe_subscription_id = ?`,
      ).run(periodEnd, obj['cancel_at_period_end'] ? 1 : 0, obj['id']);
      break;
    }
  }

  res.json({ received: true });
};
