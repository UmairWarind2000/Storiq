// apps/api/src/routes/auth.js
const router = require('express').Router();
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const axios  = require('axios');
const { Store } = require('@shopify-autopilot/shared');
const { registerWebhooks } = require('../services/shopify');
const {
  JWT_SECRET,
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  APP_URL,
  NODE_ENV,
} = require('../config/env');

const nonceStore = new Set();

function issueToken(tenantId) {
  return jwt.sign({ tenantId }, JWT_SECRET, { expiresIn: '7d' });
}

// ─── STEP 1: Merchant clicks "Install" on Shopify ────────────────────────────
router.get('/shopify', (req, res) => {
  const { shop } = req.query;

  if (!shop || !shop.includes('.myshopify.com')) {
    return res.status(400).json({ error: 'Invalid shop parameter' });
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  nonceStore.add(nonce);
  setTimeout(() => nonceStore.delete(nonce), 10 * 60 * 1000);

  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SHOPIFY_SCOPES}` +
    `&redirect_uri=${APP_URL}/api/auth/shopify/callback` +
    `&state=${nonce}`;

  res.redirect(authUrl);
});

// ─── STEP 2: Shopify redirects back after merchant approves ──────────────────
router.get('/shopify/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query;

  if (!nonceStore.has(state)) {
    return res.status(403).json({ error: 'Invalid state parameter' });
  }
  nonceStore.delete(state);

  const params = Object.keys(req.query)
    .filter((k) => k !== 'hmac')
    .sort()
    .map((k) => `${k}=${req.query[k]}`)
    .join('&');

  const computedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(params)
    .digest('hex');

  if (computedHmac !== hmac) {
    return res.status(403).json({ error: 'HMAC validation failed' });
  }

  try {
    const tokenRes = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id:     SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }
    );

    const { access_token } = tokenRes.data;

    const store = await Store.findOneAndUpdate(
      { tenantId: shop },
      {
        tenantId:    shop,
        accessToken: access_token,
        shopName:    shop.replace('.myshopify.com', ''),
        installedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    if (!store.webhooksRegistered) {
      await registerWebhooks(shop, access_token, APP_URL);
      await Store.findOneAndUpdate(
        { tenantId: shop },
        { webhooksRegistered: true }
      );
    }

    const token = issueToken(shop);
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?token=${token}`
    );

  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.status(500).json({ error: 'OAuth failed', detail: err.message });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', require('../middleware/tenant'), async (req, res) => {
  res.json({
    tenantId: req.tenantId,
    plan:     req.store.plan,
    shopName: req.store.shopName,
  });
});

// ─── DEMO LOGIN — works in production too, but only for the fixed demo store ──
// In development, allows ANY tenantId for convenient testing.
// In production, only allows the fixed demo-store tenant to prevent abuse
// of your live API by random visitors creating arbitrary fake stores.
router.post('/dev-token', async (req, res, next) => {
  try {
    const { tenantId, plan } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    if (NODE_ENV === 'production' && tenantId !== 'demo-store.myshopify.com') {
      return res.status(403).json({
        error: 'Demo login only available for demo-store.myshopify.com in production',
      });
    }

    await Store.findOneAndUpdate(
      { tenantId },
      {
        tenantId,
        accessToken: 'dev-token',
        shopName:    tenantId,
        plan:        plan || 'free',
      },
      { upsert: true, new: true }
    );

    res.json({
      token:    issueToken(tenantId),
      tenantId,
      plan:     plan || 'free',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.issueToken = issueToken;