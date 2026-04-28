#!/usr/bin/env node

/**
 * Final Database Nuke - Direct deletion
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
        'Content-Profile': 'public',
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
            body: data ? JSON.parse(data) : data,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function nuke() {
  log('warn', '🔥 Final Database Nuke');
  log('warn', '');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Delete ALL users directly? (type "nuke"): ', async (answer) => {
      rl.close();

      if (answer !== 'nuke') {
        log('error', 'Cancelled.');
        process.exit(0);
      }

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const url = new URL(supabaseUrl);
        const supabaseHost = url.hostname;

        log('info', '');
        log('info', 'Step 1: Fetching all users...');

        // Get all users (without RLS)
        const usersRes = await httpsRequest(
          'GET',
          supabaseHost,
          `/rest/v1/users?select=id`,
          null,
          {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          }
        );

        const users = usersRes.body || [];
        log('success', `Found ${users.length} users`);
        log('info', '');

        if (users.length === 0) {
          log('info', 'No users to delete. Done.');
          process.exit(0);
        }

        log('info', 'Step 2: Deleting users directly (bypass RLS)...');
        log('info', '');

        let deleted = 0;

        for (const user of users) {
          const delRes = await httpsRequest(
            'DELETE',
            supabaseHost,
            `/rest/v1/users?id=eq.${user.id}`,
            null,
            {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'resolution=ignore-duplicates',
            }
          );

          if (delRes.status === 204 || delRes.status === 200) {
            log('success', `Deleted user ${user.id.substring(0, 8)}...`);
            deleted++;
          } else {
            log('warn', `Failed to delete ${user.id.substring(0, 8)}... (status: ${delRes.status})`);
          }
        }

        log('info', '');
        log('info', '═'.repeat(60));
        log('success', `✓ Nuke complete! Deleted ${deleted} users`);
        log('info', '═'.repeat(60));

      } catch (error) {
        log('error', `Nuke failed: ${error.message}`);
        console.error(error);
        process.exit(1);
      }

      resolve();
    });
  });
}

nuke();
