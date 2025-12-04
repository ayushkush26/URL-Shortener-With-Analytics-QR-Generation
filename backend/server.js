// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get("/test-db", async (req, res) => {
  await ShortUrl.create({
    originalUrl: "https://example.com",
    shortCode: "hello123"
  });
  res.send("Inserted");
});

// Basic root
app.get('/', (req, res) => {
  res.send('URL Shortener Backend is running.');
});

/**
 * Redirect stub:
 * - In production, replace the body with DB lookup by shortCode,
 *   increment click counter and log analytics (ip, ua, referrer).
 */
app.get('/u/:code', async (req, res) => {
  const { code } = req.params;

  // Example: log request meta for debugging
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.get('User-Agent') || '';
  const referrer = req.get('Referrer') || req.get('Referer') || '';

  console.log(`[redirect] code=${code} ip=${ip} ua=${ua} ref=${referrer}`);

  // TODO: Fetch originalUrl from DB using shortCode, increment clickCount, save analytics
  // Example placeholder:
  const placeholderUrl = 'https://example.com';
  return res.redirect(302, placeholderUrl);
});

// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Read env vars
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/url_shortener_db';

// Connect to MongoDB and start server
mongoose.set('strictQuery', false); // optional warning suppression
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('Graceful shutdown initiated');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('Mongo connection closed. Exiting process.');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });