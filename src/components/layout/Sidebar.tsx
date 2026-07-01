import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/constants/app'
import { useAuth } from '@/providers/AuthProvider'
import { Avatar, Badge } from '@/components/ui'

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const { profile, user } = useAuth()

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const avatarFallback = displayName.charAt(0).toUpperCase()

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight">MemoryVerse</span>
          <span className="text-[10px] text-muted-foreground">AI Memory OS</span>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              cn('sidebar-item group', isActive && 'active')
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {'badge' in item && item.badge !== undefined && (
                  <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                    {String(item.badge)}
                  </Badge>
                )}
                {isActive && (
                  <ChevronRight className="w-3 h-3 text-primary opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              cn('sidebar-item', isActive && 'active')
            }
          >
            <item.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* User profile */}
        <NavLink
          to="/profile"
          onClick={isMobile ? onClose : undefined}
          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent transition-all mt-2 group"
        >
          <Avatar
            src={profile?.avatar_url}
            fallback={avatarFallback}
            size="sm"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium truncate">{displayName}</span>
            <span className="text-[10px] text-muted-foreground truncate">
              {user?.email ?? ''}
            </span>
          </div>
        </NavLink>
      </div>
    </div>
  )

  // Mobile: overlay drawer
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-full w-72"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  // Desktop: always visible
  return (
    <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0">
      {sidebarContent}
    </aside>
  )
}
