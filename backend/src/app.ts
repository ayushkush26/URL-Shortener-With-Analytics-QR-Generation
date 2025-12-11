import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db';
import { redis } from './config/redis';
import { initWorker } from './services/worker';
import urlRoutes from './routes/urlRoutes';
import authRoutes from './routes/authRoutes';
import { redirectLink } from './controllers/urlController';
import { errorHandler, notFoundHandler, asyncHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ==================== MIDDLEWARE STACK ====================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// ==================== HEALTH CHECK ROUTES ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ==================== API ROUTES ====================

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Linkify Pro Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      urls: '/api/url',
    },
  });
});

// API routes with rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/url', apiLimiter, urlRoutes);

// Redirect route (must be last before catch-all)
app.get('/:shortCode', asyncHandler(redirectLink));

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==================== SERVER INITIALIZATION ====================

async function main() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB Connected');

    // Verify Redis connection
    await redis.ping();
    console.log('✅ Redis Connected');

    // Start analytics worker
    initWorker();
    console.log('✅ Analytics Worker Started');

    // Start server
    app.listen(PORT, () => {
      console.log(`🔥 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Base URL: ${BASE_URL}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Close server
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('Unhandled Promise Rejection:', err);
      // Don't exit in production, just log
      if (process.env.NODE_ENV === 'development') {
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      console.error('Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Startup Failed:', error);
    process.exit(1);
  }
}

// Start the application
main();
