import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

const LINKS = [
  {
    title: 'Platform',
    items: [
      { label: 'Projects', href: '#' },
      { label: 'Configurator', href: '#' },
      { label: 'BOQ Builder', href: '#' },
      { label: 'Proposals', href: '#' },
    ],
  },
  {
    title: 'Engineering',
    items: [
      { label: 'Pixel Pitch Guide', href: '#' },
      { label: 'Viewing Distance', href: '#' },
      { label: 'Cabinet Layout', href: '#' },
      { label: 'Power & Weight', href: '#' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '#' },
      { label: 'Customers', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Terms', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-10 py-16 md:grid-cols-6">
        <div className="md:col-span-2">
          <Logo size="lg" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            The professional display engineering platform used by manufacturers, AV consultants and system integrators to design LED and LCD projects with confidence.
          </p>
        </div>
        {LINKS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</h4>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-start gap-3 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ScreenLink.ai — Professional Display Engineering Platform</p>
          <p className="font-mono">v0.1.0 · build · preview</p>
        </div>
      </div>
    </footer>
  )
}
