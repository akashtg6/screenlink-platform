'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ExportPanel — wired up in Phase 3 (PDF Engine, Excel Engine). For Release
 * 0.5's Phase 2 we surface the buttons and disable them so the UI is
 * production-quality on desktop first.
 */
export function ExportPanel({ className, onExportPdf, onExportExcel, busyPdf, busyExcel }: {
  className?: string
  onExportPdf?: () => void
  onExportExcel?: () => void
  busyPdf?: boolean
  busyExcel?: boolean
}) {
  return (
    <div className={cn('space-y-2 rounded-md border border-border bg-card p-3', className)}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Download className="h-3.5 w-3.5" /> Export
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="h-9 justify-start gap-2" onClick={onExportPdf} disabled={!onExportPdf || busyPdf}>
          <FileText className="h-4 w-4" />
          {busyPdf ? 'Generating…' : 'Proposal PDF'}
        </Button>
        <Button variant="outline" size="sm" className="h-9 justify-start gap-2" onClick={onExportExcel} disabled={!onExportExcel || busyExcel}>
          <FileSpreadsheet className="h-4 w-4" />
          {busyExcel ? 'Generating…' : 'Excel workbook'}
        </Button>
      </div>
    </div>
  )
}
