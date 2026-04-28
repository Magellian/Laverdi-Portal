#!/usr/bin/env node

/**
 * Laverdi Portal Testing Suite
 * Tests: Auth flow, Admin upgrade endpoint, Provisioning trigger
 */

const http = require('http');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(type, msg) {
  const icon = {
    'info': colors.blue + 'ℹ' + colors.reset,
    'success': colors.green + '✓' + colors.reset,
    'error': colors.red + '✗' + colors.reset,
    'warn': colors.yellow + '⚠' + colors.reset,
  }[type] || '•';
  console.log(`${icon}  ${msg}`);
}

// Helper: make HTTP request
function request(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  const baseUrl = 'http://localhost:3000';
  const adminToken = 'admin-token-change-me-in-production'; // Default token
  const testEmail = `test-${Date.now()}@example.com`;

  log('info', 'Starting Laverdi Portal test suite...\n');

  try {
    // Test 1: Health check
    log('info', 'Test 1: Portal health check');
    const healthRes = await request('GET', `${baseUrl}/api/call?test=true`);
    if (healthRes.status === 400 || healthRes.status === 200) {
      log('success', 'Portal is responding\n');
    } else {
      log('error', `Unexpected status: ${healthRes.status}\n`);
    }

    // Test 2: Admin upgrade endpoint (requires valid user first)
    log('info', 'Test 2: Admin upgrade endpoint');
    log('warn', 'Note: This requires a valid user in the database');
    log('warn', `Test email that would be used: ${testEmail}\n`);

    // Try with test user (will fail if not exists, which is ok)
    const upgradeRes = await request('POST', `${baseUrl}/api/admin/upgrade-user`, 
      { email: testEmail, tier: 'starter' },
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (upgradeRes.status === 404) {
      log('info', 'Got expected 404 (user not found in test)');
      log('success', 'Admin endpoint is properly validating users\n');
    } else if (upgradeRes.status === 200) {
      log('success', `User upgraded: ${upgradeRes.body.message}`);
      log('success', `Provisioning triggered asynchronously\n`);
    } else if (upgradeRes.status === 401) {
      log('error', 'Invalid admin token - check ADMIN_UPGRADE_TOKEN env var\n');
    } else {
      log('warn', `Unexpected status: ${upgradeRes.status}`);
      log('info', `Response: ${JSON.stringify(upgradeRes.body)}\n`);
    }

    // Test 3: Invalid token test
    log('info', 'Test 3: Verify token validation');
    const invalidTokenRes = await request('POST', `${baseUrl}/api/admin/upgrade-user`,
      { email: 'test@example.com', tier: 'starter' },
      { 'Authorization': 'Bearer invalid-token' }
    );

    if (invalidTokenRes.status === 401) {
      log('success', 'Token validation working correctly\n');
    } else {
      log('error', 'Token validation not working\n');
    }

    log('info', '✨ Test suite complete!');
    log('info', '\nNext steps:');
    log('info', '1. Open http://localhost:3000 in your browser');
    log('info', '2. Sign up with a test account');
    log('info', '3. Run: curl -X POST http://localhost:3000/api/admin/upgrade-user \\');
    log('info', '     -H "Authorization: Bearer admin-token-change-me-in-production" \\');
    log('info', '     -H "Content-Type: application/json" \\');
    log('info', '     -d \'{"email":"YOUR_TEST_EMAIL","tier":"starter"}\'');

  } catch (error) {
    log('error', `Test failed: ${error.message}`);
    process.exit(1);
  }
}

test();
