// packages/shared/models/index.js
const mongoose = require('mongoose');
const { tenantPlugin } = require('../plugins/tenantPlugin');

// Apply tenantPlugin globally to ALL schemas defined after this line
mongoose.plugin(tenantPlugin);

module.exports = {
  Store:          require('./Store'),
  Order:          require('./Order'),
  Product:        require('./Product'),
  Campaign:       require('./Campaign'),
  CartEvent:      require('./CartEvent'),
  ProcessedEvent: require('./ProcessedEvent'),
  AiSummary:      require('./AiSummary'),
};