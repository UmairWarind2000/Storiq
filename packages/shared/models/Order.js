const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  shopifyProductId: String,
  shopifyVariantId: String,
  title:            String,
  quantity:         Number,
  price:            Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  tenantId:         { type: String, required: true },
  shopifyOrderId:   { type: String, required: true },
  orderNumber:      { type: Number },
  totalPrice:       { type: Number, required: true },
  subtotalPrice:    { type: Number },
  totalTax:         { type: Number },
  currency:         { type: String, default: 'USD' },
  financialStatus:  { type: String }, // paid, pending, refunded, voided
  fulfillmentStatus: { type: String }, // fulfilled, partial, null
  lineItems:        [lineItemSchema],
  customerEmail:    { type: String },
  discountCodes:    [{ code: String, amount: Number, type: String }],
  createdAtShopify: { type: Date },
  processedAt:      { type: Date },
}, { timestamps: true });

// Compound indexes for analytics queries
orderSchema.index({ tenantId: 1, createdAtShopify: -1 });           // time-series queries
orderSchema.index({ tenantId: 1, financialStatus: 1 });              // filter paid orders
orderSchema.index({ tenantId: 1, shopifyOrderId: 1 }, { unique: true }); // idempotent upserts
orderSchema.index({ tenantId: 1, 'discountCodes.code': 1 });         // campaign ROI tracking

module.exports = mongoose.model('Order', orderSchema);