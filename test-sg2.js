var apiKey = process.env.SENDGRID_API_KEY;
fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: 'chrislaverdiere@gmail.com' }] }],
    from: { email: 'noreply@laverdi.tech', name: 'LaVerdi' },
    subject: 'LaVerdi Email System LIVE - noreply@laverdi.tech verified!',
    content: [{ type: 'text/html', value: '<h2>Email system is working!</h2><p>This was sent from <strong>noreply@laverdi.tech</strong> via SendGrid HTTP API from inside the Docker container.</p><p>Your portal can now send welcome emails, receipts, and notifications.</p>' }]
  })
}).then(function(r) {
  console.log('Status:', r.status);
  return r.text();
}).then(function(t) {
  console.log('Response:', t || '(empty - success)');
}).catch(function(e) {
  console.error('Error:', e);
});
