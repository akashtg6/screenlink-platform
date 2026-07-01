import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Ruler,
  Grid3x3,
  Zap,
  FileText,
  Layers,
  Cpu,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { MarketingLayout } from '@/layouts/marketing-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Professional Display Engineering Platform',
}

export default function LandingPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-primary-50/60 via-background to-transparent dark:from-primary/10" />

        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="mr-1.5 h-3 w-3" /> The engineering workspace for display projects
            </Badge>
            <h1 className="text-display-lg text-foreground md:text-display-xl">
              Engineer LED &amp; LCD projects <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                with the rigor they deserve.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              ScreenLink.ai is the professional display engineering platform for manufacturers, AV consultants and system integrators. From customer requirement to cabinet layout, BOQ and proposal — in a single auditable workspace.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 gap-2 px-6">
                <Link href="/signup">
                  Start engineering <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 gap-2 px-6">
                <Link href="/dashboard">
                  View live demo <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · Enterprise SSO ready · SOC 2 in progress
            </p>
          </div>

          {/* Preview panel */}
          <div className="relative mx-auto mt-16 max-w-6xl">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-elevation-4">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">screenlink.ai — /dashboard</span>
                <span className="w-16" />
              </div>
              <div className="grid md:grid-cols-[220px,1fr]">
                <div className="hidden border-r border-border bg-sidebar p-4 text-sidebar-foreground md:block">
                  <div className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">Engineering</div>
                  {['Dashboard', 'Projects', 'Configurator', 'Proposals', 'Team', 'Settings'].map((n, i) => (
                    <div
                      key={n}
                      className={
                        'mb-1 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ' +
                        (i === 1 ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70')
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {n}
                    </div>
                  ))}
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Active projects</div>
                      <div className="text-display-sm font-semibold">24</div>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <div className="text-xs text-muted-foreground">Avg. pitch</div>
                        <div className="text-heading-md font-semibold">P1.9</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Pipeline</div>
                        <div className="text-heading-md font-semibold">$4.2M</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { name: 'Nakheel Mall Anchor LED', status: 'In Review', pitch: 'P1.9', color: 'bg-warning' },
                      { name: 'BLR Terminal Video Wall', status: 'Draft', pitch: 'LCD 55"', color: 'bg-muted-foreground' },
                      { name: 'Stadium Perimeter East', status: 'Approved', pitch: 'P8', color: 'bg-info' },
                    ].map((r) => (
                      <div key={r.name} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/10 grid-pattern" />
                          <div>
                            <div className="text-sm font-medium">{r.name}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">{r.pitch} · SL-2025</div>
                          </div>
                        </div>
                        <span className={'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ' + r.color + '/10 text-foreground'}>
                          <span className={'h-1.5 w-1.5 rounded-full ' + r.color} /> {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="border-b border-border bg-card">
        <div className="container py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Engineering standards trusted by teams working across
          </p>
          <div className="mt-6 grid grid-cols-2 items-center gap-6 text-center md:grid-cols-6">
            {['Retail Malls', 'Airports', 'Stadiums', 'Broadcast', 'Corporate HQ', 'Control Rooms'].map((s) => (
              <div key={s} className="text-sm font-medium text-muted-foreground/80">{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="platform" className="border-b border-border">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Platform</p>
            <h2 className="text-display-md text-foreground">One workspace for every step of a display project</h2>
            <p className="mt-4 text-base text-muted-foreground">
              Replace scattered spreadsheets, PDFs and one-off calculators with a rigorous, versioned engineering system.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { icon: Ruler, title: 'Precision engineering', body: 'Solve pixel pitch, viewing distance and resolution with the same math your senior engineers apply on every bid.' },
              { icon: Grid3x3, title: 'Cabinet layout solver', body: 'Compute cabinet tiling, seam alignment and mullion coverage before you commit to a supplier configuration.' },
              { icon: Zap, title: 'Power &amp; weight', body: 'Every configuration surfaces power draw, thermal envelope and structural load — traceable to source data.' },
              { icon: FileText, title: 'BOQ &amp; proposals', body: 'Generate customer-ready bill of quantities and technical proposals directly from the engineering model.' },
              { icon: Layers, title: 'Versioned revisions', body: 'Every change is captured. Compare revisions, understand impact and roll back with confidence.' },
              { icon: Cpu, title: 'AI assistance (soon)', body: 'Get recommendations for pitch, cabinet mix and proposal narrative — grounded in your organization’s standards.' },
            ].map((f) => (
              <div key={f.title} className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-elevation-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-heading-sm text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: f.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="border-b border-border bg-muted/30">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Workflow</p>
            <h2 className="text-display-md text-foreground">From customer requirement to signed proposal</h2>
          </div>
          <ol className="mt-14 grid gap-6 md:grid-cols-4">
            {[
              { n: '01', t: 'Capture requirement', d: 'Structured intake for customer, site, environment and constraints.' },
              { n: '02', t: 'Configure engineering', d: 'Set pitch, aspect, brightness and cabinet family. Get instant feedback.' },
              { n: '03', t: 'Generate BOQ', d: 'A full bill of quantities produced from the engineering model.' },
              { n: '04', t: 'Deliver proposal', d: 'Branded, technical proposal ready for the customer in minutes.' },
            ].map((s) => (
              <li key={s.n} className="rounded-xl border border-border bg-card p-6">
                <div className="font-mono text-sm text-accent">{s.n}</div>
                <h3 className="mt-2 text-heading-sm text-foreground">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* GUARANTEES */}
      <section id="engineering" className="border-b border-border">
        <div className="container grid gap-12 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Engineering excellence</p>
            <h2 className="text-display-md text-foreground">Built for the way display engineers actually work</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              We interviewed dozens of senior engineers before writing a line of code. ScreenLink codifies the practices that separate a bid you can trust from one you can’t.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                'Deterministic calculations traceable to source assumptions.',
                'Standards library for cabinet families, panels and controllers.',
                'Approval workflow between engineering, sales and delivery.',
                'Full revision history with side-by-side comparison.',
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-sm text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 blur-xl" />
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-elevation-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-semibold text-muted-foreground">Configurator preview</span>
                <span className="font-mono text-[10px] text-muted-foreground">SL-2025-001</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ['Screen size', '6.40 × 3.60 m'],
                  ['Aspect', '16:9'],
                  ['Pixel pitch', 'P1.9 mm'],
                  ['Resolution', '3,368 × 1,896'],
                  ['Cabinets', '32 × 18'],
                  ['Power (max)', '18.4 kW'],
                  ['Weight', '~1,120 kg'],
                  ['Min viewing', '1.9 m'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border bg-muted/30 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-foreground">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                All values derived from active configuration · auditable
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-800" />
        <div className="absolute inset-0 grid-pattern opacity-[0.08]" />
        <div className="container relative py-20 text-center text-primary-foreground">
          <h2 className="text-display-md text-white">Bring the rigor of engineering to every display bid.</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Start with a free workspace. Invite your engineering team, connect your cabinet library and generate your first proposal within a day.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="h-11 gap-2 bg-white text-primary hover:bg-white/90">
              <Link href="/signup">Create your workspace <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 border-white/30 bg-white/5 text-white hover:bg-white/10">
              <Link href="#">Talk to an engineer</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
