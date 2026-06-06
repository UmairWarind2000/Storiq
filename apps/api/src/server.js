// apps/api/src/server.js
const { connectDB } = require('./config/db');
const { PORT }      = require('./config/env');
const app           = require('./app');

async function start() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });

  // Graceful shutdown — finish in-flight requests before closing
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

start().catch((err) => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});