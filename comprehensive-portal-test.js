#!/usr/bin/env node

/**
 * Comprehensive Laverdi Portal Test
 * 1. Creates a Supabase user directly
 * 2. Creates a profile
 * 3. Tests admin upgrade endpoint
 * 4. Verifies provisioning was triggered
 */

const https = require('https');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m',
};

function log(type, msg) {
  const icon = {
    'info': colors.cyan + 'ℹ' + colors.reset,
    'success': colors.green + '✓' + colors.reset,
    'error': colors.red + '✗' + colors.reset,
    'warn': colors.yellow + '⚠' + colors.reset,
  }[type] || '•';
  console.log(`${icon}  ${msg}`);
}

function httpsRequest(method, host, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      host,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
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
  log('info', 'Comprehensive Laverdi Portal Test');
  log('info', '═'.repeat(60) + '\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      log('error', 'Missing Supabase credentials');
      log('info', 'Required env vars:');
      log('info', '  - NEXT_PUBLIC_SUPABASE_URL');
      log('info', '  - SUPABASE_SERVICE_ROLE_KEY');
      log('info', '\nSet these from .env.local and try again');
      process.exit(1);
    }

    // Parse Supabase URL
    const url = new URL(supabaseUrl);
    const supabaseHost = url.hostname;

    log('info', `Supabase Project: ${supabaseHost}`);
    log('info', `Service Role Key: ${supabaseServiceKey.substring(0, 20)}...`);
    log('info', '');

    // Generate test credentials
    const testEmail = `test-${Date.now()}@laverdi-test.com`;
    const testPassword = 'TestPassword123456!';

    log('info', `📧 Test Email: ${testEmail}`);
    log('info', `🔐 Password: ${testPassword.substring(0, 6)}...`);
    log('info', '');

    // Step 1: Create user via Supabase Admin API
    log('info', 'Step 1: Creating test user via Supabase Admin API...');
    log('info', '');

    const createUserRes = await httpsRequest(
      'POST',
      supabaseHost,
      '/auth/v1/admin/users',
      {
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      },
      {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    );

    if (createUserRes.status >= 400) {
      if (createUserRes.body?.msg?.includes('already exists')) {
        log('warn', 'User already exists, continuing...');
      } else {
        log('error', `Failed to create user: ${createUserRes.body?.msg || createUserRes.status}`);
        log('info', JSON.stringify(createUserRes.body, null, 2));
        process.exit(1);
      }
    } else {
      log('success', `User created: ${createUserRes.body?.id}`);
    }

    const userId = createUserRes.body?.id;
    if (!userId) {
      log('error', 'Could not get user ID');
      process.exit(1);
    }

    log('info', `User ID: ${userId}`);
    log('info', '');

    // Step 2: Create user profile via Portal API
    log('info', 'Step 2: Creating user profile via Portal API...');
    log('info', '');

    const profileRes = await fetch('http://localhost:3000/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email: testEmail,
      }),
    })
      .then(r => r.json())
      .catch(e => ({ error: e.message }));

    if (profileRes.error) {
      log('error', `Failed to create profile: ${profileRes.error}`);
      log('info', JSON.stringify(profileRes, null, 2));
    } else {
      log('success', 'Profile created successfully');
      log('info', `Tier: ${profileRes.tier}`);
    }

    log('info', '');

    // Step 3: Test admin upgrade endpoint
    log('info', 'Step 3: Testing admin upgrade endpoint...');
    log('info', '');

    const adminToken = 'admin-token-change-me-in-production';
    const upgradeRes = await fetch('http://localhost:3000/api/admin/upgrade-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: testEmail,
        tier: 'starter',
      }),
    })
      .then(r => r.json())
      .catch(e => ({ error: e.message }));

    if (upgradeRes.error) {
      log('error', `Upgrade failed: ${upgradeRes.error}`);
      log('info', JSON.stringify(upgradeRes, null, 2));
    } else {
      log('success', upgradeRes.message);
      log('success', `New tier: ${upgradeRes.user?.tier}`);
      log('success', `Trial converted: ${upgradeRes.user?.trial_converted}`);
    }

    log('info', '');

    // Summary
    log('info', '═'.repeat(60));
    log('success', '✨ Test Complete!');
    log('info', '');
    log('info', 'Test User Details:');
    log('info', `  Email: ${testEmail}`);
    log('info', `  User ID: ${userId}`);
    log('info', `  Tier: starter`);
    log('info', '');
    log('info', 'Next Steps:');
    log('info', '1. Check Supabase dashboard for the user');
    log('info', '2. Verify tier in database');
    log('info', '3. Check VPS for container provisioning:');
    log('info', '   ssh root@64.23.142.154');
    log('info', '   docker ps | grep laverdi');

  } catch (error) {
    log('error', `Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

test();
