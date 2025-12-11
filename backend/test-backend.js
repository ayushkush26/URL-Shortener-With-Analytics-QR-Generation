/**
 * Comprehensive Backend Test Script
 * Tests all endpoints and MongoDB collections
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/url`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
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

async function testHealthCheck() {
  log('\n🔍 Testing Health Check Endpoints...', 'cyan');
  
  try {
    const health = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET',
    });
    
    if (health.status === 200) {
      log('✅ Health check passed', 'green');
      log(`   Response: ${JSON.stringify(health.data)}`, 'blue');
    } else {
      log(`❌ Health check failed: ${health.status}`, 'red');
    }

    const healthz = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/healthz',
      method: 'GET',
    });
    
    if (healthz.status === 200) {
      log('✅ Healthz check passed', 'green');
    } else {
      log(`❌ Healthz check failed: ${healthz.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
  }
}

async function testCreateShortUrl() {
  log('\n🔍 Testing Create Short URL...', 'cyan');
  
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
      log('✅ Create short URL passed', 'green');
      log(`   Short Code: ${result.data.shortCode}`, 'blue');
      log(`   Short URL: ${result.data.shortUrl}`, 'blue');
      return result.data.shortCode;
    } else {
      log(`❌ Create short URL failed: ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.data)}`, 'yellow');
      return null;
    }
  } catch (error) {
    log(`❌ Create short URL error: ${error.message}`, 'red');
    return null;
  }
}

async function testRedirect(shortCode) {
  log('\n🔍 Testing Redirect...', 'cyan');
  
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
      log('✅ Redirect test passed', 'green');
      log(`   Status: ${result.status}`, 'blue');
      log(`   Location: ${result.headers.location}`, 'blue');
    } else {
      log(`❌ Redirect test failed: ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.data)}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Redirect error: ${error.message}`, 'red');
  }
}

async function testAnalytics(shortCode) {
  log('\n🔍 Testing Analytics...', 'cyan');
  
  if (!shortCode) {
    log('⚠️  Skipping analytics test - no short code', 'yellow');
    return;
  }

  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/url/analytics/${shortCode}`,
      method: 'GET',
    });

    if (result.status === 200) {
      log('✅ Analytics test passed', 'green');
      log(`   Total Clicks: ${result.data.totalClicks || 0}`, 'blue');
      log(`   Daily Analytics: ${result.data.dailyAnalytics?.length || 0} days`, 'blue');
    } else {
      log(`❌ Analytics test failed: ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.data)}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Analytics error: ${error.message}`, 'red');
  }
}

async function testQRCode(shortCode) {
  log('\n🔍 Testing QR Code...', 'cyan');
  
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
      log('✅ QR Code test passed', 'green');
      log(`   QR Code generated: ${result.data.qrCode ? 'Yes' : 'No'}`, 'blue');
    } else {
      log(`❌ QR Code test failed: ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.data)}`, 'yellow');
    }
  } catch (error) {
    log(`❌ QR Code error: ${error.message}`, 'red');
  }
}

async function testRoot() {
  log('\n🔍 Testing Root Endpoint...', 'cyan');
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET',
    });

    if (result.status === 200) {
      log('✅ Root endpoint test passed', 'green');
      log(`   Message: ${result.data.message || result.data}`, 'blue');
    } else {
      log(`❌ Root endpoint test failed: ${result.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Root endpoint error: ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('\n🚀 Starting Comprehensive Backend Tests...', 'cyan');
  log('=' .repeat(60), 'cyan');

  // Wait a bit for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testRoot();
  await testHealthCheck();
  
  const shortCode = await testCreateShortUrl();
  
  // Wait a bit for click to be processed
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  await testRedirect(shortCode);
  await testAnalytics(shortCode);
  await testQRCode(shortCode);

  log('\n' + '='.repeat(60), 'cyan');
  log('✅ All tests completed!', 'green');
  log('\n📊 Next Steps:', 'yellow');
  log('   1. Check MongoDB collections:', 'yellow');
  log('      - db.shorturls.find()', 'blue');
  log('      - db.clicks.find()', 'blue');
  log('   2. Check Redis cache:', 'yellow');
  log('      - redis-cli KEYS url:*', 'blue');
  log('   3. Monitor worker logs for click processing', 'yellow');
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  process.exit(1);
});



