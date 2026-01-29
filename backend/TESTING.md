# Backend Testing Guide

## Quick Start

### 1. Start Docker Services
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build TypeScript
```bash
npm run build
```

### 4. Start Backend (Development)
```bash
npm run dev
```

Or use the startup scripts:
- Windows: `start-backend.bat`
- PowerShell: `.\start-backend.ps1`

## Testing Endpoints

### Health Checks
```bash
# Health check
curl http://localhost:5001/health

# Healthz check
curl http://localhost:5001/healthz
```

### Create Short URL
```bash
curl -X POST http://localhost:5001/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com"}'
```

### Redirect Test
```bash
# Replace {shortCode} with actual short code from create response
curl -L http://localhost:5001/{shortCode}
```

### Analytics
```bash
curl http://localhost:5001/api/url/analytics/{shortCode}
```

### QR Code
```bash
curl http://localhost:5001/api/url/qr/{shortCode}
```

## Automated Testing

### Run Test Script
```bash
node test-backend.js
```

### Check MongoDB Collections
```bash
node check-collections.js
```

Or manually:
```bash
# Connect to MongoDB
docker exec -it url_shortener_mongo mongosh -u admin -p password --authenticationDatabase admin

# Use database
use urlshortener

# List collections
show collections

# Check shorturls
db.shorturls.find().pretty()

# Check clicks
db.clicks.find().pretty()

# Count documents
db.shorturls.countDocuments()
db.clicks.countDocuments()
```

## Check Redis Cache

```bash
# Connect to Redis
docker exec -it url-shortener-redis redis-cli

# List all URL keys
KEYS url:*

# Get cached URL
GET url:{shortCode}

# Check all keys
KEYS *
```

## Expected Collections

After running the backend, you should see these MongoDB collections:

1. **shorturls** - Shortened URLs
2. **clicks** - Click analytics
3. **users** - User accounts (if auth is used)
4. **apikeys** - API keys (if auth is used)
5. **sessions** - User sessions (if auth is used)
6. **refreshtokens** - Refresh tokens (if auth is used)
7. **auditlogs** - Audit trail (if auth is used)
8. **qrcodes** - QR code storage
9. **ratelimits** - Rate limiting data
10. **analyticsdailies** - Pre-aggregated daily analytics
11. **analyticshourlies** - Pre-aggregated hourly analytics

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB logs
docker logs url_shortener_mongo

# Restart MongoDB
docker restart url_shortener_mongo
```

### Redis Connection Issues
```bash
# Check Redis logs
docker logs url-shortener-redis

# Restart Redis
docker restart url-shortener-redis
```

### Backend Not Starting
1. Check if port 5001 is available
2. Verify environment variables in `.env`
3. Check TypeScript compilation errors: `npm run build`
4. Check logs for errors

### Worker Not Processing Clicks
1. Check Redis connection
2. Verify BullMQ queue is initialized
3. Check worker logs in console
4. Verify Click model is correct

## Performance Testing

### Load Test with Apache Bench
```bash
# Test create endpoint
ab -n 100 -c 10 -p create.json -T application/json http://localhost:5001/api/url/shorten

# Test redirect endpoint
ab -n 1000 -c 50 http://localhost:5001/{shortCode}
```

## Monitoring

### Check Server Logs
The backend logs will show:
- ✅ MongoDB Connected
- ✅ Redis Connected
- ✅ Analytics Worker Started
- 🔥 Server running on http://localhost:5001

### Monitor Worker
Watch for:
- ⚙️ Processing click for: {shortCode}
- ✅ Job {id} completed
- ❌ Job {id} failed (if errors occur)

## Environment Variables

Make sure `.env` file has:
```
PORT=5001
NODE_ENV=development
BASE_URL=http://localhost:5001
MONGO_URI=mongodb://admin:password@localhost:27017/urlshortener?authSource=admin
REDIS_URL=redis://localhost:6379
```



