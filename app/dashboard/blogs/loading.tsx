export default function BlogsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-5 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-11 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Blog cards skeleton */}
      <div className="grid gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 bg-slate-200 dark:bg-slate-800 rounded-xl h-48" />
        ))}
      </div>
    </div>
  );
}
