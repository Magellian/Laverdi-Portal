var http = require('http');

var postData = JSON.stringify({ userId: 'test123', email: 'x@y.com' });

var options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/create-profile',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

var req = http.request(options, function(res) {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));
  var body = '';
  res.on('data', function(d) { body += d; });
  res.on('end', function() { console.log('Body:', body); });
});

req.on('error', function(e) { console.error('Error:', e.message); });
req.write(postData);
req.end();
