// apps/api/src/middleware/tenant.js
const jwt = require('jsonwebtoken');
const { Store } = require('@shopify-autopilot/shared');
const { tenantContext } = require('@shopify-autopilot/shared/plugins/tenantPlugin');
const { JWT_SECRET } = require('../config/env');

async function tenantMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const store = await Store.findOne({ tenantId: decoded.tenantId });
    if (!store) {
      return res.status(401).json({ error: 'Store not found or deauthorized' });
    }

    req.tenantId = decoded.tenantId;
    req.store    = store;

    // Run the rest of the request inside the tenant context
    // This is what the Mongoose plugin reads via AsyncLocalStorage
    tenantContext.run({ tenantId: decoded.tenantId }, next);

  } catch (err) {
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Invalid token' });
    if (err.name === 'TokenExpiredError')  return res.status(401).json({ error: 'Token expired' });
    next(err);
  }
}

module.exports = tenantMiddleware;