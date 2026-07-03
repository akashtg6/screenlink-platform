'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon, Settings as SettingsIcon, LifeBuoy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { initials } from '@/utils/format'

export function UserMenu() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  // While the AuthProvider is still resolving, don't render anything yet
  // (the DashboardLayout skeleton owns this state).
  if (loading) return null

  const handleSignOut = async () => {
    try {
      await signOut()
    } finally {
      // Always navigate away even if signOut errors — the cookies get cleared
      // client-side and middleware will guard the next request.
      router.push('/login')
      router.refresh()
    }
  }

  // Defensive fallback: if the client couldn't hydrate the profile
  // (e.g. RLS blocked the query, network hiccup) but there IS an authenticated
  // session on the server, render a MINIMAL menu so the user can still sign out.
  // This eliminates the "trapped without a sign-out button" failure mode.
  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Account menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Signed in</span>
              <span className="text-xs font-normal text-muted-foreground">Profile still loading…</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-full border border-border p-0.5 pr-3 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-semibold">
              {initials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-xs font-medium text-foreground md:inline">{user.fullName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user.fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-accent">
              {user.roleSlug}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <UserIcon className="mr-2 h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <SettingsIcon className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LifeBuoy className="mr-2 h-4 w-4" /> Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
