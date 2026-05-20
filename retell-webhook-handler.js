#!/usr/bin/env node

/**
 * Fife RV AI Receptionist - Retell Webhook Handler
 * Receives webhook events from Retell AI
 * Processes calls and leads, stores in Supabase
 * Sends email alerts to team
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dcvrkpgvxqdcboostkpz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const RETELL_WEBHOOK_SECRET = process.env.RETELL_WEBHOOK_SECRET || '';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create webhook handler
const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'retell-webhook-handler' }));
    return;
  }

  // Retell webhook endpoint
  if (req.url === '/webhook/retell' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const event = JSON.parse(body);
        console.log(`[WEBHOOK] Event type: ${event.event}`);
        console.log(`[WEBHOOK] Call ID: ${event.call?.call_id || 'N/A'}`);

        // Log to Supabase calls table
        if (event.event === 'call_started') {
          const { data, error } = await supabase
            .from('calls')
            .insert([
              {
                call_id: event.call?.call_id,
                phone_number: event.call?.from_number,
                started_at: new Date().toISOString(),
                status: 'in_progress',
                metadata: { event_type: 'call_started' }
              }
            ]);

          if (error) console.error('Error logging call:', error);
          else console.log('Call logged successfully');
        }

        // Handle call ended event
        if (event.event === 'call_ended') {
          const { data, error } = await supabase
            .from('calls')
            .update({
              status: 'completed',
              ended_at: new Date().toISOString(),
              duration: event.call?.duration_seconds || 0,
              transcript: event.call?.transcript || ''
            })
            .eq('call_id', event.call?.call_id);

          if (error) console.error('Error updating call:', error);
          else console.log('Call updated successfully');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, event_id: event.event }));
      } catch (err) {
        console.error('Webhook processing error:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Retell Webhook Handler listening on 0.0.0.0:${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook/retell`);
  console.log(`✅ Ready to receive Retell webhook events`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
