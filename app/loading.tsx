import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="container flex h-16 items-center border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="container flex flex-1 flex-col gap-6 py-10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  )
}
