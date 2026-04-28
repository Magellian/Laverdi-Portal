#!/usr/bin/env node

/**
 * Total Laverdi Portal Wipe
 * Deletes:
 * 1. All Supabase Auth users
 * 2. All user profiles (database)
 * 3. All API keys
 * 4. All instances/containers
 * 5. All usage records
 * 6. All related data
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

async function totalWipe() {
  log('warn', '🔥 TOTAL WIPE - This will DELETE ALL user data from Laverdi');
  log('warn', '');
  log('warn', 'This will delete:');
  log('warn', '  • All Supabase Auth users (54 users)');
  log('warn', '  • All user profiles from database');
  log('warn', '  • All API keys');
  log('warn', '  • All instances/containers');
  log('warn', '  • All usage records');
  log('warn', '');
  log('error', 'THIS CANNOT BE UNDONE');
  log('warn', '');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Type "WIPE EVERYTHING" to confirm: ', async (answer) => {
      rl.close();

      if (answer !== 'WIPE EVERYTHING') {
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
        const projectId = supabaseHost.split('.')[0];

        log('info', '');
        log('info', 'Starting total wipe...');
        log('info', '');

        // Helper to make REST API calls
        async function deleteFromTable(tableName, filters = null) {
          let path = `/rest/v1/${tableName}`;
          if (filters) {
            path += '?' + Object.entries(filters)
              .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
              .join('&');
          }

          const deleteRes = await httpsRequest(
            'DELETE',
            supabaseHost,
            path,
            null,
            {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Profile': 'public',
              'Prefer': 'return=representation',
            }
          );

          return {
            status: deleteRes.status,
            count: deleteRes.body?.length || 0,
          };
        }

        // Helper to get records from table
        async function getFromTable(tableName) {
          const getRes = await httpsRequest(
            'GET',
            supabaseHost,
            `/rest/v1/${tableName}`,
            null,
            {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Profile': 'public',
            }
          );

          return getRes.body || [];
        }

        // Step 1: Delete Supabase Auth users
        log('info', 'Step 1: Deleting Supabase Auth users...');
        const authRes = await httpsRequest(
          'GET',
          supabaseHost,
          '/auth/v1/admin/users?per_page=1000',
          null,
          {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          }
        );

        const authUsers = authRes.body?.users || [];
        let authDeleted = 0;

        for (const user of authUsers) {
          const delRes = await httpsRequest(
            'DELETE',
            supabaseHost,
            `/auth/v1/admin/users/${user.id}`,
            null,
            {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            }
          );

          if (delRes.status === 204 || delRes.status === 200) {
            authDeleted++;
          }
        }

        log('success', `Deleted ${authDeleted} auth users`);
        log('info', '');

        // Step 2: Delete database tables (cascading)
        log('info', 'Step 2: Deleting database records...');

        const tables = [
          'api_keys',
          'instances',
          'usage_records',
          'user_settings',
          'users',
        ];

        let totalDeleted = 0;

        for (const table of tables) {
          try {
            // Get count first
            const records = await getFromTable(table);
            const count = records.length;

            if (count === 0) {
              log('info', `  ${table}: 0 records`);
              continue;
            }

            // Delete all records
            const delRes = await deleteFromTable(table);

            if (delRes.status === 204 || delRes.status === 200) {
              log('success', `  ${table}: deleted ${count} records`);
              totalDeleted += count;
            } else {
              log('warn', `  ${table}: ${count} records (status: ${delRes.status})`);
            }
          } catch (e) {
            log('warn', `  ${table}: error - ${e.message}`);
          }
        }

        log('info', '');

        // Step 3: Summary
        log('info', '═'.repeat(60));
        log('success', '🔥 TOTAL WIPE COMPLETE');
        log('info', '');
        log('success', `✓ Auth users deleted: ${authDeleted}`);
        log('success', `✓ Database records deleted: ${totalDeleted}`);
        log('info', '');
        log('warn', 'Remaining:');
        log('warn', '  • Portal code/containers (still running)');
        log('warn', '  • VPS OpenClaw instances (still running)');
        log('warn', '');
        log('info', 'The system is ready for fresh testing.');
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

totalWipe();
