import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Ruler, Grid3x3, LineChart, Zap } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  footer?: React.ReactNode
}

const PILLARS = [
  { icon: Ruler, title: 'Precision engineering', body: 'Pixel pitch, viewing distance and cabinet math — codified.' },
  { icon: Grid3x3, title: 'Cabinet layouts', body: 'Solve tiling, seams and power distribution before quoting.' },
  { icon: LineChart, title: 'Auditable projects', body: 'Every revision, BOQ line item and specification, traceable.' },
  { icon: Zap, title: 'Faster proposals', body: 'From requirement to customer-ready proposal in minutes.' },
]

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen w-full bg-background lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="absolute inset-0 grid-pattern opacity-[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent/10" />

        <div className="relative z-10 flex items-center justify-between p-8">
          <Logo variant="light" size="md" />
          <span className="text-xs font-mono text-sidebar-foreground/50">Enterprise · v0.1</span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 pb-16">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Professional Display Engineering
          </p>
          <h2 className="text-display-md font-semibold leading-tight text-white">
            Engineer LED &amp; LCD projects with the rigor they deserve.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-foreground/70">
            ScreenLink.ai is the workspace for manufacturers, AV consultants and system integrators — from customer requirement to BOQ and proposal.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-6 max-w-lg">
            {PILLARS.map((p) => (
              <div key={p.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent/70 text-accent">
                  <p.icon className="h-4 w-4" />
                </div>
                <div>
                  <dt className="text-sm font-semibold text-white">{p.title}</dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-sidebar-foreground/70">{p.body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative z-10 border-t border-sidebar-border/40 px-12 py-6 text-xs text-sidebar-foreground/50">
          “We cut proposal turnaround by 68% and eliminated cabinet math errors on our LED bids.”
          <span className="ml-2 font-medium text-sidebar-foreground/80">— Head of Engineering, AV Systems Integrator</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-6">
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-display-sm font-semibold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>© {new Date().getFullYear()} ScreenLink.ai</span>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-foreground">Terms</Link>
              <Link href="#" className="hover:text-foreground">Privacy</Link>
              <Link href="#" className="hover:text-foreground">Security</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
