const apiKey = process.env.SENDGRID_API_KEY;
console.log('API Key present:', apiKey ? apiKey.substring(0,10)+'...' : 'MISSING');

fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: 'chrislaverdiere@gmail.com' }] }],
    from: { email: 'chrislaverdiere@gmail.com', name: 'LaVerdi Test' },
    subject: 'LaVerdi Email Test - Container SendGrid',
    content: [{ type: 'text/plain', value: 'If you see this, SendGrid HTTP API works from the Docker container!' }]
  })
}).then(function(r) {
  console.log('Status:', r.status);
  return r.text();
}).then(function(t) {
  console.log('Response:', t);
}).catch(function(e) {
  console.error('Error:', e);
});
