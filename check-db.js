#!/usr/bin/env node

/**
 * Check Laverdi Database State
 */

const https = require('https');

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

async function checkDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = new URL(supabaseUrl);
  const supabaseHost = url.hostname;

  console.log('📊 Database Status Check\n');

  const tables = [
    'users',
    'profiles', 
    'api_keys',
    'instances',
    'usage_records',
    'user_settings',
  ];

  for (const table of tables) {
    const res = await httpsRequest(
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

    let count = 0;
    if (res.headers['content-range']) {
      count = parseInt(res.headers['content-range'].split('/')[1]);
    } else if (Array.isArray(res.body)) {
      count = res.body.length;
    }

    const status = count > 0 ? '❌' : '✅';
    console.log(`${status} ${table.padEnd(20)} ${count} records`);
  }

  console.log('\n\n📋 Recent Users:\n');

  const usersRes = await httpsRequest(
    'GET',
    supabaseHost,
    `/rest/v1/users?select=id,email,tier&order=created_at.desc&limit=5`,
    null,
    {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  );

  if (Array.isArray(usersRes.body) && usersRes.body.length > 0) {
    console.log('ID | Email | Tier');
    console.log('---|-------|-----');
    for (const user of usersRes.body) {
      console.log(`${user.id.substring(0, 8)}... | ${user.email} | ${user.tier}`);
    }
  } else {
    console.log('(no users)');
  }
}

checkDb().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
