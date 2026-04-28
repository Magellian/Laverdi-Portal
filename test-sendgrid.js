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

  console.log(colors.cyan + '📧 SendGrid Email Testing\n' + colors.reset);

  try {
    // Step 1: Verify email is enabled
    log('info', 'Step 1: Check email settings');
    const getRes = await request('GET', '/api/admin/email-settings', null, {
      'Authorization': `Bearer ${adminToken}`,
    });

    if (!getRes.body.success) {
      log('error', 'Failed to get settings');
      process.exit(1);
    }

    console.log(`    Email Enabled: ${getRes.body.settings.emailEnabled}`);
    console.log(`    Provider: ${getRes.body.settings.provider}`);
    console.log('');

    if (!getRes.body.settings.emailEnabled) {
      log('info', 'Email is disabled, enabling...');
      const enableRes = await request(
        'POST',
        '/api/admin/email-settings',
        { emailEnabled: true },
        { 'Authorization': `Bearer ${adminToken}` }
      );

      if (enableRes.status === 200) {
        log('success', 'Email enabled');
      } else {
        log('error', 'Failed to enable email');
        process.exit(1);
      }
      console.log('');
    }

    // Step 2: Send test email
    log('info', 'Step 2: Send test email via SendGrid');
    
    // Use a real email to test
    const testEmail = process.argv[2] || 'test@example.com';
    
    console.log(`    To: ${testEmail}`);
    console.log('');

    const sendRes = await request(
      'POST',
      '/api/admin/send-test-email',
      { to: testEmail },
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (sendRes.status === 200 && sendRes.body.success) {
      log('success', sendRes.body.message);
      console.log('');
      log('info', 'Check your email inbox!');
      console.log('');
      console.log(colors.yellow + 'If you don\'t see it:' + colors.reset);
      console.log('  1. Check spam/junk folder');
      console.log('  2. Check SendGrid dashboard for bounces');
      console.log('  3. Verify email address is correct');
    } else {
      log('error', `Failed: ${sendRes.body?.error || sendRes.status}`);
      console.log('');
      log('info', 'Response body:');
      console.log(JSON.stringify(sendRes.body, null, 2));
    }

  } catch (error) {
    log('error', error.message);
    process.exit(1);
  }
}

test();
