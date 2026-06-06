// apps/api/src/config/db.js
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Reconnecting...');
    isConnected = false;
    setTimeout(connectDB, 3000);
  });
}

module.exports = { connectDB };