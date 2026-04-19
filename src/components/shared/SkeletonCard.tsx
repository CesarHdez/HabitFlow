import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800', className)} />
  )
}

export function HabitCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <Skeleton className="w-1 h-10 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function KPICardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-9 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function TrackingRowSkeleton() {
  return (
    <div className="grid border-b border-gray-100 dark:border-gray-800" style={{ gridTemplateColumns: '1fr repeat(7, 44px)' }}>
      <div className="flex items-center gap-2 px-3 py-3">
        <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
        <Skeleton className="h-4 w-28" />
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center border-l border-gray-100 dark:border-gray-800 py-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
