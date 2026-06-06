// apps/worker/src/processors/email.js
const { CartEvent }                  = require('@shopify-autopilot/shared');
const { generateCartRecoveryEmail }  = require('@shopify-autopilot/shared/services/cartAi');
const { sendEmail }                  = require('@shopify-autopilot/shared/services/emailService');

module.exports = async function emailProcessor(job) {
  console.log(`[Email Worker] Processing ${job.name}`);

  switch (job.name) {
    case 'abandoned-cart':
      await handleAbandonedCart(job.data);
      break;

    default:
      console.log(`[Email Worker] Unknown job: ${job.name}`);
  }
};

async function handleAbandonedCart(data) {
  const { tenantId, cartId, customerEmail, lineItems, totalValue } = data;

  // Re-check the cart — it may have converted in the hour since queuing
  const cart = await CartEvent.findById(cartId);

  if (!cart) {
    console.log(`[Email] Cart ${cartId} not found — skipping`);
    return;
  }

  if (cart.converted) {
    console.log(`[Email] Cart ${cartId} already converted — skipping recovery email`);
    return;
  }

  if (cart.recoveryEmailSent) {
    console.log(`[Email] Recovery email already sent for cart ${cartId} — skipping`);
    return;
  }

  console.log(`[Email] Generating recovery email for ${customerEmail}`);

  // Generate personalized email via GPT-4o (or template fallback)
  const email = await generateCartRecoveryEmail({
    customerEmail,
    lineItems,
    totalValue,
    storeName: tenantId.replace('.myshopify.com', ''),
  });

  // Send the email
  await sendEmail({
    to:      customerEmail,
    subject: email.subject,
    html:    email.html,
    text:    email.text,
  });

  // Mark as sent — prevents duplicate sends
  await CartEvent.findByIdAndUpdate(cartId, {
    recoveryEmailSent:   true,
    recoveryEmailSentAt: new Date(),
  });

  console.log(`[Email] Recovery email sent to ${customerEmail} for cart ${cartId}`);
}