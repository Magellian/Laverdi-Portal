#!/usr/bin/env node

const { Client } = require('ssh2');
const fs = require('fs');

const client = new Client();

const host = process.argv[2] || '66.42.70.66';
const user = process.argv[3] || 'root';
const password = process.argv[4] || 'F,6f$bZKYr9CTDN';
const command = process.argv.slice(5).join(' ');

if (!command) {
  console.error('Usage: node ssh_exec.js <host> <user> <password> <command>');
  process.exit(1);
}

client.on('ready', function() {
  client.exec(command, function(err, stream) {
    if (err) {
      console.error('Error:', err);
      client.end();
      process.exit(1);
    }
    
    stream.on('close', function(code, signal) {
      client.end();
      process.exit(code || 0);
    });
    
    stream.on('data', function(data) {
      process.stdout.write(data);
    });
    
    stream.stderr.on('data', function(data) {
      process.stderr.write(data);
    });
  });
}).connect({
  host: host,
  port: 22,
  username: user,
  password: password,
  readyTimeout: 30000,
});

client.on('error', function(err) {
  console.error('Connection error:', err.message);
  process.exit(1);
});
