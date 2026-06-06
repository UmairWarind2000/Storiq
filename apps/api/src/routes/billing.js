// apps/api/src/routes/billing.js
const router  = require('express').Router();
const tenant  = require('../middleware/tenant');
const {
  createCheckoutSession,
  createPortalSession,
  getOrCreateCustomer,
  handleWebhookEvent,
} = require('../services/stripeService');

// POST /api/billing/webhook
// Raw body required — mounted BEFORE express.json() in app.js
// No auth middleware — Stripe calls this directly
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    await handleWebhookEvent(req.body, signature);
    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe webhook error]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// All routes below require authentication
router.use(tenant);

// POST /api/billing/checkout — create Stripe Checkout session
router.post('/checkout', async (req, res, next) => {
  try {
    const { plan = 'pro' } = req.body;
    const { tenantId, store } = req;

    if (store.plan === plan) {
      return res.status(400).json({ error: `Already on ${plan} plan` });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await createCheckoutSession({
      tenantId,
      plan,
      successUrl: `${frontendUrl}/dashboard?upgraded=true`,
      cancelUrl:  `${frontendUrl}/dashboard`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/portal — open Stripe customer portal
router.post('/portal', async (req, res, next) => {
  try {
    const { store, tenantId } = req;

    if (!store.stripeCustomerId) {
      return res.status(400).json({
        error: 'No billing account found. Please upgrade first.',
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await createPortalSession({
      customerId: store.stripeCustomerId,
      returnUrl:  `${frontendUrl}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/status — current plan info
router.get('/status', async (req, res) => {
  const { store } = req;
  res.json({
    plan:                 store.plan,
    stripeCustomerId:     store.stripeCustomerId     || null,
    stripeSubscriptionId: store.stripeSubscriptionId || null,
    features: {
      aiDashboard:        true,
      campaignDetection:  true,
      campaignApproval:   store.plan === 'pro',
      autoApprove:        store.plan === 'pro',
      restockAlerts:      store.plan === 'pro',
      abandonedCart:      store.plan === 'pro',
    },
  });
});

module.exports = router;