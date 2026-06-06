// apps/api/src/services/shopify.js
const axios  = require('axios');
const crypto = require('crypto');
const { Store } = require('@shopify-autopilot/shared');

/**
 * Create an axios client pre-configured for a specific store.
 * Handles Shopify's leaky-bucket rate limit automatically.
 */
function createShopifyClient(shop, accessToken) {
  const client = axios.create({
    baseURL: `https://${shop}/admin/api/2024-01`,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  // Retry on 429 (rate limited) with exponential backoff
  client.interceptors.response.use(
    (res) => res,
    async (err) => {
      const { config, response } = err;
      if (!config) return Promise.reject(err);

      config.__retryCount = config.__retryCount || 0;

      if (response?.status === 429 && config.__retryCount < 3) {
        config.__retryCount += 1;
        const retryAfter = response.headers['retry-after'] || 2;
        const delay = retryAfter * 1000 * config.__retryCount;

        console.warn(`Shopify rate limited. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        return client(config);
      }

      return Promise.reject(err);
    }
  );

  return client;
}

/**
 * Get a Shopify client for a tenant using their stored access token.
 * Always use this in route handlers — never hardcode tokens.
 */
async function getClientForTenant(tenantId) {
  const store = await Store.findOne({ tenantId }).select('+accessToken');
  if (!store) throw new Error(`Store not found for tenant: ${tenantId}`);
  return createShopifyClient(tenantId, store.accessToken);
}

/**
 * Register all webhooks for a store.
 * Called once after OAuth completes.
 */
async function registerWebhooks(shop, accessToken, appUrl) {
  const client = createShopifyClient(shop, accessToken);

  const topics = [
    'orders/create',
    'orders/paid',
    'orders/updated',
    'carts/create',
    'carts/update',
    'inventory_levels/update',
    'app/uninstalled',
  ];

  const results = [];

  for (const topic of topics) {
    try {
      const res = await client.post('/webhooks.json', {
        webhook: {
          topic,
          address: `${appUrl}/api/webhooks/shopify`,
          format: 'json',
        },
      });
      results.push({ topic, status: 'registered', id: res.data.webhook.id });
      console.log(`Webhook registered: ${topic}`);
    } catch (err) {
      // 422 means webhook already exists — not an error
      if (err.response?.status === 422) {
        results.push({ topic, status: 'already_exists' });
      } else {
        console.error(`Failed to register webhook ${topic}:`, err.message);
        results.push({ topic, status: 'failed', error: err.message });
      }
    }
  }

  return results;
}

/**
 * Verify Shopify webhook HMAC signature.
 * CRITICAL: prevents spoofed webhooks from triggering your automation.
 */
function verifyWebhookHmac(rawBody, hmacHeader, secret) {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

module.exports = {
  createShopifyClient,
  getClientForTenant,
  registerWebhooks,
  verifyWebhookHmac,
};