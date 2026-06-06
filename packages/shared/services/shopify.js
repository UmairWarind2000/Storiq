// packages/shared/services/shopify.js
const { Store } = require('../models');
const axios = require('axios');

async function getClientForTenant(tenantId) {
  const store = await Store.findOne({ tenantId }).select('+accessToken');
  if (!store) throw new Error(`Store not found: ${tenantId}`);

  return axios.create({
    baseURL: `https://${tenantId}/admin/api/2024-01`,
    headers: {
      'X-Shopify-Access-Token': store.accessToken,
      'Content-Type': 'application/json',
    },
  });
}

module.exports = { getClientForTenant };