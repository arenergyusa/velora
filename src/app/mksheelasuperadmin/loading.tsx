import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-fade-in w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Skeleton className="h-10 w-64 rounded-md bg-muted/60" />
          <Skeleton className="h-4 w-48 rounded-md bg-muted/40 mt-2" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl bg-primary/20" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-2xl bg-muted/60" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md bg-muted/60 mb-2" />
            <Skeleton className="h-4 w-32 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>

      <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm min-h-[400px]">
         <Skeleton className="h-full min-h-[350px] w-full rounded-2xl bg-muted/40" />
      </div>
    </div>
  )
}
