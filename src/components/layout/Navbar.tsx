import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, Monitor, LogOut, User, Settings, Command, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { useTheme } from '@/providers/ThemeProvider'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface NavbarProps {
  onMenuToggle: () => void
  title?: string
  breadcrumb?: { label: string; href?: string }[]
  onCommandPaletteOpen?: () => void
}

// ─────────────────────────────────────────────────────────────
// Notification item (static for now, will be dynamic)
// ─────────────────────────────────────────────────────────────

const DEMO_NOTIFICATIONS = [
  {
    id: '1',
    type: 'insight',
    title: 'New AI insight generated',
    description: 'MemoryVerse found 3 new connections in your knowledge graph.',
    time: '2m ago',
    unread: true,
  },
  {
    id: '2',
    type: 'processing',
    title: 'Memory processed',
    description: 'Your latest upload has been fully indexed.',
    time: '1h ago',
    unread: true,
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'Resume update suggested',
    description: 'Your recent project should be added to your resume.',
    time: '3h ago',
    unread: false,
  },
]

// ─────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────

export function Navbar({ onMenuToggle, title, breadcrumb, onCommandPaletteOpen }: NavbarProps) {
  const { profile, user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS)

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const avatarFallback = displayName.charAt(0).toUpperCase()
  const unreadCount = notifications.filter((n) => n.unread).length

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  const handleSignOut = async () => {
    setShowUserMenu(false)
    await signOut()
    navigate('/login')
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb / Title */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {crumb.href ? (
                  <button
                    onClick={() => navigate(crumb.href!)}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={cn(
                    'truncate',
                    i === breadcrumb.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : title ? (
          <h1 className="text-base font-semibold truncate">{title}</h1>
        ) : null}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Command palette trigger */}
        <button
          onClick={onCommandPaletteOpen}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded-md border border-border hover:bg-accent transition-colors"
          aria-label="Open command palette"
          id="open-command-palette"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); setShowThemeMenu(false) }}
            className="p-2 rounded-md hover:bg-accent transition-colors relative"
            aria-label="Notifications"
            id="notifications-btn"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} aria-hidden />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-80 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Notifications</p>
                      {unreadCount > 0 && (
                        <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-xs text-muted-foreground">All caught up!</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors',
                            notif.unread ? 'bg-primary/3' : ''
                          )}
                        >
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                            notif.unread ? 'bg-primary' : 'bg-muted'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.description}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time}</p>
                          </div>
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Theme switcher */}
        <div className="relative">
          <button
            onClick={() => { setShowThemeMenu(!showThemeMenu); setShowNotifications(false); setShowUserMenu(false) }}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Sun className="w-4.5 h-4.5" />
            ) : theme === 'dark' ? (
              <Moon className="w-4.5 h-4.5" />
            ) : (
              <Monitor className="w-4.5 h-4.5" />
            )}
          </button>

          <AnimatePresence>
            {showThemeMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
              >
                {themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value); setShowThemeMenu(false) }}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-accent transition-colors',
                      theme === opt.value && 'text-primary bg-primary/5'
                    )}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); setShowThemeMenu(false) }}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="User menu"
          >
            <Avatar
              src={profile?.avatar_url}
              fallback={avatarFallback}
              size="sm"
            />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-52 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
                >
                  {/* User info header */}
                  <div className="px-3 py-3 border-b border-border">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/profile') }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      Profile
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/settings') }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                      Settings
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md hover:bg-accent text-destructive transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
