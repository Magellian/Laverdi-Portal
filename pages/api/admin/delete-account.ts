import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient, createBrowserClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { password } = req.body

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' })
    }

    // Verify password by attempting to sign in
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      })
    } catch (error) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    const supabaseAdmin = createAdminClient()

    // Delete all user data in order of foreign key dependencies
    try {
      // Delete API keys
      await supabaseAdmin.from('api_keys').delete().eq('user_id', user.id)

      // Delete usage logs
      await supabaseAdmin.from('usage_logs').delete().eq('user_id', user.id)

      // Delete instances
      await supabaseAdmin.from('instances').delete().eq('user_id', user.id)

      // Delete email verifications
      await supabaseAdmin.from('email_verifications').delete().eq('user_id', user.id)

      // Delete user preferences
      await supabaseAdmin.from('user_preferences').delete().eq('user_id', user.id)

      // Delete subscription
      await supabaseAdmin.from('subscriptions').delete().eq('user_id', user.id)

      // Delete user profile
      await supabaseAdmin.from('users').delete().eq('id', user.id)

      // Delete from Supabase auth
      await supabaseAdmin.auth.admin.deleteUser(user.id)

      return res.status(200).json({ message: 'Account deleted successfully' })
    } catch (error: any) {
      console.error('Error deleting account:', error)
      return res.status(500).json({ error: 'Failed to delete account' })
    }
  } catch (error: any) {
    console.error('Error in delete account handler:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
