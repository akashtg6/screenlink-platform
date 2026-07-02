'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { ExportPanel } from './export-panel'
import { toast } from 'sonner'

/**
 * Wires the ExportPanel to the PDF + Excel engines via dynamic imports so
 * that the heavy PDF/Excel bundles are code-split — first workspace paint
 * remains fast.
 */
export function ExportPanelConnected({ className }: { className?: string }) {
  const { proposal, engineering, commercial, boq } = useWorkspace()
  const [busyPdf, setBusyPdf] = React.useState(false)
  const [busyExcel, setBusyExcel] = React.useState(false)

  const onPdf = async () => {
    setBusyPdf(true)
    try {
      const [{ renderProposalPdfBlob }, { saveAs }] = await Promise.all([
        import('@/pdf-engine'),
        import('file-saver'),
      ])
      const blob = await renderProposalPdfBlob(proposal)
      saveAs(blob, `${sanitize(proposal.project.projectName)}-proposal.pdf`)
      toast.success('Proposal PDF downloaded')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      toast.error('Failed to generate PDF')
    } finally { setBusyPdf(false) }
  }

  const onExcel = async () => {
    setBusyExcel(true)
    try {
      const [{ renderWorkbookBlob }, { saveAs }] = await Promise.all([
        import('@/excel-engine'),
        import('file-saver'),
      ])
      const blob = await renderWorkbookBlob({ engineering: engineering ?? undefined, commercial, boq, proposal })
      saveAs(blob, `${sanitize(proposal.project.projectName)}-workbook.xlsx`)
      toast.success('Excel workbook downloaded')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      toast.error('Failed to generate Excel workbook')
    } finally { setBusyExcel(false) }
  }

  return (
    <ExportPanel className={className}
      onExportPdf={onPdf} onExportExcel={onExcel}
      busyPdf={busyPdf} busyExcel={busyExcel} />
  )
}

function sanitize(name: string): string {
  return (name || 'proposal').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
