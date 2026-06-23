// apps/api/scripts/seed.js
require('dotenv').config({ path: '../../../.env' });
const mongoose = require('mongoose');
const { Order, Product, Store } = require('@shopify-autopilot/shared');

const TENANT = 'demo-store.myshopify.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_autopilot';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await Store.findOneAndUpdate(
    { tenantId: TENANT },
    { tenantId: TENANT, accessToken: 'dev-token', shopName: 'demo-store', plan: 'free' },
    { upsert: true }
  );

  await Order.deleteMany({ tenantId: TENANT });
  await Product.deleteMany({ tenantId: TENANT });

  const products = await Product.insertMany([
    { tenantId: TENANT, shopifyProductId: 'p1', title: 'Classic White Tee',  price: 29.99,  inventory: 150, status: 'active', velocityPerDay: 4.2, unitsSold7d: 29, unitsSold30d: 124 },
    { tenantId: TENANT, shopifyProductId: 'p2', title: 'Slim Fit Jeans',     price: 79.99,  inventory: 80,  status: 'active', velocityPerDay: 2.8, unitsSold7d: 19, unitsSold30d: 84  },
    { tenantId: TENANT, shopifyProductId: 'p3', title: 'Running Sneakers',   price: 119.99, inventory: 8,   status: 'active', velocityPerDay: 1.4, unitsSold7d: 10, unitsSold30d: 42, daysUntilStockout: 5 },
    { tenantId: TENANT, shopifyProductId: 'p4', title: 'Leather Wallet',     price: 49.99,  inventory: 15,  status: 'active', velocityPerDay: 1.3, unitsSold7d: 9,  unitsSold30d: 30, daysUntilStockout: 11 },
    { tenantId: TENANT, shopifyProductId: 'p5', title: 'Wool Winter Scarf',  price: 39.99,  inventory: 300, status: 'active', velocityPerDay: 0.1, unitsSold7d: 1,  unitsSold30d: 3   },
  ]);

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

  console.log(`Seeded ${products.length} products and ${orders.length} orders for ${TENANT}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});