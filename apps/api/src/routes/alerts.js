// apps/api/src/routes/alerts.js
const router = require('express').Router();
const tenant = require('../middleware/tenant');
const { Product } = require('@shopify-autopilot/shared');

router.use(tenant);

// GET /api/alerts/restock — products running low
router.get('/restock', async (req, res, next) => {
  try {
    const { tenantId } = req;

    const lowStock = await Product.find({
      tenantId,
      status:           'active',
      velocityPerDay:   { $gt: 0 },
      daysUntilStockout: { $lte: 30 },
    })
    .sort({ daysUntilStockout: 1 })
    .limit(20)
    .select('title inventory velocityPerDay daysUntilStockout price');

    // Group by urgency
    const critical = lowStock.filter(p => p.daysUntilStockout <= 7);
    const warning  = lowStock.filter(p => p.daysUntilStockout > 7 && p.daysUntilStockout <= 14);
    const watch    = lowStock.filter(p => p.daysUntilStockout > 14);

    res.json({ lowStock, critical, warning, watch });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/abandoned-carts — abandoned cart stats
router.get('/abandoned-carts', async (req, res, next) => {
  try {
    const { CartEvent } = require('@shopify-autopilot/shared');
    const { tenantId }  = req;
    const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, converted, emailSent] = await Promise.all([
      CartEvent.countDocuments({ tenantId, createdAt: { $gte: day7 } }),
      CartEvent.countDocuments({ tenantId, createdAt: { $gte: day7 }, converted: true }),
      CartEvent.countDocuments({ tenantId, createdAt: { $gte: day7 }, recoveryEmailSent: true }),
    ]);

    const recoveryRate = total > 0
      ? ((converted / total) * 100).toFixed(1)
      : 0;

    res.json({
      total,
      converted,
      emailSent,
      abandoned:    total - converted,
      recoveryRate: parseFloat(recoveryRate),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;