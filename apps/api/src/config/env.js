// apps/api/src/config/env.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_autopilot',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',

  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES || 'read_orders,read_products,write_price_rules,read_inventory',
  APP_URL: process.env.APP_URL || 'http://localhost:3001',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,

  NODE_ENV: process.env.NODE_ENV || 'development',
};