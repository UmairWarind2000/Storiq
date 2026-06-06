// apps/api/src/routes/campaigns.js
const router = require('express').Router();
const tenant = require('../middleware/tenant');
const planGate = require('../middleware/planGate');
const { Campaign } = require('@shopify-autopilot/shared');
const { detectAndCreateCampaigns, approveCampaign } = require('@shopify-autopilot/shared/services/campaignService');

router.use(tenant);

// GET /api/campaigns — list all campaigns
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = { tenantId: req.tenantId };
    if (status) filter.status = status;

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    // Group by status for easy frontend rendering
    const grouped = {
      pending: campaigns.filter(c => c.status === 'pending_approval'),
      active: campaigns.filter(c => c.status === 'active'),
      completed: campaigns.filter(c => c.status === 'completed'),
      rejected: campaigns.filter(c => c.status === 'rejected'),
    };

    res.json({ campaigns, grouped });
  } catch (err) {
    next(err);
  }
});

// POST /api/campaigns/detect — manually trigger AI detection
// Pro only in production but free in dev for testing
router.post('/detect', async (req, res, next) => {
  try {
    const created = await detectAndCreateCampaigns(req.tenantId);
    res.json({
      message: `${created.length} campaigns created`,
      campaigns: created,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/campaigns/:id/approve — Pro only
router.post('/:id/approve', planGate('pro'), async (req, res, next) => {
  try {
    const campaign = await approveCampaign(req.tenantId, req.params.id);
    res.json({ campaign, message: 'Campaign approved and queued for Shopify sync' });
  } catch (err) {
    next(err);
  }
});

// POST /api/campaigns/:id/reject
router.post('/:id/reject', async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, status: 'pending_approval' },
      { status: 'rejected' },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign });
  } catch (err) {
    next(err);
  }
});

// GET /api/campaigns/:id — single campaign detail
router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign });
  } catch (err) {
    next(err);
  }
});

module.exports = router;