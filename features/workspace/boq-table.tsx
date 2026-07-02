'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { formatCurrency } from '@/commercial-engine'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

export function BOQTable({ className }: { className?: string }) {
  const { boq } = useWorkspace()
  return (
    <div className={cn('space-y-4', className)}>
      {boq.sections.map((sec) => (
        <section key={sec.id} className="rounded-md border border-border bg-card">
          <header className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{sec.title}</h3>
              {sec.description && <p className="text-[11px] text-muted-foreground">{sec.description}</p>}
            </div>
            <span className="font-mono text-xs font-semibold text-foreground">{formatCurrency(sec.subtotal, boq.currency)}</span>
          </header>
          {sec.items.length === 0 ? (
            <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">No items in this section.</div>
          ) : (
            <div className="divide-y divide-border">
              {sec.items.map((it, idx) => (
                <div key={it.id} className="grid grid-cols-[24px_1fr_60px_80px_100px_110px] items-center gap-2 px-3 py-2 text-xs">
                  <span className="font-mono text-muted-foreground">{idx + 1}</span>
                  <span className="truncate">{it.description}</span>
                  <span className="text-right font-mono text-muted-foreground">{it.quantity}</span>
                  <span className="text-right font-mono text-muted-foreground">{it.unit}</span>
                  <span className="text-right font-mono">{formatCurrency(it.unitPrice, boq.currency)}</span>
                  <span className="text-right font-mono font-semibold">{formatCurrency(it.amount, boq.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      <Separator />

      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <Row label="Grand subtotal" value={formatCurrency(boq.grandSubtotal, boq.currency)} />
        <Row label="Discount"       value={`− ${formatCurrency(boq.discountAmount, boq.currency)}`} muted />
        <Row label="Price before tax" value={formatCurrency(boq.priceBeforeTax, boq.currency)} />
        <Row label={`${boq.taxLabel} (${boq.taxRatePercent}%)`} value={formatCurrency(boq.taxAmount, boq.currency)} />
        <Row label="Grand total" value={formatCurrency(boq.grandTotal, boq.currency)} bold />
      </div>

      <div className="text-[10px] text-muted-foreground">
        BOQ Engine {boq.meta.engineVersion} · Commercial {boq.meta.sourceCommercialVersion}{boq.meta.sourceEngineeringVersion ? ` · Engineering ${boq.meta.sourceEngineeringVersion}` : ''}
      </div>
    </div>
  )
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between py-0.5', bold && 'font-semibold text-foreground text-base', muted && 'text-muted-foreground')}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
