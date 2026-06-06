const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  tenantId:           { type: String, required: true },
  shopifyProductId:   { type: String, required: true },
  title:              { type: String, required: true },
  vendor:             { type: String },
  productType:        { type: String },
  status:             { type: String, default: 'active' }, // active, archived, draft
  price:              { type: Number },
  compareAtPrice:     { type: Number },
  inventory:          { type: Number, default: 0 },
  inventoryItemId:    { type: String },

  // Updated nightly by analytics worker
  unitsSold7d:        { type: Number, default: 0 },
  unitsSold30d:       { type: Number, default: 0 },
  velocityPerDay:     { type: Number, default: 0 }, // unitsSold7d / 7
  daysUntilStockout:  { type: Number }, // inventory / velocityPerDay

  lastAnalyzedAt:     { type: Date },
}, { timestamps: true });

productSchema.index({ tenantId: 1, shopifyProductId: 1 }, { unique: true });
productSchema.index({ tenantId: 1, velocityPerDay: -1 });  // find slowest movers
productSchema.index({ tenantId: 1, daysUntilStockout: 1 }); // restock alerts

module.exports = mongoose.model('Product', productSchema);