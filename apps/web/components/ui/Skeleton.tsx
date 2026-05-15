export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`apple-skeleton ${className}`} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center" style={{ animationDelay: `${i * 0.06}s` }}>
          <Skeleton className="h-5 w-24 rounded-[8px]" />
          <Skeleton className="h-5 flex-1 rounded-[8px]" />
          <Skeleton className="h-5 w-16 rounded-[8px]" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-[8px]" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="apple-card-solid p-6 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
