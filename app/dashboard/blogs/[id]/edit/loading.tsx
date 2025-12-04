export default function EditLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-96 bg-muted rounded-lg" />
          <div className="h-5 w-64 bg-muted rounded" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>

      {/* Editor skeleton */}
      <div className="bg-muted rounded-xl h-[70vh]" />
    </div>
  );
}
