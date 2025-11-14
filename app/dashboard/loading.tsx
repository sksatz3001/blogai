export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-5 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>

      {/* Quick action skeleton */}
      <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />

      {/* Stats skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>

      {/* Recent blogs skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
