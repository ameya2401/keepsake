import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Brain, Mail, Lock, Eye, EyeOff, User, Chrome } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { Button, Input, Label } from '@/components/ui'

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupFormValues = z.infer<typeof signupSchema>

// ─────────────────────────────────────────────────────────────
// Signup Page
// ─────────────────────────────────────────────────────────────

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (values: SignupFormValues) => {
    setServerError('')
    const { error } = await signUpWithEmail(values.email, values.password, values.fullName)
    if (error) {
      setServerError(error.message)
    } else {
      setSuccessMessage('Check your email to confirm your account!')
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    await signInWithGoogle()
    setGoogleLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-40 right-10 w-80 h-80 bg-violet-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">MemoryVerse</span>
            <p className="text-xs text-violet-300">AI Memory OS</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Start building your
            <br />
            <span className="text-violet-300">knowledge universe.</span>
          </h1>
          <p className="text-violet-200 text-lg leading-relaxed max-w-md">
            Upload once. MemoryVerse remembers everything — skills, projects,
            certifications, internships — all connected intelligently.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: '🧠', text: 'AI-powered understanding' },
              { icon: '🕸️', text: 'Knowledge graph' },
              { icon: '⏱️', text: 'Auto timeline' },
              { icon: '🔍', text: 'Semantic search' },
            ].map((feat) => (
              <div
                key={feat.text}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10"
              >
                <span>{feat.icon}</span>
                <span className="text-xs text-violet-200">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-violet-300">
          Free to get started. No credit card required.
        </div>
      </div>

      {/* Right — Signup form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">MemoryVerse</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Create your account</h2>
            <p className="text-muted-foreground text-sm">Start building your knowledge universe</p>
          </div>

          {successMessage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center space-y-2"
            >
              <div className="text-2xl">✉️</div>
              <p className="font-medium">{successMessage}</p>
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:underline text-xs"
              >
                Go to login
              </button>
            </motion.div>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full gap-3"
                onClick={handleGoogleLogin}
                isLoading={googleLoading}
                id="btn-google-signup"
              >
                {!googleLoading && <Chrome className="w-4 h-4" />}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or sign up with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                    {serverError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Ameya Joshi"
                      className="pl-10"
                      {...register('fullName')}
                      aria-invalid={!!errors.fullName}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...register('email')}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className="pl-10 pr-10"
                      {...register('password')}
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...register('confirmPassword')}
                      aria-invalid={!!errors.confirmPassword}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSubmitting}
                  id="btn-email-signup"
                >
                  Create account
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-primary hover:underline">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
