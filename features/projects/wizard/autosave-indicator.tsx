'use client'

import { Check, CloudUpload, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AutosaveStatus } from '@/hooks/use-autosave'

export function AutosaveIndicator({ status, lastSavedAt, className }: { status: AutosaveStatus; lastSavedAt: number | null; className?: string }) {
  const label = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Save failed' : lastSavedAt ? 'Saved' : 'Not saved yet'
  const Icon = status === 'error' ? AlertTriangle : status === 'saving' ? CloudUpload : Check
  const tone = status === 'error' ? 'text-destructive' : status === 'saving' ? 'text-muted-foreground' : status === 'saved' ? 'text-success' : 'text-muted-foreground'
  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs', tone, className)}>
      <Icon className={cn('h-3.5 w-3.5', status === 'saving' && 'animate-pulse')} />
      <span>{label}</span>
      {lastSavedAt && status !== 'saving' && (
        <span className="text-muted-foreground">· {relative(lastSavedAt)}</span>
      )}
    </div>
  )
}

function relative(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60); return `${h}h ago`
}
