const mongoose = require('mongoose');

const cartEventSchema = new mongoose.Schema({
  tenantId:     { type: String, required: true, index: true },
  shopifyCartId: { type: String, required: true },
  customerEmail: { type: String },
  lineItems:    [{ productTitle: String, price: Number, quantity: Number }],
  totalValue:   { type: Number },
  recoveryEmailSent: { type: Boolean, default: false },
  recoveryEmailSentAt: { type: Date },
  converted:    { type: Boolean, default: false },   // did they buy?
}, { timestamps: true });

cartEventSchema.index({ tenantId: 1, shopifyCartId: 1 }, { unique: true });

module.exports = mongoose.model('CartEvent', cartEventSchema);