# PowerShell script to start backend with full testing
Write-Host "🚀 Starting URL Shortener Backend..." -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n📦 Checking Docker services..." -ForegroundColor Yellow
docker-compose ps

# Start Docker services if not running
Write-Host "`n🔄 Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check MongoDB connection
Write-Host "`n🔍 Checking MongoDB..." -ForegroundColor Cyan
$mongoCheck = docker exec url_shortener_mongo mongosh --eval "db.adminCommand('ping')" --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "❌ MongoDB connection failed" -ForegroundColor Red
}

# Check Redis connection
Write-Host "`n🔍 Checking Redis..." -ForegroundColor Cyan
$redisCheck = docker exec url-shortener-redis redis-cli ping
if ($redisCheck -eq "PONG") {
    Write-Host "✅ Redis is running" -ForegroundColor Green
} else {
    Write-Host "❌ Redis connection failed" -ForegroundColor Red
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build TypeScript
Write-Host "`n🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

# Start the backend
Write-Host "`n🔥 Starting backend server..." -ForegroundColor Cyan
Write-Host "   Server will run on http://localhost:5000" -ForegroundColor Blue
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor White

# Run the backend
npm run dev



