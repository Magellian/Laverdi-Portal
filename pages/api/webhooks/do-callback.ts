import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabase';
import { sendInstanceReadyEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the webhook secret to ensure it's coming from our provision script
  const authHeader = req.headers.authorization;
  const WEBHOOK_SECRET = process.env.DO_CALLBACK_SECRET || 'fallback-secret-change-me';

  if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { user_id, droplet_ip, status } = req.body;

  if (!user_id || !droplet_ip) {
    return res.status(400).json({ error: 'Missing required payload fields' });
  }

  try {
    console.log(`Received callback for user ${user_id}: Droplet ready at ${droplet_ip}`);

    try {
      const supabaseAdmin = createAdminClient();
      
      // Update the user's instance record with the assigned IP and status
      const { error } = await supabaseAdmin
        .from('instances')
        .update({
          status: status || 'ready',
          ip_address: droplet_ip,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      if (error) {
        console.error('Supabase update error (instances table):', error.message);
        // Note: Make sure the 'instances' table exists in Supabase.
      } else {
        // Fetch the user's email to send the notification
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', user_id)
          .single();

        if (userError || !userData?.email) {
          console.error('Failed to fetch user email for notification:', userError?.message);
        } else {
          await sendInstanceReadyEmail(userData.email, droplet_ip);
        }
      }
    } catch (dbError) {
      console.error('Database error in callback:', dbError);
      // Continue processing even if DB update fails
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Callback received successfully' 
    });
  } catch (error: any) {
    console.error('DO Callback Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
