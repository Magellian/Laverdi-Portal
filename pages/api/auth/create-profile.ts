import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { generateApiKey } from '@/lib/api-key'
import { sendWelcomeEmail } from '@/lib/email'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[CreateProfile] REQUEST RECEIVED')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[CreateProfile] Req.body type:', typeof req.body)
    console.log('[CreateProfile] Req.body keys:', Object.keys(req.body || {}))
    
    const { userId, email } = req.body
    console.log('[CreateProfile] Extracted:', { userId, email })

    if (!userId || !email) {
      console.log('[CreateProfile] Missing params:', { userId, email })
      return res.status(400).json({ error: 'Missing userId or email' })
    }

    console.log('[CreateProfile] Creating admin client...')
    const supabase = createAdminClient()
    console.log('[CreateProfile] Admin client created, attempting database insert...')

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError)
      return res.status(500).json({ error: 'Database error' })
    }

    // If user exists, just return it
    if (existingUser) {
      return res.status(200).json({ user: existingUser })
    }

    // Create new user with 2-week trial
    const trialExpiresAt = new Date()
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 14)
    
    const newUser = {
      id: userId,
      email,
      tier: 'starter',  // Trial users start on starter tier
      api_key: generateApiKey(),
      trial_expires_at: trialExpiresAt.toISOString(),
      trial_converted: false,
      created_at: new Date().toISOString(),
    }

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single()

    if (createError) {
      console.error('[CreateProfile] ERROR creating user:', JSON.stringify(createError))
      console.error('[CreateProfile] Error code:', createError.code)
      console.error('[CreateProfile] Error message:', createError.message)
      return res.status(500).json({ error: createError.message, code: createError.code })
    }
    
    console.log('[CreateProfile] User created successfully:', createdUser.id)

    // Send welcome email (actually fire and forget - don't await)
    sendWelcomeEmail(email, createdUser.api_key, createdUser.tier)
      .then(() => console.log(`[Auth] Welcome email sent to ${email}`))
      .catch((err) => console.error(`[Auth] Failed to send welcome email to ${email}:`, err))

    // Trigger agent provisioning asynchronously (fire and forget)
    try {
      const provisionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech'}/api/agents/provision-async`
      const provisionPayload = {
        userId,
        email,
        tier: createdUser.tier
      }
      
      // Fire async request (don't wait for response)
      fetch(provisionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provisionPayload)
      }).catch(err => console.error(`[Auth] Provisioning request failed:`, err))
      
      console.log(`[Auth] Provisioning request initiated for ${email}`)
    } catch (provisionError) {
      console.error(`[Auth] Failed to initiate provisioning for ${email}:`, provisionError)
      // Don't fail the signup if provisioning fails
    }

    return res.status(201).json({ user: createdUser })
  } catch (error: any) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: error.message })
  }
}
