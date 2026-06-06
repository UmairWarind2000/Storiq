// apps/worker/src/processors/analytics.js
const { Order, Product, AiSummary }  = require('@shopify-autopilot/shared');
const { checkAndAlertRestock }       = require('@shopify-autopilot/shared/services/restockService');

module.exports = async function analyticsProcessor(job) {
  console.log(`[Analytics] Processing ${job.name} for ${job.data.tenantId}`);

  if (job.name === 'nightly-analysis') {
    await runNightlyAnalysis(job.data.tenantId);
  } else if (job.name === 'restock-check') {
    await runRestockCheck(job.data.tenantId);
  }
};

async function runNightlyAnalysis(tenantId) {
  const now   = new Date();
  const day7  = new Date(now - 7  * 24 * 60 * 60 * 1000);
  const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  // 1. Calculate sales velocity per product over last 7 days
  const salesData = await Order.aggregate([
    {
      $match: {
        tenantId,
        financialStatus:  'paid',
        createdAtShopify: { $gte: day7 },
      },
    },
    { $unwind: '$lineItems' },
    {
      $group: {
        _id:         '$lineItems.shopifyProductId',
        unitsSold7d: { $sum: '$lineItems.quantity' },
      },
    },
  ]);

  const salesData30 = await Order.aggregate([
    {
      $match: {
        tenantId,
        financialStatus:  'paid',
        createdAtShopify: { $gte: day30 },
      },
    },
    { $unwind: '$lineItems' },
    {
      $group: {
        _id:          '$lineItems.shopifyProductId',
        unitsSold30d: { $sum: '$lineItems.quantity' },
      },
    },
  ]);

  // Build lookup maps
  const sales7Map  = Object.fromEntries(salesData.map(d   => [d._id, d.unitsSold7d]));
  const sales30Map = Object.fromEntries(salesData30.map(d => [d._id, d.unitsSold30d]));

  // 2. Update velocity on each product
  const products = await Product.find({ tenantId, status: 'active' });

  const bulkOps = products.map((product) => {
    const unitsSold7d       = sales7Map[product.shopifyProductId]  || 0;
    const unitsSold30d      = sales30Map[product.shopifyProductId] || 0;
    const velocityPerDay    = unitsSold7d / 7;
    const daysUntilStockout = velocityPerDay > 0
      ? Math.floor(product.inventory / velocityPerDay)
      : null;

    return {
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            unitsSold7d,
            unitsSold30d,
            velocityPerDay,
            daysUntilStockout,
            lastAnalyzedAt: new Date(),
          },
        },
      },
    };
  });

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps);
    console.log(`[Analytics] Updated velocity for ${bulkOps.length} products (${tenantId})`);
  }

  // 3. Invalidate AI summary so it regenerates on next dashboard load
  await AiSummary.findOneAndUpdate(
    { tenantId },
    { expiresAt: new Date() },
    { upsert: false }
  );
}

async function runRestockCheck(tenantId) {
  const alerts = await checkAndAlertRestock(tenantId);
  console.log(`[Analytics] Restock check done: ${alerts.length} alerts for ${tenantId}`);
}