'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="container flex h-16 items-center">
        <Logo />
      </div>
      <div className="container flex flex-1 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unexpected error</p>
          <h1 className="mt-2 text-display-sm text-foreground">Something didn’t compute</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            An unexpected error occurred while rendering this page. Our diagnostics have been notified.
          </p>
          {error.digest && (
            <p className="mt-3 font-mono text-xs text-muted-foreground/70">ref: {error.digest}</p>
          )}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => (window.location.href = '/')}>Home</Button>
            <Button onClick={reset}>Try again</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
