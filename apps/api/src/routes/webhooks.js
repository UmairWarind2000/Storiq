// apps/api/src/routes/webhooks.js
const express = require('express');  
const router  = require('express').Router();
const { ProcessedEvent, queues } = require('@shopify-autopilot/shared');
const { verifyWebhookHmac } = require('../services/shopify');
const { SHOPIFY_API_SECRET } = require('../config/env');

/**
 * POST /api/webhooks/shopify
 *
 * All Shopify webhook topics hit this single endpoint.
 * We fan out to the appropriate Bull queue based on the topic.
 *
 * Security:   HMAC verified before any processing
 * Idempotency: eventId checked in ProcessedEvent before queuing
 */
router.post(
  '/shopify',
  express.raw({ type: 'application/json' }), // need raw body for HMAC
  async (req, res) => {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const topic      = req.headers['x-shopify-topic'];
    const shop       = req.headers['x-shopify-shop-domain'];
    const eventId    = req.headers['x-shopify-webhook-id'];

    // 1. Verify HMAC — reject anything that isn't from Shopify
    const isValid = verifyWebhookHmac(req.body, hmacHeader, SHOPIFY_API_SECRET);
    if (!isValid) {
      console.warn(`Invalid HMAC from ${shop} for topic ${topic}`);
      return res.status(401).json({ error: 'Invalid HMAC' });
    }

    // 2. Always respond 200 immediately — Shopify will retry if we take too long
    res.status(200).json({ received: true });

    // 3. Check idempotency — skip if we already processed this event
    try {
      const alreadyProcessed = await ProcessedEvent.findOne({ eventId });
      if (alreadyProcessed) {
        console.log(`Duplicate webhook skipped: ${eventId} (${topic})`);
        return;
      }

      // Mark as processed BEFORE queuing to prevent race conditions
      await ProcessedEvent.create({ eventId, topic });

    } catch (err) {
      // Duplicate key error means another instance already processed it
      if (err.code === 11000) {
        console.log(`Race condition caught: ${eventId} already being processed`);
        return;
      }
      console.error('ProcessedEvent error:', err.message);
      return;
    }

    // 4. Parse body and fan out to appropriate queue
    let payload;
    try {
      payload = JSON.parse(req.body.toString());
    } catch {
      console.error('Failed to parse webhook body');
      return;
    }

    const jobData = { tenantId: shop, topic, payload, eventId };

    try {
      switch (topic) {
        case 'orders/create':
        case 'orders/paid':
        case 'orders/updated':
          await queues.webhook.add('order', jobData, { priority: 1 });
          break;

        case 'carts/create':
        case 'carts/update':
          // Delayed job — abandoned cart check runs 1 hour after cart creation
          await queues.webhook.add('cart', jobData, {
            delay: topic === 'carts/create' ? 60 * 60 * 1000 : 0,
            priority: 2,
          });
          break;

        case 'inventory_levels/update':
          await queues.webhook.add('inventory', jobData, { priority: 3 });
          break;

        case 'app/uninstalled':
          await queues.webhook.add('uninstall', jobData, { priority: 1 });
          break;

        default:
          console.log(`Unhandled webhook topic: ${topic}`);
      }

      console.log(`Webhook queued: ${topic} for ${shop} (${eventId})`);
    } catch (err) {
      console.error(`Failed to queue webhook ${topic}:`, err.message);
    }
  }
);

module.exports = router;

// Need express here for raw body parsing on this specific route
// const express = require('express');