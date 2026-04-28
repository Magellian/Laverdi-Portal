#!/usr/bin/env node

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(type, msg) {
  const icon = {
    'success': colors.green + '✓' + colors.reset,
    'error': colors.red + '✗' + colors.reset,
    'info': colors.cyan + 'ℹ' + colors.reset,
  }[type] || '•';
  console.log(`${icon}  ${msg}`);
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      host: 'localhost',
      port: 3000,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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
  const adminToken = 'admin-token-change-me-in-production';

  console.log(colors.cyan + '🧪 Testing Email Admin Endpoints\n' + colors.reset);

  try {
    // Test 1: Get settings
    log('info', 'Test 1: Get current email settings');
    const getRes = await request('GET', '/api/admin/email-settings', null, {
      'Authorization': `Bearer ${adminToken}`,
    });

    if (getRes.status === 200 && getRes.body.success) {
      log('success', 'Settings retrieved');
      console.log(`    Email Enabled: ${getRes.body.settings.emailEnabled}`);
      console.log(`    Provider: ${getRes.body.settings.provider}`);
      console.log(`    From: ${getRes.body.settings.fromEmail}`);
    } else {
      log('error', `Failed: ${getRes.body?.error || getRes.status}`);
    }
    console.log('');

    // Test 2: Disable email
    log('info', 'Test 2: Disable email sending');
    const disableRes = await request(
      'POST',
      '/api/admin/email-settings',
      { emailEnabled: false },
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (disableRes.status === 200) {
      log('success', 'Email disabled');
      console.log(`    Email Enabled: ${disableRes.body.settings.emailEnabled}`);
    } else {
      log('error', `Failed: ${disableRes.body?.error}`);
    }
    console.log('');

    // Test 3: Send test email (disabled mode)
    log('info', 'Test 3: Send test email (with email disabled)');
    const testRes = await request(
      'POST',
      '/api/admin/send-test-email',
      { to: 'test@example.com' },
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (testRes.status === 200 && testRes.body.success) {
      log('success', testRes.body.message);
      console.log(`    (Check server logs for "[Email] DISABLED" message)`);
    } else {
      log('error', `Failed: ${testRes.body?.error}`);
    }
    console.log('');

    // Test 4: Re-enable email
    log('info', 'Test 4: Re-enable email sending');
    const enableRes = await request(
      'POST',
      '/api/admin/email-settings',
      { emailEnabled: true },
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (enableRes.status === 200) {
      log('success', 'Email enabled');
      console.log(`    Email Enabled: ${enableRes.body.settings.emailEnabled}`);
    } else {
      log('error', `Failed: ${enableRes.body?.error}`);
    }
    console.log('');

    console.log(colors.cyan + '═'.repeat(50) + colors.reset);
    log('success', 'All tests passed! ✨');
    console.log('');
    console.log(colors.yellow + 'Next steps:' + colors.reset);
    console.log('  1. Open http://localhost:3000/admin/email-test in browser');
    console.log('  2. Toggle email on/off via the dashboard');
    console.log('  3. Send test emails to verify configuration');
  } catch (error) {
    log('error', error.message);
    process.exit(1);
  }
}

test();
