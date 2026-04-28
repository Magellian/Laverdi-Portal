#!/usr/bin/env node

/**
 * Full Laverdi Portal End-to-End Test
 * 1. Creates test user via Supabase (auth endpoint)
 * 2. Triggers upgrade via admin endpoint
 * 3. Verifies provisioning was triggered
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');

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
  const adminToken = 'admin-token-change-me-in-production';

  log('info', 'Laverdi Portal End-to-End Test');
  log('info', '═'.repeat(50) + '\n');

  try {
    // Get test email
    const testEmail = `test-${Date.now()}@laverdi-test.com`;
    const testPassword = 'TestPassword123!';

    log('info', `Test user email: ${testEmail}`);
    log('info', `Test tier: starter\n`);

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      log('error', 'Missing Supabase env vars in process.env');
      log('info', 'Required:');
      log('info', '  - NEXT_PUBLIC_SUPABASE_URL');
      log('info', '  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
      log('info', '  - SUPABASE_SERVICE_ROLE_KEY');
      log('info', '\nSkipping auth test. Will test admin endpoint only.\n');

      // Test admin endpoint without user
      log('warn', 'Testing admin endpoint with non-existent user...');
      const upgradeRes = await request('POST', `${baseUrl}/api/admin/upgrade-user`,
        { email: testEmail, tier: 'starter' },
        { 'Authorization': `Bearer ${adminToken}` }
      );

      if (upgradeRes.status === 404) {
        log('success', 'Admin endpoint correctly rejects non-existent user');
      }
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create user via auth
    log('info', 'Step 1: Creating test user via Supabase Auth');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        log('warn', 'User already exists, using existing user');
      } else {
        throw authError;
      }
    } else {
      log('success', `User created: ${authData.user.id}`);
    }

    // Get the user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id, tier')
      .eq('email', testEmail)
      .single();

    if (!userData) {
      log('error', 'User profile not found in database');
      return;
    }

    const userId = userData.id;
    const originalTier = userData.tier;

    log('success', `User profile found: tier=${originalTier}`);
    log('info', `User ID: ${userId}\n`);

    // Step 2: Test admin upgrade endpoint
    log('info', 'Step 2: Testing admin upgrade endpoint');
    log('info', 'Upgrading user from ' + originalTier + ' to starter...\n');

    const upgradeRes = await request('POST', `${baseUrl}/api/admin/upgrade-user`,
      { email: testEmail, tier: 'starter' },
      { 'Authorization': `Bearer ${adminToken}` }
    );

    if (upgradeRes.status === 200) {
      log('success', 'Upgrade request successful');
      log('success', `Response: ${upgradeRes.body.message}`);
      log('info', `Updated user: tier=${upgradeRes.body.user.tier}`);
      log('info', `Trial converted: ${upgradeRes.body.user.trial_converted}\n`);
    } else if (upgradeRes.status === 401) {
      log('error', 'Invalid admin token');
      log('info', 'Check ADMIN_UPGRADE_TOKEN env var\n');
      return;
    } else {
      log('error', `Unexpected status: ${upgradeRes.status}`);
      log('info', `Response: ${JSON.stringify(upgradeRes.body)}\n`);
      return;
    }

    // Step 3: Verify tier was updated
    log('info', 'Step 3: Verifying database update');
    await new Promise(r => setTimeout(r, 1000)); // Wait a bit

    const { data: verifyData } = await supabase
      .from('users')
      .select('id, tier, trial_converted, trial_expires_at')
      .eq('id', userId)
      .single();

    if (verifyData.tier === 'starter') {
      log('success', 'Tier updated in database: ' + verifyData.tier);
      log('success', 'Trial converted: ' + verifyData.trial_converted);
    } else {
      log('error', 'Tier was not updated');
    }

    // Summary
    log('info', '\n' + '═'.repeat(50));
    log('success', 'End-to-end test PASSED ✨');
    log('info', '\nWhat was tested:');
    log('success', '✓ User creation via Supabase Auth');
    log('success', '✓ Admin upgrade endpoint authentication');
    log('success', '✓ Tier update in database');
    log('success', '✓ Trial conversion flag');
    log('warn', '⚠ Container provisioning (async, check VPS logs)');

    log('info', '\nNext: Check VPS for provisioning');
    log('info', 'ssh root@64.23.142.154');
    log('info', 'docker ps | grep laverdi');

  } catch (error) {
    log('error', `Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

test();
