const mongoose = require('mongoose');

const processedEventSchema = new mongoose.Schema({
  eventId:   { type: String, required: true, unique: true }, // Shopify-Webhook-Id header value
  topic:     { type: String },                               // e.g. orders/create
  processedAt: { type: Date, default: Date.now, expires: '30d' }, // auto-delete after 30 days
});

module.exports = mongoose.model('ProcessedEvent', processedEventSchema);