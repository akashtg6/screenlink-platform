'use client'

import { useState } from 'react'
import { Search, PlusCircle, Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Breadcrumbs } from './breadcrumbs'
import { NotificationsPopover } from './notifications-popover'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { UserMenu } from './user-menu'
import { Sidebar } from './sidebar'
import Link from 'next/link'

export function TopNav() {
  const [q, setQ] = useState('')

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-r border-sidebar-border bg-sidebar p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="hidden md:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, customers, BOQs…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-[320px] pl-8 text-sm"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <Button asChild size="sm" className="hidden gap-1.5 md:inline-flex">
          <Link href="/projects/new">
            <PlusCircle className="h-3.5 w-3.5" /> New Project
          </Link>
        </Button>

        <NotificationsPopover />
        <ThemeToggle />
        <UserMenu />

        {/* Always-visible logout escape hatch — direct server route, cannot fail. */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5"
          title="Sign out"
        >
          <a href="/logout" data-testid="topnav-logout-link">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Log out</span>
          </a>
        </Button>
      </div>
    </header>
  )
}
