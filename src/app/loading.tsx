import { Skeleton } from "@/components/ui/skeleton"

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col items-center justify-center space-y-6 max-w-3xl mx-auto w-full mb-12 text-center">
        <Skeleton className="h-12 sm:h-16 w-3/4 max-w-md mx-auto rounded-xl bg-muted/60" />
        <Skeleton className="h-6 w-full max-w-lg mx-auto rounded-md bg-muted/40" />
        <Skeleton className="h-6 w-5/6 max-w-md mx-auto rounded-md bg-muted/40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card bg-card border border-border rounded-3xl p-8 shadow-sm">
             <Skeleton className="h-16 w-16 rounded-2xl bg-muted/60 mb-6" />
             <Skeleton className="h-8 w-48 rounded-md bg-muted/60 mb-4" />
             <Skeleton className="h-4 w-full rounded-md bg-muted/40 mb-2" />
             <Skeleton className="h-4 w-5/6 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  )
}
