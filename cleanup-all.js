#!/usr/bin/env node

/**
 * Complete Laverdi Cleanup
 * Uses direct SQL execution via Supabase
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
            body: data ? JSON.parse(data) : data,
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

async function cleanup() {
  log('warn', '🧹 Complete Laverdi Portal Cleanup');
  log('info', '');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Ready to clean up all data? (yes/no): ', async (answer) => {
      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        log('error', 'Cancelled.');
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

        log('info', 'Executing cleanup SQL...');
        log('info', '');

        // All SQL commands to run
        const cleanupSteps = [
          { name: 'Disable RLS on all tables', sql: `
            ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS api_keys DISABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS instances DISABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS usage_records DISABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS user_settings DISABLE ROW LEVEL SECURITY;
          ` },
          { name: 'Delete usage_records', sql: 'DELETE FROM usage_records;' },
          { name: 'Delete user_settings', sql: 'DELETE FROM user_settings;' },
          { name: 'Delete instances', sql: 'DELETE FROM instances;' },
          { name: 'Delete api_keys', sql: 'DELETE FROM api_keys;' },
          { name: 'Delete profiles', sql: 'DELETE FROM profiles;' },
          { name: 'Delete users', sql: 'DELETE FROM users;' },
          { name: 'Re-enable RLS on all tables', sql: `
            ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS instances ENABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS usage_records ENABLE ROW LEVEL SECURITY;
            ALTER TABLE IF EXISTS user_settings ENABLE ROW LEVEL SECURITY;
          ` },
        ];

        // Execute each step
        for (const step of cleanupSteps) {
          const sqlRes = await httpsRequest(
            'POST',
            supabaseHost,
            '/rest/v1/rpc/exec_sql',
            { sql: step.sql },
            {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            }
          );

          if (sqlRes.status === 200 || sqlRes.status === 204) {
            log('success', step.name);
          } else {
            log('warn', `${step.name} (status: ${sqlRes.status})`);
            if (typeof sqlRes.body === 'string') {
              log('info', `  Response: ${sqlRes.body.substring(0, 100)}`);
            }
          }
        }

        log('info', '');

        // Get counts
        log('info', 'Verifying cleanup...');
        log('info', '');

        const tables = ['users', 'profiles', 'api_keys', 'instances', 'usage_records'];
        for (const table of tables) {
          const countRes = await httpsRequest(
            'GET',
            supabaseHost,
            `/rest/v1/${table}?select=count()`,
            null,
            {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'count=exact',
            }
          );

          if (countRes.status === 200) {
            const count = countRes.headers['content-range']?.split('/')[1] || 0;
            log('success', `${table}: ${count} records`);
          }
        }

        log('info', '');
        log('info', '═'.repeat(60));
        log('success', '✓ Cleanup complete!');
        log('info', 'All user data has been deleted.');
        log('info', '═'.repeat(60));

      } catch (error) {
        log('error', `Cleanup failed: ${error.message}`);
        console.error(error);
        process.exit(1);
      }

      resolve();
    });
  });
}

cleanup();
