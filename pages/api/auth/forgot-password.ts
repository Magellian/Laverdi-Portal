import type { NextApiRequest, NextApiResponse } from 'next'
import { createBrowserClient, createAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const supabase = createBrowserClient()

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (error) {
      // Don't reveal whether email exists (security)
      console.error('Password reset error:', error)
      return res.status(200).json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    }

    return res.status(200).json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    })
  } catch (error: any) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: error.message })
  }
}
