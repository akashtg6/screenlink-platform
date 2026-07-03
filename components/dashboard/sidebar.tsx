'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Calculator,
  FileText,
  Users,
  Settings,
  LifeBuoy,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/utils/format'

const NAV_MAIN = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Configurator', href: '/configurator', icon: Calculator, soon: true },
  { label: 'Proposals', href: '/proposals', icon: FileText, soon: true },
  { label: 'Team', href: '/team', icon: Users, soon: true },
]

const NAV_FOOTER = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help & Support', href: '/help', icon: LifeBuoy },
]

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('[sidebar] signOut failed, falling back to /logout route', err)
    } finally {
      onNavigate?.()
      // Always navigate to /login even if client-side signOut errored — the
      // server /logout route is idempotent and the middleware will guard.
      router.push('/login')
      router.refresh()
    }
  }

  const renderItem = (item: (typeof NAV_MAIN)[number]) => {
    const active = pathname === item.href || pathname?.startsWith(item.href + '/')
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.soon ? '#' : item.href}
        onClick={(e) => {
          if (item.soon) e.preventDefault()
          onNavigate?.()
        }}
        className={cn(
          'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
          item.soon && 'cursor-not-allowed opacity-70 hover:bg-transparent hover:text-sidebar-foreground/70',
        )}
      >
        {active && <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-sidebar-primary" />}
        <Icon className={cn('h-4 w-4', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60')} />
        <span className="flex-1">{item.label}</span>
        {item.soon && (
          <Badge variant="outline" className="border-sidebar-border bg-transparent px-1.5 py-0 text-[10px] text-sidebar-foreground/60">
            Soon
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo variant="light" size="md" />
      </div>

      <div className="px-3 py-4">
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Workspace
        </div>
        <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
            SE
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold">ScreenLink Engineering</span>
            <span className="truncate text-[11px] text-sidebar-foreground/60">Enterprise workspace</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Engineering
        </div>
        {NAV_MAIN.map(renderItem)}
      </nav>

      <div className="mx-3 mb-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <Sparkles className="h-4 w-4 text-sidebar-primary" />
          <span className="text-xs font-semibold">AI Proposal Assist</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/60">
          Automated BOQ and specification drafting is coming soon to your workspace.
        </p>
      </div>

      <div className="space-y-0.5 border-t border-sidebar-border px-3 py-3">
        {NAV_FOOTER.map(renderItem)}

        {/* ---- User identity + Sign Out ------------------------------------ */}
        {/* Always rendered. If profile hasn't hydrated yet, show a minimal
            fallback so the Sign Out action is NEVER hidden from the user. */}
        <div className="mt-3 flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl || undefined} alt={user?.fullName || 'User'} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-[11px] font-semibold">
              {user ? initials(user.fullName) : '·'}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-xs font-semibold text-sidebar-foreground">
              {user?.fullName || 'Signed in'}
            </span>
            <span className="truncate text-[11px] text-sidebar-foreground/60">
              {user?.email || 'Loading profile…'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          data-testid="sidebar-signout"
          className="mt-2 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <LogOut className="h-4 w-4" />
          <span className="flex-1 text-left">Sign out</span>
        </button>

        {/* Failsafe: direct server-route link. Works even if JS is broken. */}
        <a
          href="/logout"
          onClick={() => onNavigate?.()}
          className="mt-1 block px-2.5 text-[10px] text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
        >
          Trouble signing out? Use this link.
        </a>
      </div>
    </aside>
  )
}
