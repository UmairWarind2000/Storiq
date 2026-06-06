// apps/worker/src/worker.js
require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');
const { queues } = require('@shopify-autopilot/shared');
const { Store } = require('@shopify-autopilot/shared');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_autopilot';

async function startWorker() {
  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  console.log('[Worker] MongoDB connected');

  // Register job processors
  // The number argument = max concurrent jobs of that type
// Register job processors — each named job type must be registered explicitly
queues.analytics.process('nightly-analysis', 2, require('./processors/analytics'));
queues.analytics.process('restock-check',    2, require('./processors/analytics'));

queues.campaign.process('sync-to-shopify',   2, require('./processors/campaign'));
queues.campaign.process('check-roi',         2, require('./processors/campaign'));
queues.campaign.process('detect-campaigns',  2, require('./processors/campaign')); 

queues.email.process('abandoned-cart',       5, require('./processors/email'));

queues.webhook.process('order',              10, require('./processors/webhook'));
queues.webhook.process('cart',               10, require('./processors/webhook'));
queues.webhook.process('inventory',          10, require('./processors/webhook'));
queues.webhook.process('uninstall',          10, require('./processors/webhook'));

  console.log('[Worker] All processors registered');

  // ── Nightly AI analysis cron ──────────────────────────────────────────────
  // Runs at 2:00 AM every night
  // Finds all active stores and queues one analytics job per tenant
  cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] Starting nightly analytics + campaign detection...');

  try {
    const stores = await Store.find(
      { accessToken: { $ne: 'REVOKED' } },
      { tenantId: 1 }
    );

    for (const store of stores) {
      // Step 1: update velocity data
      await queues.analytics.add('nightly-analysis', { tenantId: store.tenantId }, {
        jobId: `analytics-${store.tenantId}-${new Date().toISOString().split('T')[0]}`,
      });

      // Step 2: detect slow products and create campaigns
      await queues.campaign.add('detect-campaigns', { tenantId: store.tenantId }, {
        jobId: `detect-${store.tenantId}-${new Date().toISOString().split('T')[0]}`,
      });
    }
  } catch (err) {
    console.error('[Cron] Nightly run failed:', err.message);
  }
}, { timezone: 'UTC' });

  // ── Restock alert cron ────────────────────────────────────────────────────
  // Runs at 8:00 AM every morning — after nightly analysis has updated velocity data
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Starting restock alert check...');

    try {
      const stores = await Store.find(
        { accessToken: { $ne: 'REVOKED' } },
        { tenantId: 1 }
      );

      for (const store of stores) {
        await queues.analytics.add(
          'restock-check',
          { tenantId: store.tenantId },
          {
            jobId: `restock-${store.tenantId}-${new Date().toISOString().split('T')[0]}`,
          }
        );
      }
    } catch (err) {
      console.error('[Cron] Restock check failed to schedule:', err.message);
    }
  }, {
    timezone: 'UTC',
  });

  console.log('[Worker] Cron jobs scheduled');
  console.log('[Worker] Ready and listening on all queues');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Worker] SIGTERM received, closing queues...');
    await Promise.all(Object.values(queues).map(q => q.close()));
    await mongoose.disconnect();
    console.log('[Worker] Shutdown complete');
    process.exit(0);
  });
}

startWorker().catch((err) => {
  console.error('[Worker] Failed to start:', err);
  process.exit(1);
});