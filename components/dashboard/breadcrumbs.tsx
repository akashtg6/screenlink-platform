'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  settings: 'Settings',
  new: 'New Project',
  configurator: 'Configurator',
  proposals: 'Proposals',
  team: 'Team',
  help: 'Help',
}

function humanize(seg: string) {
  if (LABELS[seg]) return LABELS[seg]
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() || ''
  const parts = pathname.split('/').filter(Boolean)

  const items = parts.map((seg, idx) => {
    const href = '/' + parts.slice(0, idx + 1).join('/')
    return { label: humanize(seg), href }
  })

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      <Link href="/dashboard" className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, idx) => (
        <div key={item.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          {idx === items.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
