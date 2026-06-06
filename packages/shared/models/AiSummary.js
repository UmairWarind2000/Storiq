const mongoose = require('mongoose');

const aiSummarySchema = new mongoose.Schema({
  tenantId:   { type: String, required: true, unique: true },
  summary:    { type: String },
  topInsight: { type: String },
  alerts:     [{ type: String }],
  generatedAt: { type: Date, default: Date.now },
  expiresAt:  { type: Date },   // set to now + 24h when created
}, { timestamps: true });

module.exports = mongoose.model('AiSummary', aiSummarySchema);