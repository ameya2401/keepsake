import { motion } from 'framer-motion'
import { Settings, User, Shield, HardDrive, Palette, Bell, Link, Cpu } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui'
import { useTheme } from '@/providers/ThemeProvider'
import { cn } from '@/lib/utils'

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function SettingsCard({ icon: Icon, label, description, action }: {
  icon: React.ElementType
  label: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-muted">
          <Icon className="w-4.5 h-4.5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <AppShell title="Settings" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}>
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm">Manage your preferences and account</p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

          <SettingsSection title="Account">
            <SettingsCard
              icon={User}
              label="Profile"
              description="Manage your name, bio, and avatar"
              action={
                <a href="/profile" className="text-xs text-primary hover:underline">Edit</a>
              }
            />
            <SettingsCard
              icon={Shield}
              label="Security"
              description="Password, two-factor authentication"
              action={
                <span className="text-xs text-muted-foreground">Coming soon</span>
              }
            />
          </SettingsSection>

          <SettingsSection title="Appearance">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2.5 rounded-xl bg-muted">
                    <Palette className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Theme</p>
                    <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs font-medium border transition-all capitalize',
                        theme === t
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-accent'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </SettingsSection>

          <SettingsSection title="Storage">
            <SettingsCard
              icon={HardDrive}
              label="Storage Usage"
              description="0 MB of 1 GB used"
              action={
                <div className="text-right">
                  <span className="text-xs font-medium">0%</span>
                </div>
              }
            />
          </SettingsSection>

          <SettingsSection title="Notifications">
            <SettingsCard
              icon={Bell}
              label="Notifications"
              description="Processing complete, new insights, recommendations"
              action={
                <span className="text-xs text-muted-foreground">Configure</span>
              }
            />
          </SettingsSection>

          <SettingsSection title="Integrations">
            <SettingsCard
              icon={Link}
              label="Connected Accounts"
              description="Google, GitHub, LinkedIn"
              action={
                <span className="text-xs text-muted-foreground">Manage</span>
              }
            />
          </SettingsSection>

          <SettingsSection title="AI Settings">
            <SettingsCard
              icon={Cpu}
              label="AI Configuration"
              description="Model preferences, processing options (Phase 2+)"
              action={
                <span className="text-xs text-muted-foreground">Coming in Phase 2</span>
              }
            />
          </SettingsSection>

        </motion.div>
      </div>
    </AppShell>
  )
}
