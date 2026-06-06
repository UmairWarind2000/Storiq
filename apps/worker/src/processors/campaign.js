// apps/worker/src/processors/campaign.js
const { syncToShopify, calculateRoi, detectAndCreateCampaigns } = require('@shopify-autopilot/shared/services/campaignService');

module.exports = async function campaignProcessor(job) {
  const { tenantId, campaignId } = job.data;
  console.log(`[Campaign Worker] Processing ${job.name} for ${tenantId}`);

  switch (job.name) {
    case 'sync-to-shopify':
      await syncToShopify(tenantId, campaignId);
      break;

    case 'check-roi':
      await calculateRoi(tenantId, campaignId);
      break;

    case 'detect-campaigns':
      await detectAndCreateCampaigns(tenantId);
      break;

    default:
      console.log(`[Campaign Worker] Unknown job: ${job.name}`);
  }
};