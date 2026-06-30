import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, isLoading } = useAuth()
  const [errorMsg, setErrorMsg] = useState('')
  const processed = useRef(false)

  useEffect(() => {
    let mounted = true

    const handleCallback = async () => {
      // 1. If we already have a session, redirect immediately
      if (session) {
        navigate('/dashboard', { replace: true })
        return
      }

      // 2. If AuthProvider finished loading and we still don't have a session
      // (and we aren't in the middle of processing a code)
      if (!isLoading && !searchParams.get('code')) {
        navigate('/login?error=no_session', { replace: true })
        return
      }

      if (processed.current) return
      
      const code = searchParams.get('code')
      
      // 3. Explicitly exchange code with a timeout
      if (code) {
        processed.current = true
        try {
          const exchangePromise = supabase.auth.exchangeCodeForSession(code)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Exchange timeout')), 8000)
          )
          
          const { error } = await Promise.race([exchangePromise, timeoutPromise]) as any
          if (error) throw error
          
          if (mounted) {
            navigate('/dashboard', { replace: true })
          }
        } catch (err) {
          console.error('[AuthCallback] Exchange failed:', err)
          if (mounted) {
            setErrorMsg('Authentication failed or timed out. Redirecting...')
            setTimeout(() => navigate('/login?error=auth_callback_failed', { replace: true }), 2000)
          }
        }
      }
    }

    void handleCallback()

    return () => { mounted = false }
  }, [session, isLoading, navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        {errorMsg ? (
          <div className="text-destructive font-medium">{errorMsg}</div>
        ) : (
          <>
            <Spinner size="lg" className="mx-auto" />
            <p className="text-muted-foreground text-sm">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  )
}
