// apps/worker/src/processors/webhook.js
const { Order, Product, Store, CartEvent } = require('@shopify-autopilot/shared');

module.exports = async function webhookProcessor(job) {
  const { tenantId, topic, payload } = job.data;

  console.log(`Processing webhook: ${topic} for ${tenantId}`);

  switch (topic) {
    case 'orders/create':
    case 'orders/paid':
      await handleOrder(tenantId, payload);
      break;

    case 'carts/create':
    case 'carts/update':
      await handleCart(tenantId, payload, topic);
      break;

    case 'inventory_levels/update':
      await handleInventory(tenantId, payload);
      break;

    case 'app/uninstalled':
      await handleUninstall(tenantId);
      break;

    default:
      console.log(`No handler for topic: ${topic}`);
  }
};

// ─── Order handler ────────────────────────────────────────────────────────────
async function handleOrder(tenantId, payload) {
  const orderData = {
    tenantId,
    shopifyOrderId:   String(payload.id),
    orderNumber:      payload.order_number,
    totalPrice:       parseFloat(payload.total_price || 0),
    subtotalPrice:    parseFloat(payload.subtotal_price || 0),
    totalTax:         parseFloat(payload.total_tax || 0),
    currency:         payload.currency,
    financialStatus:  payload.financial_status,
    fulfillmentStatus: payload.fulfillment_status,
    customerEmail:    payload.email,
    createdAtShopify: new Date(payload.created_at),
    processedAt:      payload.processed_at ? new Date(payload.processed_at) : null,
    lineItems: (payload.line_items || []).map((item) => ({
      shopifyProductId: String(item.product_id),
      shopifyVariantId: String(item.variant_id),
      title:    item.title,
      quantity: item.quantity,
      price:    parseFloat(item.price),
    })),
    discountCodes: (payload.discount_codes || []).map((d) => ({
      code:   d.code,
      amount: parseFloat(d.amount),
      type:   d.type,
    })),
  };

  // Upsert — safe to run multiple times on the same order
  await Order.findOneAndUpdate(
    { tenantId, shopifyOrderId: orderData.shopifyOrderId },
    orderData,
    { upsert: true, new: true }
  );

  // If this order used a discount code, mark the cart as converted
  if (payload.cart_token) {
    await CartEvent.findOneAndUpdate(
      { tenantId, shopifyCartId: payload.cart_token },
      { converted: true }
    );
  }

  console.log(`Order saved: ${orderData.shopifyOrderId} for ${tenantId}`);
}

// ─── Cart handler ─────────────────────────────────────────────────────────────
async function handleCart(tenantId, payload, topic) {
  // Skip carts with no email — can't send recovery email
  if (!payload.email) return;

  const cartData = {
    tenantId,
    shopifyCartId: payload.token || String(payload.id),
    customerEmail: payload.email,
    totalValue: (payload.line_items || []).reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity, 0
    ),
    lineItems: (payload.line_items || []).map((item) => ({
      productTitle: item.title,
      price:    parseFloat(item.price),
      quantity: item.quantity,
    })),
  };

  await CartEvent.findOneAndUpdate(
    { tenantId, shopifyCartId: cartData.shopifyCartId },
    cartData,
    { upsert: true, new: true }
  );

  // The abandoned cart check job was already delayed 1 hour when queued
  // Now we check: did this cart convert to an order?
  if (topic === 'carts/create') {
    // This code runs 1 hour after cart creation (due to Bull delay)
    const cart = await CartEvent.findOne({
      tenantId,
      shopifyCartId: cartData.shopifyCartId,
    });

    if (cart && !cart.converted && !cart.recoveryEmailSent) {
      // Queue the email job (Phase 7 will implement the actual send)
      const { queues } = require('@shopify-autopilot/shared');
      await queues.email.add('abandoned-cart', {
        tenantId,
        cartId: cart._id,
        customerEmail: cart.customerEmail,
        lineItems: cart.lineItems,
        totalValue: cart.totalValue,
      });
    }
  }
}

// ─── Inventory handler ────────────────────────────────────────────────────────
async function handleInventory(tenantId, payload) {
  await Product.findOneAndUpdate(
    { tenantId, inventoryItemId: String(payload.inventory_item_id) },
    { inventory: payload.available },
    { new: true }
  );
}

// ─── Uninstall handler ────────────────────────────────────────────────────────
async function handleUninstall(tenantId) {
  // Revoke access but keep data for 30 days (GDPR requirement)
  await Store.findOneAndUpdate(
    { tenantId },
    {
      accessToken:         'REVOKED',
      webhooksRegistered:  false,
      uninstalledAt:       new Date(),
    }
  );
  console.log(`App uninstalled for ${tenantId} — access token revoked`);
}