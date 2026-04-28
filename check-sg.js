// Check SendGrid sender verification status
var apiKey = process.env.SENDGRID_API_KEY;
var fromEmail = process.env.SENDGRID_FROM_EMAIL;
console.log('API Key:', apiKey ? apiKey.substring(0,15)+'...' : 'MISSING');
console.log('From Email:', fromEmail || 'NOT SET');

// Check verified senders
fetch('https://api.sendgrid.com/v3/verified_senders', {
  headers: { 'Authorization': 'Bearer ' + apiKey }
}).then(function(r) { return r.json(); }).then(function(d) {
  console.log('Verified senders:', JSON.stringify(d, null, 2));
}).catch(function(e) { console.error('Error:', e); });
