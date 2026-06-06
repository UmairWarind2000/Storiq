// apps/api/src/services/stripeService.js
const Stripe = require('stripe');

let stripeClient = null;

function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not set');
    stripeClient = new Stripe(key, { apiVersion: '2024-04-10' });
  }
  return stripeClient;
}

/**
 * Create a Stripe Checkout session.
 * Redirects the merchant to Stripe's hosted payment page.
 */
async function createCheckoutSession({ tenantId, plan, successUrl, cancelUrl }) {
  const stripe = getStripe();

  const PRICE_IDS = {
    pro: process.env.STRIPE_PRO_PRICE_ID || 'price_dev_pro_monthly',
  };

  const session = await stripe.checkout.sessions.create({
    mode:                'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price:    PRICE_IDS[plan],
        quantity: 1,
      },
    ],
    metadata: {
      tenantId,   // we use this in the webhook to identify the store
      plan,
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  cancelUrl,
  });

  return session;
}

/**
 * Create or retrieve a Stripe customer for a tenant.
 */
async function getOrCreateCustomer(tenantId, email) {
  const stripe   = getStripe();
  const { Store } = require('@shopify-autopilot/shared');

  const store = await Store.findOne({ tenantId });

  // Return existing customer if we have one
  if (store?.stripeCustomerId) {
    return store.stripeCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { tenantId },
  });

  // Save customer ID to store
  await Store.findOneAndUpdate(
    { tenantId },
    { stripeCustomerId: customer.id }
  );

  return customer.id;
}

/**
 * Create a billing portal session so merchants can manage their subscription.
 */
async function createPortalSession({ customerId, returnUrl }) {
  const stripe  = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Handle Stripe webhook events.
 * Verifies signature and updates the store plan in MongoDB.
 */
async function handleWebhookEvent(rawBody, signature) {
  const stripe  = getStripe();
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not set');

  // Verify the webhook came from Stripe
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    throw Object.assign(
      new Error(`Stripe webhook signature failed: ${err.message}`),
      { status: 400 }
    );
  }

  const { Store } = require('@shopify-autopilot/shared');

  switch (event.type) {

    case 'checkout.session.completed': {
      const session  = event.data.object;
      const tenantId = session.metadata?.tenantId;
      const plan     = session.metadata?.plan;

      if (tenantId && plan) {
        await Store.findOneAndUpdate(
          { tenantId },
          {
            plan,
            stripeCustomerId:     session.customer,
            stripeSubscriptionId: session.subscription,
          }
        );
        console.log(`[Stripe] ${tenantId} upgraded to ${plan}`);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub      = event.data.object;
      const customer = await getStripe().customers.retrieve(sub.customer);
      const tenantId = customer.metadata?.tenantId;

      if (tenantId) {
        const plan = sub.status === 'active' ? 'pro' : 'free';
        await Store.findOneAndUpdate({ tenantId }, { plan });
        console.log(`[Stripe] Subscription updated for ${tenantId}: ${plan}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub      = event.data.object;
      const customer = await getStripe().customers.retrieve(sub.customer);
      const tenantId = customer.metadata?.tenantId;

      if (tenantId) {
        await Store.findOneAndUpdate(
          { tenantId },
          { plan: 'free', stripeSubscriptionId: null }
        );
        console.log(`[Stripe] Subscription cancelled for ${tenantId} — downgraded to free`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice  = event.data.object;
      const customer = await getStripe().customers.retrieve(invoice.customer);
      const tenantId = customer.metadata?.tenantId;

      if (tenantId) {
        console.warn(`[Stripe] Payment failed for ${tenantId}`);
        // Could send an email alert here in production
      }
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`);
  }

  return event;
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  getOrCreateCustomer,
  handleWebhookEvent,
};