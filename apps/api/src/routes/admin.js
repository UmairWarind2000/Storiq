// apps/api/src/routes/admin.js
const router = require('express').Router();
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter }     = require('@bull-board/api/bullAdapter');
const { ExpressAdapter }  = require('@bull-board/express');
const { queues }          = require('@shopify-autopilot/shared');
const { NODE_ENV }        = require('../config/env');

// Only mount Bull Board in development
if (NODE_ENV === 'development') {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: Object.values(queues).map(q => new BullAdapter(q)),
    serverAdapter,
  });

  router.use('/queues', serverAdapter.getRouter());
  console.log('[Admin] Bull Board available at /admin/queues');
}

module.exports = router;