import ExcelJS from 'exceljs'
import type { EngineeringResult } from '@/engineering-engine'
import type { CommercialResult, LineItem } from '@/commercial-engine'
import type { BOQDocument } from '@/boq-engine'
import type { ProposalDocument } from '@/proposal-engine'
import { formatCurrency } from '@/commercial-engine'

export const EXCEL_ENGINE_VERSION = '0.5.0'

export interface ExcelInputs {
  engineering?: EngineeringResult
  commercial: CommercialResult
  boq: BOQDocument
  proposal: ProposalDocument
}

/**
 * Excel Engine — renders an engineering + commercial + BOQ workbook.
 * Sheets:
 *   1. Project Summary
 *   2. Engineering
 *   3. Commercial
 *   4. BOQ
 *   5. Calculations (raw line items — formulas exposed)
 *
 * All monetary columns use Excel currency formatting so the workbook is
 * editable in Excel/Sheets without downstream re-formatting.
 */
export async function renderWorkbookBlob(inputs: ExcelInputs): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  wb.creator = inputs.proposal.branding.companyName
  wb.created = new Date()
  wb.title = inputs.proposal.title

  const currencyFmt = currencyCodeToFmt(inputs.commercial.currency)

  buildProjectSummarySheet(wb, inputs)
  buildEngineeringSheet(wb, inputs)
  buildCommercialSheet(wb, inputs, currencyFmt)
  buildBOQSheet(wb, inputs, currencyFmt)
  buildCalculationsSheet(wb, inputs, currencyFmt)

  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function currencyCodeToFmt(code: string): string {
  // A conservative, locale-friendly Excel currency format.
  return `"${code} "#,##0.00;-"${code} "#,##0.00`
}

