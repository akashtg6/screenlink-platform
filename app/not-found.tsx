import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="container flex h-16 items-center">
        <Logo />
      </div>
      <div className="container flex flex-1 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Compass className="h-6 w-6" />
          </div>
          <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">Error 404</p>
          <h1 className="mt-2 text-display-sm text-foreground">This page is off-grid</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The URL you followed doesn’t resolve to a ScreenLink resource. It may have been moved, or never existed.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Home</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
