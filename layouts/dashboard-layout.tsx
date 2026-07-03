'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNav } from '@/components/dashboard/top-nav'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Authentication is enforced server-side by middleware.ts.
  // This client-side skeleton only renders while the *first* client-side auth
  // signal is arriving. We deliberately do NOT gate on `!user` — if hydration
  // completes without a user, the middleware will already have redirected us
  // to /login on the next navigation, and we should let the page render so
  // the redirect can occur naturally rather than hanging on the skeleton.
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-64 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-none px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
