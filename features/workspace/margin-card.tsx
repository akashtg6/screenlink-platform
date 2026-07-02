'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { formatCurrency } from '@/commercial-engine'
import { cn } from '@/lib/utils'

/** Compact margin display card. */
export function MarginCard({ className }: { className?: string }) {
  const { commercial } = useWorkspace()
  const c = commercial
  const healthy = c.effectiveMarginPercent >= 20
  return (
    <div className={cn('rounded-md border border-border bg-card p-3 text-xs', className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Effective margin</span>
        <span className={cn('font-mono text-sm font-bold', healthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
          {c.effectiveMarginPercent.toFixed(1)}%
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-muted-foreground">Markup</span>
        <span className="font-mono">{c.effectiveMarkupPercent.toFixed(1)}%</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-muted-foreground">Profit</span>
        <span className={cn('font-mono font-semibold', c.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
          {formatCurrency(c.profit, c.currency)}
        </span>
      </div>
    </div>
  )
}
