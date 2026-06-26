// apps/api/scripts/seed.js
require('dotenv').config({ path: '../../../.env' });
const mongoose = require('mongoose');
const { Order, Product, Store, Campaign, CartEvent } = require('@shopify-autopilot/shared');

const TENANT = 'demo-store.myshopify.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_autopilot';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Demo store on Pro plan so recruiters see ALL features unlocked
  await Store.findOneAndUpdate(
    { tenantId: TENANT },
    { tenantId: TENANT, accessToken: 'dev-token', shopName: 'demo-store', plan: 'pro' },
    { upsert: true }
  );

  // Clear existing demo data so reseeding is always fresh
  await Order.deleteMany({ tenantId: TENANT });
  await Product.deleteMany({ tenantId: TENANT });
  await Campaign.deleteMany({ tenantId: TENANT });
  await CartEvent.deleteMany({ tenantId: TENANT });

  // ── Products ──────────────────────────────────────────────────────────────
  const products = await Product.insertMany([
    { tenantId: TENANT, shopifyProductId: 'p1', title: 'Classic White Tee',  price: 29.99,  inventory: 150, status: 'active', velocityPerDay: 4.2, unitsSold7d: 29, unitsSold30d: 124 },
    { tenantId: TENANT, shopifyProductId: 'p2', title: 'Slim Fit Jeans',     price: 79.99,  inventory: 15,  status: 'active', velocityPerDay: 2.8, unitsSold7d: 19, unitsSold30d: 84, daysUntilStockout: 11 },
    { tenantId: TENANT, shopifyProductId: 'p3', title: 'Running Sneakers',   price: 119.99, inventory: 8,   status: 'active', velocityPerDay: 1.4, unitsSold7d: 10, unitsSold30d: 42, daysUntilStockout: 5  },
    { tenantId: TENANT, shopifyProductId: 'p4', title: 'Leather Wallet',     price: 49.99,  inventory: 200, status: 'active', velocityPerDay: 0.3, unitsSold7d: 2,  unitsSold30d: 9   },
    { tenantId: TENANT, shopifyProductId: 'p5', title: 'Wool Winter Scarf',  price: 39.99,  inventory: 300, status: 'active', velocityPerDay: 0.1, unitsSold7d: 1,  unitsSold30d: 3   },
  ]);

  // ── Orders — 30 days of history ──────────────────────────────────────────
  const orders = [];
  const now = new Date();

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const ordersPerDay = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < ordersPerDay; i++) {
      const product  = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const total    = parseFloat((product.price * quantity).toFixed(2));

      orders.push({
        tenantId:         TENANT,
        shopifyOrderId:   `order-${daysAgo}-${i}`,
        orderNumber:      1000 + orders.length,
        totalPrice:       total,
        subtotalPrice:    total,
        currency:         'USD',
        financialStatus:  'paid',
        createdAtShopify: date,
        lineItems: [{
          shopifyProductId: product.shopifyProductId,
          title:    product.title,
          quantity,
          price:    product.price,
        }],
      });
    }
  }
  await Order.insertMany(orders);

  // ── Campaigns — mix of pending, active, completed ────────────────────────
  const campaignStartsAt = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const campaignEndsAt   = new Date(now + 4 * 24 * 60 * 60 * 1000);

  await Campaign.insertMany([
    {
      tenantId:        TENANT,
      productId:       'p5',
      productTitle:    'Wool Winter Scarf',
      discountPct:     25,
      durationDays:    7,
      confidenceScore: 0.91,
      reasoning:       'Wool Winter Scarf has sold only 1 unit in 7 days with 300 units in stock. A 25% discount should accelerate clearance.',
      status:          'pending_approval',
      startsAt:        now,
      endsAt:          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      tenantId:        TENANT,
      productId:       'p4',
      productTitle:    'Leather Wallet',
      discountPct:     15,
      durationDays:    14,
      confidenceScore: 0.78,
      reasoning:       'Leather Wallet has low velocity at 0.3 units/day. A moderate discount should help move inventory.',
      status:          'active',
      shopifyPriceRuleId:    'demo-rule-001',
      shopifyDiscountCodeId: 'demo-code-001',
      startsAt:        campaignStartsAt,
      endsAt:          campaignEndsAt,
      revenueGenerated: 342.50,
    },
    {
      tenantId:        TENANT,
      productId:       'p3',
      productTitle:    'Running Sneakers',
      discountPct:     20,
      durationDays:    7,
      confidenceScore: 0.84,
      reasoning:       'Running Sneakers showed strong response to a discount campaign — fully converted before stock ran low.',
      status:          'completed',
      shopifyPriceRuleId:    'demo-rule-002',
      shopifyDiscountCodeId: 'demo-code-002',
      startsAt:        new Date(now - 20 * 24 * 60 * 60 * 1000),
      endsAt:          new Date(now - 13 * 24 * 60 * 60 * 1000),
      revenueGenerated: 891.20,
    },
  ]);

  // ── Abandoned cart events — mix of converted / pending recovery ─────────
  await CartEvent.insertMany([
    {
      tenantId:      TENANT,
      shopifyCartId: 'demo-cart-001',
      customerEmail: 'sarah.demo@example.com',
      lineItems: [{ productTitle: 'Classic White Tee', price: 29.99, quantity: 2 }],
      totalValue:    59.98,
      recoveryEmailSent:   true,
      recoveryEmailSentAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      converted:     true,
      createdAt:     new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      tenantId:      TENANT,
      shopifyCartId: 'demo-cart-002',
      customerEmail: 'james.demo@example.com',
      lineItems: [{ productTitle: 'Running Sneakers', price: 119.99, quantity: 1 }],
      totalValue:    119.99,
      recoveryEmailSent:   true,
      recoveryEmailSentAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      converted:     false,
      createdAt:     new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      tenantId:      TENANT,
      shopifyCartId: 'demo-cart-003',
      customerEmail: 'priya.demo@example.com',
      lineItems: [
        { productTitle: 'Slim Fit Jeans', price: 79.99, quantity: 1 },
        { productTitle: 'Classic White Tee', price: 29.99, quantity: 1 },
      ],
      totalValue:    109.98,
      recoveryEmailSent:   false,
      converted:     false,
      createdAt:     new Date(now - 6 * 60 * 60 * 1000),
    },
  ]);

  console.log(`Seeded for ${TENANT}:`);
  console.log(`  - ${products.length} products`);
  console.log(`  - ${orders.length} orders`);
  console.log(`  - 3 campaigns (pending, active, completed)`);
  console.log(`  - 3 abandoned cart events`);
  console.log(`  - Plan: Pro (all features unlocked)`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});