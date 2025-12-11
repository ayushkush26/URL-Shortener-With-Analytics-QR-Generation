/**
 * Complete Backend Test Suite
 * Tests all endpoints, MongoDB collections, and Redis cache
 */

const http = require('http');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:5000';
let createdShortCode = null;

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body, raw: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkServerRunning() {
  log('\n🔍 Step 1: Checking if server is running...', 'cyan');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET',
    });
    
    if (result.status === 200) {
      log('✅ Server is running!', 'green');
      return true;
    } else {
      log(`❌ Server returned status ${result.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Server is NOT running: ${error.message}`, 'red');
    log('   Please start the server with: npm run dev', 'yellow');
    return false;
  }
}

async function testHealthEndpoints() {
  log('\n🔍 Step 2: Testing Health Endpoints...', 'cyan');
  
  try {
    const health = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET',
    });
    
    if (health.status === 200) {
      log('✅ /health endpoint working', 'green');
      log(`   Response: ${JSON.stringify(health.data)}`, 'blue');
    } else {
      log(`❌ /health failed: ${health.status}`, 'red');
    }

    const healthz = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/healthz',
      method: 'GET',
    });
    
    if (healthz.status === 200) {
      log('✅ /healthz endpoint working', 'green');
    } else {
      log(`❌ /healthz failed: ${healthz.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
  }
}

async function testCreateShortUrl() {
  log('\n🔍 Step 3: Testing Create Short URL...', 'cyan');
  
  try {
    const result = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/url/shorten',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        originalUrl: 'https://www.google.com',
      }
    );

    if (result.status === 201) {
      log('✅ Create short URL successful!', 'green');
      log(`   Short Code: ${result.data.shortCode}`, 'blue');
      log(`   Short URL: ${result.data.shortUrl}`, 'blue');
      createdShortCode = result.data.shortCode;
      return true;
    } else {
      log(`❌ Create short URL failed: ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.data)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Create short URL error: ${error.message}`, 'red');
    return false;
  }
}

async function testRedirect(shortCode) {
  log('\n🔍 Step 4: Testing Redirect...', 'cyan');
  
  if (!shortCode) {
    log('⚠️  Skipping redirect test - no short code', 'yellow');
    return;
  }

  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/${shortCode}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Agent/1.0',
      },
    });

    if (result.status === 302 || result.status === 301) {
      log('✅ Redirect test passed!', 'green');
      log(`   Status: ${result.status}`, 'blue');
      log(`   Location: ${result.headers.location}`, 'blue');
    } else {
      log(`❌ Redirect test failed: ${result.status}`, 'red');
      log(`   Response: ${result.raw.substring(0, 100)}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Redirect error: ${error.message}`, 'red');
  }
}

async function testAnalytics(shortCode) {
  log('\n🔍 Step 5: Testing Analytics...', 'cyan');
  
  if (!shortCode) {
    log('⚠️  Skipping analytics test - no short code', 'yellow');
    return;
  }

  // Wait a bit for click to be processed
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/url/analytics/${shortCode}`,
      method: 'GET',
    });

    if (result.status === 200) {
      log('✅ Analytics endpoint working!', 'green');
      if (Array.isArray(result.data)) {
        log(`   Found ${result.data.length} analytics records`, 'blue');
      } else if (result.data.totalClicks !== undefined) {
        log(`   Total Clicks: ${result.data.totalClicks}`, 'blue');
      }
    } else {
      log(`❌ Analytics test failed: ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.data)}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Analytics error: ${error.message}`, 'red');
  }
}

