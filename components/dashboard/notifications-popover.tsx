'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelative } from '@/utils/format'

const NOTIFS = [
  { id: '1', type: 'info', title: 'BOQ ready for review', body: 'SL-2025-001 has a new revision ready for approval.', createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(), read: false },
  { id: '2', type: 'success', title: 'Project approved', body: 'SL-2025-003 was approved by SK Sports Ventures.', createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(), read: false },
  { id: '3', type: 'warning', title: 'Cabinet stock notice', body: 'Supplier flagged reduced stock on P1.9 fine-pitch cabinets.', createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(), read: true },
]

export function NotificationsPopover() {
  const unread = NOTIFS.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {unread}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">Mark all as read</Button>
        </div>
        <ScrollArea className="h-[320px]">
          <ul className="divide-y divide-border">
            {NOTIFS.map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-3 hover:bg-muted/40">
                <span
                  className={
                    'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ' +
                    (n.type === 'success'
                      ? 'bg-success'
                      : n.type === 'warning'
                      ? 'bg-warning'
                      : n.type === 'error'
                      ? 'bg-destructive'
                      : 'bg-accent')
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">{formatRelative(n.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full justify-center text-xs">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
