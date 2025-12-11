@echo off
echo 🚀 Starting URL Shortener Backend...
echo.

echo 📦 Checking Docker services...
docker-compose ps
echo.

echo 🔄 Starting Docker services...
docker-compose up -d
echo.

echo ⏳ Waiting for services to start...
timeout /t 5 /nobreak >nul
echo.

echo 🔍 Checking MongoDB...
docker exec url_shortener_mongo mongosh --eval "db.adminCommand('ping')" --quiet
if %ERRORLEVEL% EQU 0 (
    echo ✅ MongoDB is running
) else (
    echo ❌ MongoDB connection failed
)
echo.

echo 🔍 Checking Redis...
docker exec url-shortener-redis redis-cli ping
if %ERRORLEVEL% EQU 0 (
    echo ✅ Redis is running
) else (
    echo ❌ Redis connection failed
)
echo.

if not exist "node_modules" (
    echo 📥 Installing dependencies...
    call npm install
    echo.
)

echo 🔨 Building TypeScript...
call npm run build
echo.

echo 🔥 Starting backend server...
echo    Server will run on http://localhost:5000
echo    Press Ctrl+C to stop
echo.

call npm run dev



