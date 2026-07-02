'use client'

import * as React from 'react'
import { useWorkspace } from './workspace-provider'
import { useWorkspaceAutosave } from './use-workspace-autosave'
import { ProjectInfoPanel } from './project-info-panel'
import { EngineeringWorkspace } from './engineering-workspace'
import { CommercialPanel } from './commercial-panel'
import { CostSummary } from './cost-summary'
import { MarginCard } from './margin-card'
import { BOQTable } from './boq-table'
import { ProposalPreview } from './proposal-preview'
import { ExportPanelConnected } from './export-panel-connected'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Cog, FileText, LayoutGrid, Table2, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * WorkspaceShell — the three-panel adaptive layout.
 *
 *   Desktop (≥ lg):        LEFT (project info) · CENTER (engineering) · RIGHT (commercial + BOQ + proposal tabs)
 *   Tablet (md, < lg):      LEFT stacked, tabs on the right
 *   Mobile (< md):          Fully tabbed — 5 tabs (info · engineering · commercial · boq · proposal)
 */
export function WorkspaceShell() {
  const { lastRecalcMs, isReady } = useWorkspace()
  const autosave = useWorkspaceAutosave()

  return (
    <div className="w-full">
      {/* Header strip */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <AutosaveIndicator status={autosave.status} />
          <span>·</span>
          <span>recalc {lastRecalcMs.toFixed(1)} ms</span>
          {!isReady && <><span>·</span><Badge variant="outline" className="text-[10px] uppercase">Engineering incomplete</Badge></>}
        </div>
      </div>

      {/* Desktop / large tablet: 3 columns */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_400px]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <ProjectInfoPanel />
          </div>
        </aside>
        <main className="rounded-lg border border-border bg-card p-5">
          <EngineeringWorkspace />
        </main>
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <CostSummary />
          </div>
          <MarginCard />
          <div className="rounded-lg border border-border bg-card">
            <Tabs defaultValue="commercial" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none rounded-t-lg">
                <TabsTrigger value="commercial"><Cog className="mr-1 h-3 w-3" /> Commercial</TabsTrigger>
                <TabsTrigger value="boq"><Table2 className="mr-1 h-3 w-3" /> BOQ</TabsTrigger>
                <TabsTrigger value="proposal"><FileText className="mr-1 h-3 w-3" /> Proposal</TabsTrigger>
              </TabsList>
              <TabsContent value="commercial" className="p-4"><CommercialPanel /></TabsContent>
              <TabsContent value="boq" className="p-4"><BOQTable /></TabsContent>
              <TabsContent value="proposal" className="p-0"><ProposalPreview className="m-0 rounded-t-none border-0" /></TabsContent>
            </Tabs>
          </div>
          <ExportPanelConnected />
        </aside>
      </div>

      {/* Tablet: left stacked, tabs on right */}
      <div className="hidden md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-4 lg:hidden">
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <ProjectInfoPanel />
          </div>
          <div className="rounded-lg border border-border bg-card p-4"><CostSummary /></div>
          <MarginCard />
          <ExportPanelConnected />
        </aside>
        <main className="rounded-lg border border-border bg-card p-5">
          <Tabs defaultValue="engineering">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="engineering"><LayoutGrid className="mr-1 h-3 w-3" /> Engineering</TabsTrigger>
              <TabsTrigger value="commercial"><Wallet className="mr-1 h-3 w-3" /> Commercial</TabsTrigger>
              <TabsTrigger value="boq"><Table2 className="mr-1 h-3 w-3" /> BOQ</TabsTrigger>
              <TabsTrigger value="proposal"><FileText className="mr-1 h-3 w-3" /> Proposal</TabsTrigger>
            </TabsList>
            <TabsContent value="engineering" className="mt-4"><EngineeringWorkspace /></TabsContent>
            <TabsContent value="commercial"  className="mt-4"><CommercialPanel /></TabsContent>
            <TabsContent value="boq"         className="mt-4"><BOQTable /></TabsContent>
            <TabsContent value="proposal"    className="mt-4"><ProposalPreview /></TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Mobile: fully tabbed */}
      <div className="md:hidden">
        <Tabs defaultValue="engineering">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="engineering">Design</TabsTrigger>
            <TabsTrigger value="commercial">$</TabsTrigger>
            <TabsTrigger value="boq">BOQ</TabsTrigger>
            <TabsTrigger value="proposal">Doc</TabsTrigger>
          </TabsList>
          <TabsContent value="info"        className="mt-4 rounded-lg border border-border bg-card p-4"><ProjectInfoPanel /></TabsContent>
          <TabsContent value="engineering" className="mt-4 rounded-lg border border-border bg-card p-4"><EngineeringWorkspace /></TabsContent>
          <TabsContent value="commercial"  className="mt-4 rounded-lg border border-border bg-card p-4">
            <CostSummary />
            <div className="my-4 border-t border-border" />
            <CommercialPanel />
            <div className="my-4" />
            <ExportPanelConnected />
          </TabsContent>
          <TabsContent value="boq"      className="mt-4 rounded-lg border border-border bg-card p-4"><BOQTable /></TabsContent>
          <TabsContent value="proposal" className="mt-4"><ProposalPreview /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function AutosaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  const label = status === 'saving' ? 'Saving…' : status === 'saved' ? 'All changes saved' : status === 'error' ? 'Save failed' : 'Ready'
  return (
    <span className={cn('inline-flex items-center gap-1',
      status === 'saving' && 'text-amber-600 dark:text-amber-400',
      status === 'saved' && 'text-emerald-600 dark:text-emerald-400',
      status === 'error' && 'text-destructive',
    )}>
      ● {label}
    </span>
  )
}
