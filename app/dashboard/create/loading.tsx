export default function CreateLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2 text-center">
        <div className="h-10 w-96 bg-muted rounded-lg mx-auto" />
        <div className="h-5 w-64 bg-muted rounded mx-auto" />
      </div>

      {/* Form skeleton */}
      <div className="bg-muted rounded-2xl h-[600px]" />
    </div>
  );
}
