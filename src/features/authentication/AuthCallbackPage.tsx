import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { session, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/login?error=auth_callback_failed', { replace: true })
      }
    }
  }, [session, isLoading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-muted-foreground text-sm">Completing sign in...</p>
      </div>
    </div>
  )
}
