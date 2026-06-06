// apps/api/src/services/campaignService.js
const { Campaign, Product, Store } = require('../models');
const { recommendCampaigns }       = require('./campaignAi');
const { getClientForTenant }       = require('./shopify');

const AUTO_APPROVE_THRESHOLD = 0.85; // confidence score above this = auto approve for Pro

/**
 * Detect slow products and create pending campaigns.
 * Called by the nightly analytics job.
 */
async function detectAndCreateCampaigns(tenantId) {
  // 1. Find slow-moving products (low velocity, enough stock)
  const slowProducts = await Product.find({
    tenantId,
    status:       'active',
    inventory:    { $gt: 10 },       // don't discount nearly-out-of-stock items
    velocityPerDay: { $lt: 1.0 },    // selling less than 1 per day
    unitsSold30d: { $lt: 20 },       // slow overall
  }).select('shopifyProductId title price velocityPerDay unitsSold7d unitsSold30d inventory');

  if (slowProducts.length === 0) {
    console.log(`[Campaign] No slow products found for ${tenantId}`);
    return [];
  }

  console.log(`[Campaign] Found ${slowProducts.length} slow products for ${tenantId}`);

  // 2. Get AI recommendations
  const recommendations = await recommendCampaigns(slowProducts);

  if (recommendations.length === 0) {
    console.log(`[Campaign] No campaigns recommended for ${tenantId}`);
    return [];
  }

  // 3. Create campaigns in MongoDB (status = pending_approval by default)
  const store    = await Store.findOne({ tenantId });
  const isPro    = store?.plan === 'pro';
  const created  = [];

  for (const rec of recommendations) {
    // Skip if there's already an active/pending campaign for this product
    const existing = await Campaign.findOne({
      tenantId,
      productId: rec.shopifyProductId,
      status:    { $in: ['pending_approval', 'approved', 'active'] },
    });

    if (existing) {
      console.log(`[Campaign] Skipping ${rec.productTitle} — campaign already exists`);
      continue;
    }

    const startsAt = new Date();
    const endsAt   = new Date(startsAt.getTime() + rec.durationDays * 24 * 60 * 60 * 1000);

    const campaign = await Campaign.create({
      tenantId,
      productId:       rec.shopifyProductId,
      productTitle:    rec.productTitle,
      discountPct:     rec.discountPct,
      confidenceScore: rec.confidenceScore,
      reasoning:       rec.reasoning,
      durationDays:    rec.durationDays,
      startsAt,
      endsAt,
      status: 'pending_approval',
    });

    created.push(campaign);
    console.log(`[Campaign] Created campaign for ${rec.productTitle} (${rec.discountPct}% off, confidence: ${rec.confidenceScore})`);

    // 4. Auto-approve for Pro users with high confidence
    if (isPro && rec.confidenceScore >= AUTO_APPROVE_THRESHOLD) {
      await approveCampaign(tenantId, campaign._id.toString());
      console.log(`[Campaign] Auto-approved for Pro tenant: ${rec.productTitle}`);
    }
  }

  return created;
}

/**
 * Approve a campaign and sync to Shopify.
 */
async function approveCampaign(tenantId, campaignId) {
  const campaign = await Campaign.findOneAndUpdate(
    { _id: campaignId, tenantId, status: 'pending_approval' },
    { status: 'approved' },
    { new: true }
  );

  if (!campaign) {
    throw Object.assign(new Error('Campaign not found or already processed'), { status: 404 });
  }

  // Queue the Shopify sync job
  const { queues } = require('@shopify-autopilot/shared');
  await queues.campaign.add('sync-to-shopify', {
    tenantId,
    campaignId: campaign._id.toString(),
  });

  return campaign;
}

/**
 * Sync approved campaign to Shopify — creates price rule + discount code.
 * Called by the campaign worker processor.
 */
async function syncToShopify(tenantId, campaignId) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });

  if (!campaign || campaign.status !== 'approved') {
    console.log(`[Campaign] Skipping sync — not approved: ${campaignId}`);
    return;
  }

  // Check store has real access token (not dev mode)
  const store = await Store.findOne({ tenantId }).select('+accessToken');
  if (!store || store.accessToken === 'dev-token' || store.accessToken === 'REVOKED') {
    console.log(`[Campaign] Skipping Shopify sync — dev/revoked token for ${tenantId}`);
    // Still mark as active so the UI shows it working
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'active',
      shopifyPriceRuleId:    'dev-mock-rule',
      shopifyDiscountCodeId: 'dev-mock-code',
    });
    return;
  }

  try {
    const client = await getClientForTenant(tenantId);

    // Create Shopify price rule
    const priceRuleRes = await client.post('/price_rules.json', {
      price_rule: {
        title:              `Storiq-${campaign._id}`,
        target_type:        'line_item',
        target_selection:   'entitled',
        allocation_method:  'across',
        value_type:         'percentage',
        value:              `-${campaign.discountPct}`,
        customer_selection: 'all',
        starts_at:          campaign.startsAt,
        ends_at:            campaign.endsAt,
        entitled_product_ids: [campaign.productId],
      },
    });

    const priceRuleId = priceRuleRes.data.price_rule.id;

    // Create discount code under the price rule
    const discountRes = await client.post(
      `/price_rules/${priceRuleId}/discount_codes.json`,
      {
        discount_code: {
          code: `STORIQ-${campaign._id.toString().slice(-6).toUpperCase()}`,
        },
      }
    );

    await Campaign.findByIdAndUpdate(campaignId, {
      status:               'active',
      shopifyPriceRuleId:   String(priceRuleId),
      shopifyDiscountCodeId: String(discountRes.data.discount_code.id),
    });

    console.log(`[Campaign] Synced to Shopify for ${tenantId}: rule=${priceRuleId}`);

  } catch (err) {
    console.error(`[Campaign] Shopify sync failed:`, err.message);
    throw err;
  }
}

/**
 * Calculate ROI for completed campaigns.
 * Matches orders with discount codes back to campaigns.
 */
async function calculateRoi(tenantId, campaignId) {
  const { Order } = require('@shopify-autopilot/shared');

  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign || !campaign.shopifyDiscountCodeId) return;

  const discountCode = `STORIQ-${campaign._id.toString().slice(-6).toUpperCase()}`;

  const orders = await Order.find({
    tenantId,
    'discountCodes.code': discountCode,
    createdAtShopify: {
      $gte: campaign.startsAt,
      $lte: campaign.endsAt || new Date(),
    },
  });

  const revenueGenerated = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  await Campaign.findByIdAndUpdate(campaignId, { revenueGenerated });
  console.log(`[Campaign] ROI for ${campaignId}: $${revenueGenerated} from ${orders.length} orders`);
}

module.exports = {
  detectAndCreateCampaigns,
  approveCampaign,
  syncToShopify,
  calculateRoi,
};