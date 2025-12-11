# 🚀 Quick Start Guide - Backend

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB & Redis (via Docker)

## One-Command Start

### Windows (CMD)
```cmd
start-backend.bat
```

### Windows (PowerShell)
```powershell
.\start-backend.ps1
```

### Manual Start
```bash
# 1. Start Docker services
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Start development server
npm run dev
```

## Verify Everything Works

### 1. Check Services
```bash
docker-compose ps
```

Should show:
- ✅ url_shortener_mongo (running)
- ✅ url-shortener-redis (running)

### 2. Test Backend
```bash
npm test
```

Or manually:
```bash
# Health check
curl http://localhost:5000/health

# Create short URL
curl -X POST http://localhost:5000/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com"}'
```

### 3. Check Collections
```bash
npm run check-collections
```

## Expected Output

When backend starts successfully, you should see:
```
✅ MongoDB Connected
✅ Redis Connected
✅ Analytics Worker Started
🔥 Server running on http://localhost:5000
📊 Environment: development
🌐 Base URL: http://localhost:5000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/healthz` | Health check (simple) |
| GET | `/` | API info |
| POST | `/api/url/shorten` | Create short URL |
| GET | `/:shortCode` | Redirect to original URL |
| GET | `/api/url/analytics/:shortCode` | Get analytics |
| GET | `/api/url/qr/:shortCode` | Get QR code |

## MongoDB Collections

Collections are created automatically when data is inserted:

1. **shorturls** - Shortened URLs
2. **clicks** - Click analytics  
3. **users** - User accounts
4. **apikeys** - API keys
5. **sessions** - User sessions
6. **refreshtokens** - Refresh tokens
7. **auditlogs** - Audit trail
8. **qrcodes** - QR codes
9. **ratelimits** - Rate limiting
10. **analyticsdailies** - Daily analytics
11. **analyticshourlies** - Hourly analytics

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or docker-compose.yml
PORT=5001
```

### MongoDB Connection Failed
```bash
# Check MongoDB is running
docker logs url_shortener_mongo

# Restart MongoDB
docker restart url_shortener_mongo
```

### Redis Connection Failed
```bash
# Check Redis is running
docker logs url-shortener-redis

# Restart Redis
docker restart url-shortener-redis
```

### TypeScript Errors
```bash
# Clean and rebuild
rm -rf dist
npm run build
```

## Next Steps

1. ✅ Backend is running
2. ✅ Test endpoints with `npm test`
3. ✅ Check collections with `npm run check-collections`
4. ✅ Start frontend (if available)
5. ✅ Integrate frontend with backend

## Support

For detailed testing instructions, see `TESTING.md`



