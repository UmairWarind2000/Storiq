// packages/shared/services/restockService.js
const { Product, Store } = require('../models');
const { sendEmail }      = require('./emailService');

/**
 * Check inventory levels and send restock alerts.
 * Called by the nightly restock-check job.
 */
async function checkAndAlertRestock(tenantId) {
  // Find products that will run out within 14 days at current velocity
  const urgentProducts = await Product.find({
    tenantId,
    status:           'active',
    velocityPerDay:   { $gt: 0 },
    daysUntilStockout: { $lte: 14, $gt: 0 },
  }).sort({ daysUntilStockout: 1 }); // most urgent first

  if (urgentProducts.length === 0) {
    console.log(`[Restock] No urgent products for ${tenantId}`);
    return [];
  }

  console.log(`[Restock] ${urgentProducts.length} products need restocking for ${tenantId}`);

  // Get store owner email
  const store = await Store.findOne({ tenantId });
  if (!store) return urgentProducts;

  // Build alert email
  const productRows = urgentProducts.map(p =>
    `• ${p.title}: ${p.inventory} units left, ~${p.daysUntilStockout} days remaining ` +
    `(selling ${p.velocityPerDay.toFixed(1)}/day)`
  ).join('\n');

  const subject = `⚠ Restock alert: ${urgentProducts.length} product${urgentProducts.length > 1 ? 's' : ''} running low`;

  const text = `Hi,

Your Storiq dashboard has detected ${urgentProducts.length} product(s) that need restocking soon:

${productRows}

Log in to your dashboard to take action.

— Storiq Autopilot`;

  const html = `
    <h2>Restock Alert</h2>
    <p>${urgentProducts.length} product(s) are running low:</p>
    <ul>
      ${urgentProducts.map(p => `
        <li>
          <strong>${p.title}</strong>: ${p.inventory} units left,
          ~${p.daysUntilStockout} days remaining
          (selling ${p.velocityPerDay.toFixed(1)}/day)
        </li>
      `).join('')}
    </ul>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard">
      View dashboard
    </a></p>
  `;

  // Send to store owner email (use tenantId/shopify domain as fallback)
  const ownerEmail = store.ownerEmail || process.env.ALERT_EMAIL;

  if (ownerEmail) {
    await sendEmail({ to: ownerEmail, subject, html, text });
  } else {
    console.log('[Restock] No owner email set — skipping email, logging alert:');
    console.log(text);
  }

  return urgentProducts;
}

module.exports = { checkAndAlertRestock };