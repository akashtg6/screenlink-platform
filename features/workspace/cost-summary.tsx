'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { formatCurrency } from '@/commercial-engine'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/** Cost summary card — sits at the top of the right column. */
export function CostSummary() {
  const { commercial } = useWorkspace()
  const c = commercial
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Selling price</div>
          <div className="mt-0.5 font-mono text-2xl font-bold text-foreground">{formatCurrency(c.sellingPrice, c.currency)}</div>
          <div className="text-[11px] text-muted-foreground">incl. {c.tax.label} ({c.tax.ratePercent}%)</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Profit</div>
          <div className={cn('mt-0.5 font-mono text-lg font-bold', c.profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
            {formatCurrency(c.profit, c.currency)}
          </div>
          <div className="text-[11px] text-muted-foreground">{c.effectiveMarginPercent.toFixed(1)}% net margin</div>
        </div>
      </div>
      <Separator />
      <div className="space-y-1 text-xs">
        <Row label="Total cost"             value={formatCurrency(c.totalCost, c.currency)} />
        <Row label={`Margin (${c.marginPercent}%)`} value={formatCurrency(c.grossMarginAmount, c.currency)} />
        <Row label={`Discount (${c.discountPercent}%)`} value={`− ${formatCurrency(c.discountAmount, c.currency)}`} tone={c.discountAmount ? 'muted' : undefined} />
        <Row label="Price before tax"       value={formatCurrency(c.priceBeforeTax, c.currency)} />
        <Row label={`${c.tax.label} (${c.tax.ratePercent}%)`} value={formatCurrency(c.taxAmount, c.currency)} />
        <Row label="Selling price"          value={formatCurrency(c.sellingPrice, c.currency)} bold />
      </div>
      <Separator />
      <div className="space-y-1.5">
        {c.breakdown.map((b) => (
          <div key={b.category} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{b.category}</span>
              <span className="font-mono">{formatCurrency(b.amount, c.currency)} · {b.percentOfTotal.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(100, b.percentOfTotal)} className="h-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: 'muted' }) {
  return (
    <div className={cn('flex items-center justify-between',
      bold && 'text-sm font-semibold text-foreground', tone === 'muted' && 'text-muted-foreground')}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
