require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze');
const { errorHandler } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('replace_') || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET is missing or too weak. Set a strong random value in server/.env');
  console.error('   Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const app = express();

// Allow both common Vite ports during development
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_ORIGIN,
  ].filter(Boolean),
}));

app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'AI Detector API is running 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-detector')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });