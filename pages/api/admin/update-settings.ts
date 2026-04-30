import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient, createBrowserClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabaseAdmin = createAdminClient()
    const { action } = req.body

    // Handle email update request
    if (action === 'update_email') {
      const { new_email } = req.body

      if (!new_email || typeof new_email !== 'string') {
        return res.status(400).json({ error: 'Invalid email' })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(new_email)) {
        return res.status(400).json({ error: 'Invalid email format' })
      }

      // Check if email is already in use
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', new_email)
        .neq('id', user.id)
        .single()

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' })
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

      // Store verification code temporarily (in production, use Redis or similar)
      const { error: storeError } = await supabaseAdmin
        .from('email_verifications')
        .insert({
          user_id: user.id,
          new_email,
          code: verificationCode,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        })

      if (storeError) {
        console.error('Error storing verification code:', storeError)
        return res.status(500).json({ error: 'Failed to process email change' })
      }

      // Send verification email
      try {
        await sendEmail({
          to: new_email,
          subject: 'Verify your new email address - Laverdi.tech',
          html: `
            <h2>Verify Your Email Address</h2>
            <p>You requested to change your email address. Use this code to verify:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">${verificationCode}</p>
            <p>This code expires in 15 minutes.</p>
            <p>If you didn't request this change, please ignore this email.</p>
          `,
        })
      } catch (emailError) {
        console.error('Error sending verification email:', emailError)
        return res.status(500).json({ error: 'Failed to send verification email' })
      }

      return res.status(200).json({ message: 'Verification email sent' })
    }

    // Handle email verification
    if (action === 'verify_email') {
      const { code } = req.body

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Invalid verification code' })
      }

      // Get verification record
      const { data: verifyRecord, error: verifyError } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (verifyError || !verifyRecord) {
        return res.status(400).json({ error: 'Invalid or expired verification code' })
      }

      // Update user email
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ email: verifyRecord.new_email })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating email:', updateError)
        return res.status(500).json({ error: 'Failed to update email' })
      }

      // Delete verification record
      await supabaseAdmin
        .from('email_verifications')
        .delete()
        .eq('id', verifyRecord.id)

      return res.status(200).json({ message: 'Email updated successfully' })
    }

    // Handle preferences update
    if (action === 'update_preferences') {
      const { preferences } = req.body

      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: 'Invalid preferences' })
      }

      // Check if preferences record exists
      const { data: existingPrefs } = await supabaseAdmin
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingPrefs) {
        // Update existing
        const { error: updateError } = await supabaseAdmin
          .from('user_preferences')
          .update({
            ...preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error updating preferences:', updateError)
          return res.status(500).json({ error: 'Failed to update preferences' })
        }
      } else {
        // Insert new
        const { error: insertError } = await supabaseAdmin
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...preferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Error creating preferences:', insertError)
          return res.status(500).json({ error: 'Failed to save preferences' })
        }
      }

      return res.status(200).json({ message: 'Preferences updated successfully' })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
