// packages/shared/models/Campaign.js
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  tenantId:      { type: String, required: true, index: true },
  productId:     { type: String, required: true },
  productTitle:  { type: String },
  discountPct:   { type: Number, required: true },
  durationDays:  { type: Number, default: 7 },
  confidenceScore: { type: Number },
  reasoning:     { type: String },
  status: {
    type:    String,
    enum:    ['pending_approval', 'approved', 'rejected', 'active', 'completed'],
    default: 'pending_approval',
  },
  shopifyPriceRuleId:    { type: String },
  shopifyDiscountCodeId: { type: String },
  startsAt:          { type: Date },
  endsAt:            { type: Date },
  revenueGenerated:  { type: Number, default: 0 },
}, { timestamps: true });

campaignSchema.index({ tenantId: 1, status: 1 });
campaignSchema.index({ tenantId: 1, productId: 1, status: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);