function buildProjectSummarySheet(wb: ExcelJS.Workbook, inp: ExcelInputs) {
  const ws = wb.addWorksheet('Project Summary', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = [{ width: 32 }, { width: 60 }]
  headerRow(ws, ['Field', 'Value'])

  const p = inp.proposal.project
  const c = inp.proposal.customer
  const b = inp.proposal.branding
  const rows: Array<[string, string]> = [
    ['Company',            b.companyName],
    ['Project name',       p.projectName],
    ['Project code',       p.projectCode || ''],
    ['Application',        p.application || ''],
    ['Proposal number',    p.proposalNumber || ''],
    ['Revision',           p.revision || ''],
    ['Proposal date',      shortIso(p.proposalDate)],
    ['Valid until',        shortIso(p.validUntil)],
    ['Customer',           c.name],
    ['Organisation',       c.organization || ''],
    ['Contact',            c.contactPerson || ''],
    ['Email',              c.email || ''],
    ['Phone',              c.phone || ''],
    ['Address',            c.address || ''],
  ]
  rows.forEach((r) => ws.addRow(r))
  autoStyle(ws)
}

function buildEngineeringSheet(wb: ExcelJS.Workbook, inp: ExcelInputs) {
  const ws = wb.addWorksheet('Engineering')
  ws.columns = [{ width: 32 }, { width: 24 }]
  headerRow(ws, ['Metric', 'Value'])
  const e = inp.engineering
  if (!e) { ws.addRow(['Status', 'Engineering data not available']); return }
  const rows: Array<[string, string | number]> = [
    ['Diagonal (inch)',      e.geometry.diagonalInch],
    ['Width (mm)',           e.geometry.widthMm],
    ['Height (mm)',          e.geometry.heightMm],
    ['Area (m²)',            e.geometry.areaSqM],
    ['Aspect ratio',         e.aspectRatio.humanReadable],
    ['Resolution',           `${e.resolution.horizontalPixels} × ${e.resolution.verticalPixels} (${e.resolution.shortName})`],
    ['Pixel density (PPI)',  e.pixelDensity.pixelDensityPPI],
    ['Total LEDs',           e.pixelDensity.totalLEDs],
  ]
  if (e.cabinet) rows.push(
    ['Cabinet grid',                `${e.cabinet.horizontalCount} × ${e.cabinet.verticalCount}`],
    ['Total cabinets',              e.cabinet.totalCabinets],
    ['Cabinet efficiency (%)',      e.cabinet.efficiencyPercent],
  )
  if (e.power) rows.push(
    ['Power — max (kW)',            +(e.power.maxWatts / 1000).toFixed(2)],
    ['Power — typical (kW)',        +(e.power.typicalWatts / 1000).toFixed(2)],
    ['Power density (W/m²)',        e.power.wattsPerSqMMax],
    ['Annual energy (kWh)',         e.power.annualKWh],
  )
  if (e.weight) rows.push(['Total weight (kg)', e.weight.totalDisplayWeightKg])
  if (e.viewing) rows.push(
    ['Viewing min (m)',             e.viewing.minDistanceM],
    ['Viewing recommended (m)',     e.viewing.recommendedDistanceM],
    ['Viewing max (m)',             e.viewing.maxDistanceM],
    ['Viewing fitness',             e.viewing.fitness],
  )
  if (e.score) rows.push(
    ['Engineering score',           e.score.overall],
    ['Grade',                       e.score.grade],
  )
  rows.forEach((r) => ws.addRow(r))
  autoStyle(ws)
}

function buildCommercialSheet(wb: ExcelJS.Workbook, inp: ExcelInputs, currencyFmt: string) {
  const ws = wb.addWorksheet('Commercial')
  ws.columns = [{ width: 34 }, { width: 20 }]
  headerRow(ws, ['Metric', 'Value'])
  const c = inp.commercial
  const rows: Array<[string, number | string]> = [
    ['Currency',              c.currency],
    ['Total cost',            c.totalCost],
    ['Margin (%)',            c.marginPercent],
    ['Gross margin',          c.grossMarginAmount],
    ['Discount (%)',          c.discountPercent],
    ['Discount amount',       c.discountAmount],
    ['Net margin',            c.netMarginAmount],
    ['Price before discount', c.priceBeforeDiscount],
    ['Price before tax',      c.priceBeforeTax],
    [`${c.tax.label} (${c.tax.ratePercent}%)`, c.taxAmount],
    ['Selling price',         c.sellingPrice],
    ['Profit',                c.profit],
    ['Effective margin (%)',  c.effectiveMarginPercent],
    ['Effective markup (%)',  c.effectiveMarkupPercent],
  ]
  rows.forEach((r) => {
    const added = ws.addRow(r)
    if (typeof r[1] === 'number' && !/%/.test(String(r[0]))) added.getCell(2).numFmt = currencyFmt
  })
  autoStyle(ws)

  // Breakdown table
  ws.addRow([])
  ws.addRow(['Category', 'Amount', 'Share (%)']).font = { bold: true }
  for (const b of c.breakdown) {
    const r = ws.addRow([b.category, b.amount, b.percentOfTotal])
    r.getCell(2).numFmt = currencyFmt
    r.getCell(3).numFmt = '0.00"%"'
  }
}

function buildBOQSheet(wb: ExcelJS.Workbook, inp: ExcelInputs, currencyFmt: string) {
  const ws = wb.addWorksheet('BOQ', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = [{ width: 6 }, { width: 46 }, { width: 8 }, { width: 8 }, { width: 16 }, { width: 18 }]
  headerRow(ws, ['#', 'Description', 'Qty', 'Unit', 'Unit price', 'Amount'])

  let i = 1
  for (const sec of inp.boq.sections) {
    if (sec.items.length === 0) continue
    const secRow = ws.addRow([null, sec.title.toUpperCase(), null, null, null, null])
    secRow.font = { bold: true }
    secRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    ws.mergeCells(secRow.number, 2, secRow.number, 6)

    for (const it of sec.items) {
      const r = ws.addRow([i++, it.description, it.quantity, it.unit, it.unitPrice, it.amount])
      r.getCell(5).numFmt = currencyFmt
      r.getCell(6).numFmt = currencyFmt
    }

    const st = ws.addRow([null, `${sec.title} subtotal`, null, null, null, sec.subtotal])
    st.font = { italic: true }
    st.getCell(6).numFmt = currencyFmt
  }

  ws.addRow([])
  const totals: Array<[string, number]> = [
    ['Grand subtotal',   inp.boq.grandSubtotal],
    ['Discount',         -inp.boq.discountAmount],
    ['Price before tax', inp.boq.priceBeforeTax],
    [`${inp.boq.taxLabel} (${inp.boq.taxRatePercent}%)`, inp.boq.taxAmount],
    ['Grand total',      inp.boq.grandTotal],
  ]
  totals.forEach(([l, v]) => {
    const r = ws.addRow([null, l, null, null, null, v])
    r.getCell(6).numFmt = currencyFmt
  })
  ws.lastRow!.font = { bold: true }
}

function buildCalculationsSheet(wb: ExcelJS.Workbook, inp: ExcelInputs, currencyFmt: string) {
  const ws = wb.addWorksheet('Calculations', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = [
    { width: 20 }, { width: 46 }, { width: 8 }, { width: 8 },
    { width: 16 }, { width: 16 }, { width: 12 },
  ]
  headerRow(ws, ['id', 'description', 'qty', 'unit', 'unit price', 'amount', 'category'])
  const items: LineItem[] = [...inp.commercial.lineItems]
  const startingRow = ws.lastRow!.number + 1
  items.forEach((l, idx) => {
    const rowIdx = startingRow + idx
    ws.addRow([l.id, l.description, l.quantity, l.unit, l.unitPrice, null, l.category])
    // Excel formula: amount = qty * unitPrice — lets users edit and see updates
    const r = ws.getRow(rowIdx)
    r.getCell(5).numFmt = currencyFmt
    r.getCell(6).value = { formula: `C${rowIdx}*E${rowIdx}` }
    r.getCell(6).numFmt = currencyFmt
  })
  const endRow = startingRow + items.length - 1
  const totalRow = ws.addRow(['', 'Total', '', '', '', null, ''])
  totalRow.getCell(6).value = { formula: `SUM(F${startingRow}:F${endRow})` }
  totalRow.getCell(6).numFmt = currencyFmt
  totalRow.font = { bold: true }

  ws.addRow([])
  const noteRow = ws.addRow(['Legend', `Amounts computed live via =qty * unit_price. Edit any qty or price to update the total. Formatted for ${inp.commercial.currency}.`])
  noteRow.font = { italic: true, color: { argb: 'FF64748B' } }
  ws.mergeCells(noteRow.number, 2, noteRow.number, 7)
}

function headerRow(ws: ExcelJS.Worksheet, columns: string[]) {
  const row = ws.addRow(columns)
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
  row.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  })
}

function autoStyle(ws: ExcelJS.Worksheet) {
  ws.eachRow((row, i) => {
    if (i === 1) return
    row.eachCell((cell) => {
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }
    })
  })
}

function shortIso(iso?: string): string {
  if (!iso) return ''
  try { return new Date(iso).toISOString().slice(0, 10) } catch { return iso }
}

// Silence "unused" warning for formatCurrency (used by future line-level renderers)
void formatCurrency
