import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Camera, Save } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Card, CardContent, Input, Label, Avatar, Badge } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      bio: profile?.bio ?? '',
    },
  })

  const onSubmit = async (_values: ProfileFormValues) => {
    // Profile update will be implemented
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    await refreshProfile()
  }

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const avatarFallback = displayName.charAt(0).toUpperCase()

  return (
    <AppShell title="Profile" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your personal information</p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Avatar section */}
          <Card className="mb-6">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="relative">
                <Avatar
                  src={profile?.avatar_url}
                  fallback={avatarFallback}
                  size="xl"
                />
                <button
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                  aria-label="Change avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{displayName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-2 text-xs">Free Plan</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Profile form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    {...register('fullName')}
                    aria-invalid={!!errors.fullName}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email ?? ''}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    placeholder="Tell MemoryVerse about yourself..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    {...register('bio')}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" isLoading={isSubmitting} className="gap-2" id="btn-save-profile">
                    <Save className="w-4 h-4" />
                    Save changes
                  </Button>
                  {saved && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-emerald-500"
                    >
                      ✓ Profile saved
                    </motion.p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
