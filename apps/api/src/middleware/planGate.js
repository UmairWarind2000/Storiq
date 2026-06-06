// apps/api/src/middleware/planGate.js

/**
 * Usage: router.post('/campaigns/auto-approve', planGate('pro'), handler)
 * Returns 403 with upgrade prompt if tenant is on wrong plan.
 */
function planGate(requiredPlan) {
  const planRank = { free: 0, pro: 1 };

  return (req, res, next) => {
    const storePlan  = req.store?.plan || 'free';
    const hasAccess  = planRank[storePlan] >= planRank[requiredPlan];

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        requiredPlan,
        currentPlan: storePlan,
        upgradeUrl: '/billing/upgrade',
      });
    }

    next();
  };
}

module.exports = planGate;