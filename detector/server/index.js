require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze');
const { errorHandler } = require('./middleware/errorHandler');

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.startsWith('replace_') ||
  process.env.JWT_SECRET.length < 32
) {
  console.error('❌ JWT_SECRET is missing or too weak.');
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.CLIENT_ORIGIN,
    ].filter(Boolean),
  })
);

app.use(express.json({ limit: '2mb' }));

// Simple in-memory rate limiter
const rateLimitStore = new Map();

function rateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now - entry.startTime >= windowMs) {
      entry = {
        startTime: now,
        count: 0,
      };
    }

    entry.count += 1;
    rateLimitStore.set(key, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
      });
    }

    next();
  };
}

const authLimiter = rateLimit(15 * 60 * 1000, 30);
const analyzeLimiter = rateLimit(60 * 1000, 20);

app.use('/api/auth', authLimiter);
app.use('/api/analyze', analyzeLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'AI Detector API is running 🚀' });
});

async function connectToMongoDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-detector'
  );

  console.log('✅ Connected to MongoDB');
}

app.use(async (req, res, next) => {
  try {
    await connectToMongoDB();
    next();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

// Export Express app for Vercel
module.exports = app;

// Run as a normal server locally
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
