'use client'

import Link from 'next/link'
import { FolderKanban, Building2, Activity, ArrowRight, PlusCircle, Ruler } from 'lucide-react'
import { PageHeader } from '@/components/data-display/page-header'
import { StatCard } from '@/components/data-display/stat-card'
import { StatusBadge } from '@/components/data-display/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/data-display/loading-state'
import { EmptyState } from '@/components/data-display/empty-state'
import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import { formatCurrency, formatRelative } from '@/utils/format'

export default function DashboardPage() {
  const { user } = useAuth()
  const { projects, total, loading } = useProjects({ pageSize: 5 })

  const pipeline = projects.reduce((s, p) => s + (p.budgetUsd || 0), 0)
  const inReview = projects.filter((p) => p.status === 'in_review').length

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Good day, ${user?.name?.split(' ')[0] || 'Engineer'}.`}
        description="Snapshot of active engineering work, pipeline value and items needing your review."
        actions={
          <Button asChild className="gap-1.5">
            <Link href="/projects/new">
              <PlusCircle className="h-3.5 w-3.5" /> New Project
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active projects"
          value={String(total)}
          hint="Draft, in-review and approved"
          delta={{ value: '+2 this week', direction: 'up' }}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <StatCard
          label="Pipeline value"
          value={formatCurrency(pipeline)}
          hint="Sum of open project budgets"
          delta={{ value: '+12.4%', direction: 'up' }}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Awaiting review"
          value={String(inReview)}
          hint="Requires engineering approval"
          delta={{ value: '2 aging', direction: 'flat' }}
          icon={<Ruler className="h-4 w-4" />}
        />
        <StatCard
          label="Customers"
          value={String(new Set(projects.map((p) => p.customer.company)).size)}
          hint="Distinct organizations engaged"
          delta={{ value: '+1', direction: 'up' }}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <Card className="border-border shadow-elevation-1">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-heading-sm">Recent projects</CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/projects">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6"><LoadingState rows={4} /></div>
            ) : projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="Kick off your first LED / LCD engineering project."
                action={{ label: 'New Project', href: '/projects/new' }}
              />
            ) : (
              <ul className="divide-y divide-border">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40">
                      <div className="grid-pattern h-9 w-9 flex-shrink-0 rounded bg-primary/10" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{p.code}</span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {p.customer.company || p.customer.name} · {p.location} · updated {formatRelative(p.updatedAt)}
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-heading-sm">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-3">
              {[
                { label: 'New project', href: '/projects/new' },
                { label: 'Browse cabinet library', href: '#' },
                { label: 'Upload customer requirement', href: '#' },
                { label: 'Invite a teammate', href: '/settings' },
              ].map((a) => (
                <Link key={a.label} href={a.href} className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                  <span>{a.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-border">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-800" />
            <div className="absolute inset-0 grid-pattern opacity-[0.10]" />
            <div className="relative p-5 text-primary-foreground">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Coming soon</p>
              <h3 className="mt-1 text-heading-md text-white">AI Proposal Assist</h3>
              <p className="mt-2 text-xs leading-relaxed text-primary-foreground/80">
                Draft engineering justifications and customer-ready proposals from your configuration — grounded in your standards library.
              </p>
              <Button variant="secondary" size="sm" className="mt-4 bg-white/95 text-primary hover:bg-white">Join early access</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
