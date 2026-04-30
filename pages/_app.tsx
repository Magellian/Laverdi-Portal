import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../styles/globals.css';
import { createBrowserClient } from '@/lib/supabase';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize Supabase client on app load to set up auth listeners
    // This ensures session persistence is active from the start
    const supabase = createBrowserClient()
    
    // Verify environment variables are loaded
    if (typeof window !== 'undefined') {
      console.log('[App] Supabase initialized on app load', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'MISSING',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'MISSING'
      })
    }
    
    // Check if there's a session in localStorage and verify it with Supabase
    const checkStoredSession = async () => {
      try {
        const storedSession = localStorage.getItem('sb-auth-session')
        if (storedSession) {
          console.log('[App] Found stored session in localStorage')
        }
        
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[App] Current Supabase session:', {
          exists: !!session,
          user: session?.user?.email,
          hasToken: !!session?.access_token
        })
      } catch (error) {
        console.error('[App] Error checking session:', error)
      }
    }
    
    checkStoredSession()
  }, [])

  return <Component {...pageProps} />;
}
