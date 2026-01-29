# URL Shortener Backend

A powerful, production-ready URL shortener backend with analytics, QR code generation, and comprehensive features.

## Features

- 🔗 **URL Shortening** - Create short URLs with custom slugs
- 📊 **Analytics** - Track clicks with geo-location, device info, UTM parameters
- 🔐 **Authentication** - JWT-based auth with 2FA support
- 📱 **QR Codes** - Automatic QR code generation for short URLs
- 🚀 **Performance** - Redis caching, background job processing with BullMQ
- 📈 **Pre-aggregated Analytics** - Daily and hourly analytics for fast dashboard loading
- 🛡️ **Security** - Rate limiting, password-protected links, expiration dates
- 📝 **Audit Logging** - Track all user actions
- 🎯 **Bio Links** - Support for multi-link bio pages

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache/Queue**: Redis with BullMQ
- **Language**: TypeScript
- **Authentication**: JWT + 2FA (Speakeasy)

## Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Main application entry
│   ├── config/                # Configuration files
│   │   ├── db.ts             # MongoDB connection
│   │   └── redis.ts           # Redis connection
│   ├── controllers/          # Request handlers
│   │   ├── authController.ts  # Authentication endpoints
│   │   └── urlController.ts   # URL management endpoints
│   ├── models/               # Mongoose models
│   │   ├── User.ts
│   │   ├── ShortUrl.ts
│   │   ├── Click.ts
│   │   ├── Session.ts
│   │   ├── RefreshToken.ts
│   │   ├── ApiKey.ts
│   │   ├── QRCode.ts
│   │   ├── AuditLog.ts
│   │   ├── RateLimit.ts
│   │   ├── AnalyticsDaily.ts
│   │   └── AnalyticsHourly.ts
│   ├── middlewares/          # Express middlewares
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   ├── validation.ts     # Input validation
│   │   └── errorHandler.ts   # Error handling
│   ├── routes/               # Route definitions
│   │   ├── authRoutes.ts
│   │   └── urlRoutes.ts
│   ├── services/             # Business logic
│   │   ├── queue.ts          # BullMQ queue setup
│   │   ├── worker.ts         # Background worker
│   │   ├── qrService.ts      # QR code generation
│   │   └── analyticsService.ts # Analytics aggregation
│   └── utils/                # Utility functions
│       └── auth.ts           # Auth helpers
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Redis
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration

### Development

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/enable` - Enable 2FA

### URLs
- `POST /api/url/shorten` - Create short URL
- `GET /api/url/analytics/:shortCode` - Get analytics
- `GET /api/url/qr/:shortCode` - Get QR code
- `GET /api/url/my-urls` - Get user's URLs (auth required)
- `DELETE /api/url/:shortCode` - Delete URL (auth required)
- `GET /:shortCode` - Redirect to original URL

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The backend uses MongoDB with the following main collections:

- **users** - User accounts with roles, 2FA, and plans
- **short_urls** - Shortened URLs with settings and embedded links
- **clicks** - Click analytics with geo and device data
- **sessions** - Active user sessions
- **refresh_tokens** - Refresh token storage
- **api_keys** - API key management
- **qr_codes** - QR code storage
- **audit_logs** - Audit trail
- **rate_limits** - Rate limiting data
- **analytics_daily** - Pre-aggregated daily analytics
- **analytics_hourly** - Pre-aggregated hourly analytics

## Features in Detail

### URL Shortening
- Automatic short code generation (7 characters)
- Custom slug support
- Password protection
- Expiration dates
- Click limits
- Bot filtering

### Analytics
- Real-time click tracking
- Geographic data (country, region, city)
- Device information (type, OS, browser)
- UTM parameter tracking
- Referrer tracking
- Pre-aggregated daily/hourly stats

### Security
- JWT authentication
- 2FA support (TOTP)
- Rate limiting
- Password hashing (bcrypt)
- IP hashing for privacy
- Audit logging

## License

ISC

## Author

Ayush Kush

