/**
 * Webhooks Index
 * Documents available webhook endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      webhooks: {
        stripe: {
          url: '/api/webhooks/stripe',
          events: [
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'customer.subscription.trial_will_end',
          ],
          description: 'Listen for Stripe subscription events and trigger droplet provisioning',
        },
        do_callback: {
          url: '/api/webhooks/do-callback',
          method: 'POST',
          events: ['droplet_ready', 'droplet_error'],
          description: 'Receive "ready" signal from newly bootstrapped droplets',
          payload: {
            user_id: 'string (UUID)',
            droplet_id: 'number',
            status: 'string (ready|error)',
            ip_address: 'string (IPv4, required if status=ready)',
            ipv6_address: 'string (IPv6, optional)',
            pairing_token: 'string (security token)',
            bootstrapped_at: 'string (ISO 8601 timestamp)',
            error: 'string (optional, if status=error)',
          },
        },
      },
      documentation: 'https://docs.laverdi.dev/webhooks',
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
