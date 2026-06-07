// apps/api/src/app.js
const express = require('express');

const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/error');
const { NODE_ENV } = require('./config/env');
const { getQueuesHealth } = require('@shopify-autopilot/shared');

const app = express();

// Bypass ngrok browser warning for iframe embedding
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Allow Shopify to embed the app in an iframe
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: ["https://*.myshopify.com", "https://admin.shopify.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com"],
      imgSrc: ["'self'", "data:", "https:"],
      frameAncestors: ["https://*.myshopify.com", "https://admin.shopify.com"],
    },
  },
  frameguard: false,
}));

// apps/api/src/app.js
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      process.env.APP_URL,
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowed.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// Raw body for Stripe webhook — MUST come before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  // Respond immediately — don't wait for Redis
  // Railway healthcheck needs a fast response
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/admin', require('./routes/admin'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/billing', require('./routes/billing'));

// Serve frontend in production OR when built
const frontendPath = path.join(__dirname, '../../../apps/web/dist');
app.use(express.static(frontendPath));


app.get('/', (req, res) => {
  res.json({
    name:    'Storiq API',
    status:  'running',
    version: '1.0.0',
    health:  '/health',
  });
});

// 404 handler for API routes only
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler — must be last
app.use(errorHandler);

module.exports = app;