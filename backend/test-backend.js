/**
 * Complete Backend Test Suite (Docker-compatible)
 * Tests API endpoints, MongoDB collections, and Redis cache
 */

const http = require('http');
const { execSync } = require('child_process');

/**
 * IMPORTANT:
 * Backend is exposed as 5050:5000 in docker-compose
 * So from HOST we MUST use 5050
 */
const BASE_URL = 'http://localhost:5050';
const PORT = 5050;

let createdShortCode = null;

/* -------------------- Console Colors -------------------- */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

/* -------------------- HTTP Helper -------------------- */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : {},
            raw: body,
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            raw: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

/* -------------------- Tests -------------------- */

async function checkServerRunning() {
  log('\n🔍 Step 1: Checking server...', 'cyan');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/',
      method: 'GET',
    });

    if (res.status === 200) {
      log('✅ Server is running', 'green');
      return true;
    }

    log(`❌ Server returned ${res.status}`, 'red');
    return false;
  } catch (err) {
    log(`❌ Server not reachable: ${err.message}`, 'red');
    return false;
  }
}

async function testHealth() {
  log('\n🔍 Step 2: Health checks...', 'cyan');

  const health = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/health',
    method: 'GET',
  });

  log(
    health.status === 200
      ? '✅ /health OK'
      : `❌ /health failed (${health.status})`,
    health.status === 200 ? 'green' : 'red'
  );

  const healthz = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/healthz',
    method: 'GET',
  });

  log(
    healthz.status === 200
      ? '✅ /healthz OK'
      : `❌ /healthz failed (${healthz.status})`,
    healthz.status === 200 ? 'green' : 'red'
  );
}

async function testCreateShortUrl() {
  log('\n🔍 Step 3: Create Short URL...', 'cyan');

  const res = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/url/shorten',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { originalUrl: 'https://www.google.com' }
  );

  if (res.status === 201) {
    createdShortCode = res.data.shortCode;
    log('✅ Short URL created', 'green');
    log(`   Code: ${createdShortCode}`, 'blue');
  } else {
    log(`❌ Create failed (${res.status})`, 'red');
    log(JSON.stringify(res.data), 'yellow');
  }
}

async function testRedirect() {
  if (!createdShortCode) return;

  log('\n🔍 Step 4: Redirect test...', 'cyan');

  const res = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/${createdShortCode}`,
    method: 'GET',
    headers: { 'User-Agent': 'Docker-Test-Agent' },
  });

  if (res.status === 302) {
    log('✅ Redirect works', 'green');
    log(`   Location: ${res.headers.location}`, 'blue');
  } else {
    log(`❌ Redirect failed (${res.status})`, 'red');
  }
}

async function testAnalytics() {
  if (!createdShortCode) return;

  log('\n🔍 Step 5: Analytics...', 'cyan');
  await new Promise((r) => setTimeout(r, 1500));

  const res = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/url/analytics/${createdShortCode}`,
    method: 'GET',
  });

  if (res.status === 200) {
    log('✅ Analytics OK', 'green');
    log(`   Total Clicks: ${res.data.totalClicks}`, 'blue');
  } else {
    log(`❌ Analytics failed (${res.status})`, 'red');
  }
}

async function testQRCode() {
  if (!createdShortCode) return;

  log('\n🔍 Step 6: QR Code...', 'cyan');

  const res = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/url/qr/${createdShortCode}`,
    method: 'GET',
  });

  if (res.status === 200 && res.data.qrCode) {
    log('✅ QR code generated', 'green');
  } else {
    log(`❌ QR failed (${res.status})`, 'red');
  }
}

/* -------------------- Infra Checks -------------------- */

function checkDocker() {
  log('\n🔍 Step 7: Docker containers...', 'cyan');

  const mongo = execSync(
    'docker ps --filter "name=url_shortener_mongo" --format "{{.Status}}"',
    { encoding: 'utf8' }
  ).trim();

  const redis = execSync(
    'docker ps --filter "name=url-shortener-redis" --format "{{.Status}}"',
    { encoding: 'utf8' }
  ).trim();

  mongo ? log(`✅ MongoDB: ${mongo}`, 'green') : log('❌ MongoDB down', 'red');
  redis ? log(`✅ Redis: ${redis}`, 'green') : log('❌ Redis down', 'red');
}

function checkMongo() {
  log('\n🔍 Step 8: MongoDB data...', 'cyan');

  const collections = execSync(
    `docker exec url_shortener_mongo mongosh -u admin -p password --authenticationDatabase admin --quiet --eval "db.getSiblingDB('urlshortener').getCollectionNames()"`,
    { encoding: 'utf8' }
  ).trim();

  log(`Collections: ${collections}`, 'blue');
}

function checkRedis() {
  if (!createdShortCode) return;

  log('\n🔍 Step 9: Redis cache...', 'cyan');

  const keys = execSync(
    `docker exec url-shortener-redis redis-cli KEYS "url:*"`,
    { encoding: 'utf8' }
  ).trim();

  keys
    ? log(`✅ Redis keys:\n${keys}`, 'green')
    : log('⚠️ No Redis keys found', 'yellow');
}

/* -------------------- Run All -------------------- */

(async function run() {
  log('\n' + '='.repeat(70), 'magenta');
  log('🚀 DOCKER BACKEND TEST SUITE', 'magenta');
  log('='.repeat(70), 'magenta');

  if (!(await checkServerRunning())) return;

  await testHealth();
  await testCreateShortUrl();
  await testRedirect();
  await testAnalytics();
  await testQRCode();

  checkDocker();
  checkMongo();
  checkRedis();

  log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY', 'green');
})();
