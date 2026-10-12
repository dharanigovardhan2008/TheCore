export default function Loading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-surface-tint rounded-full"></div>
          <div className="h-8 bg-surface-tint rounded w-64"></div>
          <div className="h-6 bg-surface-tint rounded-full w-20"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[200px] bg-surface rounded-[var(--radius-card)]"></div>
          <div className="h-[300px] bg-surface rounded-[var(--radius-card)]"></div>
        </div>
        <div className="h-[400px] bg-surface rounded-[var(--radius-card)]"></div>
      </div>
    </div>
  );
}

