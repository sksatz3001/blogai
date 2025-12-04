export default function BlogsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-muted rounded-lg" />
          <div className="h-5 w-64 bg-muted rounded" />
        </div>
        <div className="h-11 w-40 bg-muted rounded-lg" />
      </div>

      {/* Blog cards skeleton */}
      <div className="grid gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 bg-muted rounded-xl h-48" />
        ))}
      </div>
    </div>
  );
}
