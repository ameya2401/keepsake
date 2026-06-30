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
      if (processed.current) return
      
      const code = searchParams.get('code')
      
      // If there's a code, we explicitly exchange it to avoid race conditions
      if (code) {
        processed.current = true
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          
          if (mounted) {
            navigate('/dashboard', { replace: true })
          }
        } catch (err) {
          console.error('[AuthCallback] Exchange failed:', err)
          if (mounted) {
            setErrorMsg('Authentication failed. Please try again.')
            setTimeout(() => navigate('/login?error=auth_callback_failed', { replace: true }), 3000)
          }
        }
        return
      }

      // If no code is present in URL (e.g., standard redirect or already processed)
      // wait for AuthProvider to finish loading
      if (!isLoading) {
        if (session) {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/login?error=no_session', { replace: true })
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
