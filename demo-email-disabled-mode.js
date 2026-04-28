#!/usr/bin/env node

/**
 * Demo: Email system in DISABLED mode
 * Shows how emails are logged without actually sending them
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(type, msg) {
  const icon = {
    'success': colors.green + '✓' + colors.reset,
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

async function demo() {
  const adminToken = 'admin-token-change-me-in-production';

  console.log(colors.cyan + '📧 Email System Demo - Disabled Mode\n' + colors.reset);
  console.log('This demo shows how emails are logged without sending them.\n');

  try {
    // Step 1: Verify email is disabled
    log('info', 'Step 1: Check email settings');
    const getRes = await request('GET', '/api/admin/email-settings', null, {
      'Authorization': `Bearer ${adminToken}`,
    });

    if (getRes.body.settings.emailEnabled) {
      log('info', 'Email is currently ENABLED');
      log('info', 'Disabling for demo...');
      
      await request('POST', '/api/admin/email-settings', 
        { emailEnabled: false },
        { 'Authorization': `Bearer ${adminToken}` }
      );
    }
    
    log('success', 'Email is DISABLED');
    console.log('\n' + colors.yellow + 'In disabled mode:' + colors.reset);
    console.log('  • Email sending is blocked');
    console.log('  • Actions are logged to console');
    console.log('  • Perfect for testing without spamming inboxes\n');

    // Step 2: Create a test user (which would normally send welcome email)
    log('info', 'Step 2: Creating test user (watch for email log)');
    
    const testEmail = `demo-${Date.now()}@example.com`;
    
    // Simulate what would happen during signup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      log('info', 'Skipping user creation (env vars not set)');
      log('info', 'But here\'s what would happen:\n');
      
      console.log('   User signs up → Welcome email queued');
      console.log('   [Email] DISABLED - Would send to ' + testEmail);
      console.log('   [Email] DISABLED - Subject: "Welcome to Laverdi.tech OpenClaw - Your API Key"');
      console.log('\n');
    }

    // Step 3: Show admin dashboard info
    log('info', 'Step 3: How to manage emails');
    console.log('');
    console.log(colors.cyan + 'Via Admin Dashboard:' + colors.reset);
    console.log('  → Open http://localhost:3000/admin/email-test');
    console.log('  → Toggle email on/off with buttons');
    console.log('  → Send test emails');
    console.log('  → View configuration\n');

    console.log(colors.cyan + 'Via API:' + colors.reset);
    console.log('  → Check settings: GET /api/admin/email-settings');
    console.log('  → Toggle: POST /api/admin/email-settings');
    console.log('  → Send test: POST /api/admin/send-test-email\n');

    // Step 4: Summary
    console.log(colors.green + '═'.repeat(60) + colors.reset);
    log('success', 'Email system ready! ✨');
    console.log('');
    console.log(colors.yellow + 'To enable real emails:' + colors.reset);
    console.log('  1. Get SendGrid API key (https://sendgrid.com)');
    console.log('  2. Add to .env.local: SENDGRID_API_KEY=sg_...');
    console.log('  3. Toggle via dashboard: http://localhost:3000/admin/email-test');
    console.log('  4. Or via API: POST /api/admin/email-settings');
    console.log('  5. Users will receive emails on signup!\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

demo();