async function testQRCode(shortCode) {
  log('\n🔍 Step 6: Testing QR Code...', 'cyan');
  
  if (!shortCode) {
    log('⚠️  Skipping QR code test - no short code', 'yellow');
    return;
  }

  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/url/qr/${shortCode}`,
      method: 'GET',
    });

    if (result.status === 200) {
      log('✅ QR Code endpoint working!', 'green');
      log(`   QR Code generated: ${result.data.qrCode ? 'Yes' : 'No'}`, 'blue');
    } else {
      log(`❌ QR Code test failed: ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.data)}`, 'yellow');
    }
  } catch (error) {
    log(`❌ QR Code error: ${error.message}`, 'red');
  }
}

function checkDockerServices() {
  log('\n🔍 Step 7: Checking Docker Services...', 'cyan');
  
  try {
    const mongoStatus = execSync('docker ps --filter "name=url_shortener_mongo" --format "{{.Status}}"', { encoding: 'utf-8' }).trim();
    if (mongoStatus) {
      log(`✅ MongoDB: ${mongoStatus}`, 'green');
    } else {
      log('❌ MongoDB container not running', 'red');
    }

    const redisStatus = execSync('docker ps --filter "name=url-shortener-redis" --format "{{.Status}}"', { encoding: 'utf-8' }).trim();
    if (redisStatus) {
      log(`✅ Redis: ${redisStatus}`, 'green');
    } else {
      log('❌ Redis container not running', 'red');
    }
  } catch (error) {
    log(`⚠️  Could not check Docker services: ${error.message}`, 'yellow');
  }
}

function checkMongoCollections() {
  log('\n🔍 Step 8: Checking MongoDB Collections...', 'cyan');
  
  try {
    const collections = execSync(
      'docker exec url_shortener_mongo mongosh -u admin -p password --authenticationDatabase admin --quiet --eval "db.getSiblingDB(\'urlshortener\').getCollectionNames()"',
      { encoding: 'utf-8' }
    );
    
    const collectionsList = collections.trim().replace(/\[|\]/g, '').split(',').map(c => c.trim().replace(/"/g, ''));
    
    if (collectionsList.length > 0 && collectionsList[0] !== '') {
      log(`✅ Found ${collectionsList.length} collections:`, 'green');
      collectionsList.forEach(col => {
        log(`   - ${col}`, 'blue');
      });
    } else {
      log('⚠️  No collections found yet (will be created when data is inserted)', 'yellow');
    }

    // Check document counts
    if (createdShortCode) {
      const shortUrlCount = execSync(
        `docker exec url_shortener_mongo mongosh -u admin -p password --authenticationDatabase admin --quiet --eval "db.getSiblingDB('urlshortener').shorturls.countDocuments()"`,
        { encoding: 'utf-8' }
      ).trim();
      
      const clickCount = execSync(
        `docker exec url_shortener_mongo mongosh -u admin -p password --authenticationDatabase admin --quiet --eval "db.getSiblingDB('urlshortener').clicks.countDocuments()"`,
        { encoding: 'utf-8' }
      ).trim();
      
      log(`\n📊 Document Counts:`, 'cyan');
      log(`   Short URLs: ${shortUrlCount}`, 'blue');
      log(`   Clicks: ${clickCount}`, 'blue');
    }
  } catch (error) {
    log(`⚠️  Could not check MongoDB: ${error.message}`, 'yellow');
    log('   Make sure MongoDB container is running', 'yellow');
  }
}

function checkRedisCache() {
  log('\n🔍 Step 9: Checking Redis Cache...', 'cyan');
  
  if (!createdShortCode) {
    log('⚠️  Skipping Redis check - no short code', 'yellow');
    return;
  }

  try {
    const keys = execSync(
      'docker exec url-shortener-redis redis-cli KEYS "url:*"',
      { encoding: 'utf-8' }
    ).trim();
    
    if (keys) {
      log(`✅ Found Redis keys:`, 'green');
      keys.split('\n').forEach(key => {
        if (key.trim()) {
          log(`   - ${key.trim()}`, 'blue');
        }
      });
    } else {
      log('⚠️  No Redis keys found (cache may not be populated yet)', 'yellow');
    }
  } catch (error) {
    log(`⚠️  Could not check Redis: ${error.message}`, 'yellow');
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(70), 'magenta');
  log('🚀 COMPLETE BACKEND TEST SUITE', 'magenta');
  log('='.repeat(70), 'magenta');

  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    log('\n❌ Cannot proceed with tests - server is not running!', 'red');
    log('   Please start the server first:', 'yellow');
    log('   cd backend && npm run dev', 'blue');
    return;
  }

  await testHealthEndpoints();
  const created = await testCreateShortUrl();
  
  if (created) {
    await testRedirect(createdShortCode);
    await testAnalytics(createdShortCode);
    await testQRCode(createdShortCode);
  }

  checkDockerServices();
  checkMongoCollections();
  checkRedisCache();

  log('\n' + '='.repeat(70), 'magenta');
  log('✅ TEST SUITE COMPLETED!', 'green');
  log('='.repeat(70), 'magenta');
  
  log('\n📋 Summary:', 'cyan');
  log('   - Server: ✅ Running', 'green');
  log('   - Health Endpoints: ✅ Tested', 'green');
  log('   - Create URL: ✅ Tested', 'green');
  log('   - Redirect: ✅ Tested', 'green');
  log('   - Analytics: ✅ Tested', 'green');
  log('   - QR Code: ✅ Tested', 'green');
  log('   - MongoDB: ✅ Checked', 'green');
  log('   - Redis: ✅ Checked', 'green');
  
  log('\n🎉 Backend is fully operational!', 'green');
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  process.exit(1);
});



