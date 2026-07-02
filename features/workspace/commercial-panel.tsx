'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { CURRENCIES, formatCurrency, type CurrencyCode } from '@/commercial-engine'
import { cn } from '@/lib/utils'

interface Props { className?: string }

/**
 * CommercialPanel — the right-column input surface.
 *
 * All changes flow through `updateCommercial(patch)` which is picked up by
 * WorkspaceProvider, which re-derives commercial/BOQ/proposal. Sub-second
 * update guarantee is upheld because engines are sub-millisecond.
 */
export function CommercialPanel({ className }: Props) {
  const { commercialInput, updateCommercial, commercial } = useWorkspace()

  return (
    <div className={cn('space-y-5', className)}>
      <section className="space-y-3">
        <SectionHeader title="Currency & Tax" />
        <Row2>
          <Field label="Currency">
            <Select value={commercialInput.currency} onValueChange={(v) => updateCommercial({ currency: v as CurrencyCode })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(CURRENCIES).map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tax label">
            <Input value={commercialInput.tax?.label ?? 'GST'} onChange={(e) => updateCommercial({ tax: { label: e.target.value, ratePercent: commercialInput.tax?.ratePercent ?? 18 } })} />
          </Field>
        </Row2>
        <Row2>
          <NumberField label="Tax rate (%)" value={commercialInput.tax?.ratePercent} onChange={(v) => updateCommercial({ tax: { label: commercialInput.tax?.label ?? 'GST', ratePercent: v ?? 0 } })} step="0.1" />
          <NumberField label="Margin (%)" value={commercialInput.marginPercent} onChange={(v) => updateCommercial({ marginPercent: v })} step="0.5" />
        </Row2>
        <NumberField label="Discount (%)" value={commercialInput.discountPercent} onChange={(v) => updateCommercial({ discountPercent: v })} step="0.5" />
      </section>

      <Separator />

      <section className="space-y-3">
        <SectionHeader title="Material unit costs" hint="Quantities come from the engineering engine." />
        <NumberField label="LED module (per m²)"    value={commercialInput.ledCostPerSqM}            onChange={(v) => updateCommercial({ ledCostPerSqM: v })} />
        <NumberField label="Cabinet (per unit)"      value={commercialInput.cabinetCostPerUnit}       onChange={(v) => updateCommercial({ cabinetCostPerUnit: v })} />
        <Row2>
          <NumberField label="Controller (each)"     value={commercialInput.controllerCost}           onChange={(v) => updateCommercial({ controllerCost: v })} />
          <NumberField label="Controller qty"        value={commercialInput.controllerQuantity}       onChange={(v) => updateCommercial({ controllerQuantity: v })} step="1" />
        </Row2>
        <Row2>
          <NumberField label="Receiving card (each)" value={commercialInput.receivingCardCostPerUnit} onChange={(v) => updateCommercial({ receivingCardCostPerUnit: v })} />
          <NumberField label="Power supply (each)"   value={commercialInput.powerSupplyCostPerUnit}   onChange={(v) => updateCommercial({ powerSupplyCostPerUnit: v })} />
        </Row2>
        <Row2>
          <NumberField label="Cables (lot)"          value={commercialInput.cablesCost}               onChange={(v) => updateCommercial({ cablesCost: v })} />
          <NumberField label="Accessories (lot)"     value={commercialInput.accessoriesCost}          onChange={(v) => updateCommercial({ accessoriesCost: v })} />
        </Row2>
      </section>

      <Separator />

      <section className="space-y-3">
        <SectionHeader title="Infrastructure & services" />
        <Row2>
          <NumberField label="Steel structure"       value={commercialInput.steelStructureCost}       onChange={(v) => updateCommercial({ steelStructureCost: v })} />
          <NumberField label="Transportation"        value={commercialInput.transportationCost}       onChange={(v) => updateCommercial({ transportationCost: v })} />
        </Row2>
        <Row2>
          <NumberField label="Installation"          value={commercialInput.installationCost}         onChange={(v) => updateCommercial({ installationCost: v })} />
          <NumberField label="Commissioning"         value={commercialInput.commissioningCost}        onChange={(v) => updateCommercial({ commissioningCost: v })} />
        </Row2>
      </section>

      <Separator />

      <section className="space-y-3">
        <SectionHeader title="Post-sale" hint="Warranty and AMC are priced as a % of material cost." />
        <Row2>
          <NumberField label="Warranty years"        value={commercialInput.warrantyYears}            onChange={(v) => updateCommercial({ warrantyYears: v })} step="1" />
          <NumberField label="Warranty (% material)" value={commercialInput.warrantyCostPercent}      onChange={(v) => updateCommercial({ warrantyCostPercent: v })} step="0.5" />
        </Row2>
        <Row2>
          <NumberField label="AMC years"             value={commercialInput.amcYears}                 onChange={(v) => updateCommercial({ amcYears: v })} step="1" />
          <NumberField label="AMC (% / year)"        value={commercialInput.amcCostPercentPerYear}    onChange={(v) => updateCommercial({ amcCostPercentPerYear: v })} step="0.5" />
        </Row2>
      </section>

      {commercial.warnings.length > 0 && (
        <div className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-800 dark:text-amber-200">
          {commercial.warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
        </div>
      )}

      <div className="rounded-md border border-border bg-muted/30 p-2 text-[11px] font-mono text-muted-foreground">
        Sample line total (LED per m²): {formatCurrency((commercialInput.ledCostPerSqM ?? 0), commercialInput.currency)}
      </div>
    </div>
  )
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </label>
  )
}

function NumberField({
  label, value, onChange, step = '1',
}: { label: string; value?: number; onChange: (v?: number) => void; step?: string }) {
  return (
    <Field label={label}>
      <Input
        type="number"
        value={value ?? ''}
        step={step}
        onChange={(e) => {
          const v = e.target.value === '' ? undefined : Number(e.target.value)
          onChange(Number.isFinite(v as number) ? (v as number) : undefined)
        }}
        className="h-9"
      />
    </Field>
  )
}
