// apps/api/src/routes/dashboard.js
const router = require('express').Router();
const tenantMiddleware = require('../middleware/tenant');
const { Order, Product, Campaign, AiSummary } = require('@shopify-autopilot/shared');
const { getAiSummary } = require('../services/ai');

router.use(tenantMiddleware);

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const { tenantId } = req;
    const now   = new Date();
    const day7  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Run all DB queries in parallel
    const [
      revenueByDay,
      orders7dData,
      topProducts,
      slowProducts,
      activeCampaigns,
    ] = await Promise.all([

      // Revenue + order count grouped by day for last 30 days
      Order.aggregate([
        {
          $match: {
            tenantId,
            financialStatus:  'paid',
            createdAtShopify: { $gte: day30 },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAtShopify' },
            },
            revenue:    { $sum: '$totalPrice' },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Orders in last 7 days
      Order.aggregate([
        {
          $match: {
            tenantId,
            financialStatus:  'paid',
            createdAtShopify: { $gte: day7 },
          },
        },
        {
          $group: {
            _id:      null,
            revenue:  { $sum: '$totalPrice' },
            count:    { $sum: 1 },
          },
        },
      ]),

      // Top 5 products by velocity
      Product.find({ tenantId, status: 'active', velocityPerDay: { $gt: 0 } })
        .sort({ velocityPerDay: -1 })
        .limit(5)
        .select('title velocityPerDay unitsSold7d unitsSold30d inventory price'),

      // Bottom 5 products by velocity (slow movers — candidates for discounts)
      Product.find({ tenantId, status: 'active' })
        .sort({ velocityPerDay: 1 })
        .limit(5)
        .select('title velocityPerDay unitsSold7d inventory price'),

      // Active campaigns count
      Campaign.countDocuments({ tenantId, status: 'active' }),
    ]);

    // Calculate summary metrics
    const revenue30d = revenueByDay.reduce((sum, d) => sum + d.revenue, 0);
    const orders30d  = revenueByDay.reduce((sum, d) => sum + d.orderCount, 0);
    const revenue7d  = orders7dData[0]?.revenue || 0;
    const orders7d   = orders7dData[0]?.count   || 0;

    const metrics = {
      revenue30d,
      revenue7d,
      orders30d,
      orders7d,
      avgOrderValue: orders30d > 0 ? revenue30d / orders30d : 0,
      activeCampaigns,
    };

    // Get AI summary — passes only aggregated numbers, never raw records
    const aiSummary = await getAiSummary(tenantId, {
      ...metrics,
      topProducts,
      slowProducts,
      revenueByDay,
    });

    res.json({
      metrics,
      revenueChart: revenueByDay.map(d => ({
        date:    d._id,
        revenue: parseFloat(d.revenue.toFixed(2)),
        orders:  d.orderCount,
      })),
      topProducts,
      slowProducts,
      aiSummary,
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/refresh-ai
// Force regenerate the AI summary (ignores cache)
router.post('/refresh-ai', async (req, res, next) => {
  try {
    // Expire the cache
    await AiSummary.findOneAndUpdate(
      { tenantId: req.tenantId },
      { expiresAt: new Date() },
      { upsert: false }
    );
    res.json({ message: 'AI summary cache cleared. Refresh dashboard to regenerate.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/stats — lightweight, for header cards only
router.get('/stats', async (req, res, next) => {
  try {
    const { tenantId } = req;
    const day30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [revenue, products, campaigns] = await Promise.all([
      Order.aggregate([
        { $match: { tenantId, financialStatus: 'paid', createdAtShopify: { $gte: day30 } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ tenantId, status: 'active' }),
      Campaign.countDocuments({ tenantId, status: 'active' }),
    ]);

    res.json({
      revenue30d:     revenue[0]?.total || 0,
      orders30d:      revenue[0]?.count || 0,
      activeProducts: products,
      activeCampaigns: campaigns,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;