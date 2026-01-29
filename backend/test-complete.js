/**
 * Complete Backend Test Suite
 * Docker-safe (port 5050)
 */

const http = require('http');
const { execSync } = require('child_process');

const HOST = 'localhost';
const PORT = 5050; // ✅ Docker exposed port
let createdShortCode = null;

// Colors
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

function makeRequest({ path, method = 'GET', headers = {} }, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: HOST, port: PORT, path, method, headers },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : {},
            });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/* ================= TESTS ================= */

async function checkServer() {
  log('\n🔍 Checking server...', 'cyan');
  const res = await makeRequest({ path: '/' });
  if (res.status === 200) {
    log('✅ Server reachable', 'green');
    return true;
  }
  log(`❌ Server returned ${res.status}`, 'red');
  return false;
}

async function testHealth() {
  log('\n🔍 Health checks...', 'cyan');

  const h1 = await makeRequest({ path: '/health' });
  log(h1.status === 200 ? '✅ /health OK' : '❌ /health failed', h1.status === 200 ? 'green' : 'red');

  const h2 = await makeRequest({ path: '/healthz' });
  log(h2.status === 200 ? '✅ /healthz OK' : '❌ /healthz failed', h2.status === 200 ? 'green' : 'red');
}

async function createShortUrl() {
  log('\n🔍 Creating short URL...', 'cyan');

  const res = await makeRequest(
    {
      path: '/api/url/shorten',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { originalUrl: 'https://www.google.com' }
  );

  if (res.status === 201) {
    createdShortCode = res.body.shortCode;
    log('✅ Short URL created', 'green');
    log(`   Code: ${createdShortCode}`, 'blue');
    return true;
  }

  log(`❌ Create failed (${res.status})`, 'red');
  log(JSON.stringify(res.body), 'yellow');
  return false;
}

async function testRedirect() {
  log('\n🔍 Redirect test...', 'cyan');
  const res = await makeRequest({ path: `/${createdShortCode}` });
  if ([301, 302].includes(res.status)) {
    log('✅ Redirect works', 'green');
  } else {
    log(`❌ Redirect failed (${res.status})`, 'red');
  }
}

async function testAnalytics() {
  log('\n🔍 Analytics test...', 'cyan');
  await new Promise((r) => setTimeout(r, 2000));

  const res = await makeRequest({ path: `/api/url/analytics/${createdShortCode}` });
  if (res.status === 200) {
    log('✅ Analytics OK', 'green');
    log(`   Clicks: ${res.body.totalClicks}`, 'blue');
  } else {
    log(`❌ Analytics failed (${res.status})`, 'red');
  }
}

async function testQRCode() {
  log('\n🔍 QR code test...', 'cyan');
  const res = await makeRequest({ path: `/api/url/qr/${createdShortCode}` });
  if (res.status === 200) {
    log('✅ QR code OK', 'green');
  } else {
    log(`❌ QR failed (${res.status})`, 'red');
  }
}

function checkDocker() {
  log('\n🔍 Docker services...', 'cyan');
  log(execSync('docker ps --format "{{.Names}}"').toString(), 'blue');
}

/* ================= RUN ================= */

(async () => {
  log('\n' + '='.repeat(60), 'magenta');
  log('🚀 BACKEND TEST SUITE (DOCKER)', 'magenta');
  log('='.repeat(60), 'magenta');

  if (!(await checkServer())) return;

  await testHealth();
  if (await createShortUrl()) {
    await testRedirect();
    await testAnalytics();
    await testQRCode();
  }

  checkDocker();

  log('\n✅ ALL TESTS COMPLETED', 'green');
})();
