const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  shopName: { type: String },
  accessToken: { type: String, required: true, select: false }, // never returned in queries by default
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  webhooksRegistered: { type: Boolean, default: false },
  timezone: { type: String, default: 'UTC' },
  currency: { type: String, default: 'USD' },
  ownerEmail: { type: String },
  installedAt: { type: Date, default: Date.now },
  lastSyncAt: { type: Date },
}, { timestamps: true });

// select: false on accessToken means Store.find() never leaks it
// To get it: Store.findOne({ tenantId }).select('+accessToken')
module.exports = mongoose.model('Store', storeSchema);