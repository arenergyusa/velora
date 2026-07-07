import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-48 rounded-md bg-muted/60" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-muted/40 mt-2" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-2xl bg-muted/60" />
              <Skeleton className="h-6 w-16 rounded-full bg-muted/40" />
            </div>
            <Skeleton className="h-8 w-32 rounded-md bg-muted/60 mb-2" />
            <Skeleton className="h-4 w-24 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex gap-2 mb-6">
           <Skeleton className="h-10 w-24 rounded-xl bg-muted/60" />
           <Skeleton className="h-10 w-24 rounded-xl bg-muted/60" />
           <Skeleton className="h-10 w-24 rounded-xl bg-muted/60 hidden sm:block" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-border/50 gap-4">
               <div className="flex items-center gap-4">
                 <Skeleton className="h-12 w-12 rounded-2xl bg-muted/60 shrink-0" />
                 <div>
                   <Skeleton className="h-5 w-32 rounded-md bg-muted/60 mb-1.5" />
                   <Skeleton className="h-3 w-24 rounded-md bg-muted/40" />
                 </div>
               </div>
               <div className="flex flex-col items-start sm:items-end pl-16 sm:pl-0">
                 <Skeleton className="h-6 w-24 rounded-md bg-muted/60 mb-1.5" />
                 <Skeleton className="h-4 w-16 rounded-md bg-muted/40" />
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
