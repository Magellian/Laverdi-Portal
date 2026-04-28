#!/usr/bin/env node

/**
 * Wipe Supabase Database
 * Deletes all users, profiles, and instances
 */

const https = require('https');
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
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

async function wipeSupabase() {
  log('warn', '⚠️  WARNING: This will DELETE all user accounts from Supabase');
  log('warn', 'This action cannot be undone.');
  log('info', '');

  // Confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Type "DELETE ALL" to confirm: ', async (answer) => {
      rl.close();

      if (answer !== 'DELETE ALL') {
        log('error', 'Cancelled. No data was deleted.');
        process.exit(0);
      }

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
          log('error', 'Missing Supabase env vars');
          process.exit(1);
        }

        const url = new URL(supabaseUrl);
        const supabaseHost = url.hostname;

        log('info', '');
        log('info', 'Starting Supabase wipe...');
        log('info', '');

        // Step 1: Get all users
        log('info', 'Step 1: Fetching all users...');
        const usersRes = await httpsRequest(
          'GET',
          supabaseHost,
          '/auth/v1/admin/users?per_page=1000',
          null,
          {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          }
        );

        if (usersRes.status >= 400) {
          log('error', `Failed to fetch users: ${usersRes.status}`);
          log('info', JSON.stringify(usersRes.body, null, 2));
          process.exit(1);
        }

        const users = usersRes.body?.users || [];
        log('success', `Found ${users.length} users`);

        if (users.length === 0) {
          log('warn', 'No users found. Database is already empty.');
          process.exit(0);
        }

        log('info', '');

        // Step 2: Delete each user
        log('info', 'Step 2: Deleting users...');
        let deleted = 0;
        let failed = 0;

        for (const user of users) {
          const deleteRes = await httpsRequest(
            'DELETE',
            supabaseHost,
            `/auth/v1/admin/users/${user.id}`,
            null,
            {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            }
          );

          if (deleteRes.status === 204 || deleteRes.status === 200) {
            log('success', `Deleted: ${user.email}`);
            deleted++;
          } else {
            log('error', `Failed to delete ${user.email}: ${deleteRes.status}`);
            failed++;
          }
        }

        log('info', '');
        log('info', '═'.repeat(60));
        log('success', `✓ Wipe complete!`);
        log('info', `  Deleted: ${deleted} users`);
        if (failed > 0) {
          log('warn', `  Failed: ${failed} users`);
        }
        log('info', '═'.repeat(60));

      } catch (error) {
        log('error', `Wipe failed: ${error.message}`);
        console.error(error);
        process.exit(1);
      }

      resolve();
    });
  });
}

wipeSupabase();
