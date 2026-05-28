import React from 'react';

function Bone({ className }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className ?? ''}`} />;
}

export function BugCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 border-l-4 border-l-slate-200 dark:border-l-slate-700">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2.5">
          <Bone className="h-5 w-3/4" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <Bone className="h-8 w-8 rounded-lg" />
          <Bone className="h-8 w-8 rounded-lg" />
          <Bone className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="mt-4 flex gap-2 items-center">
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="h-4 w-28 ml-1" />
        <Bone className="h-4 w-20 ml-auto" />
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Bone className="h-5 w-5 rounded-full" />
        <Bone className="h-5 w-24" />
        <Bone className="h-5 w-6 rounded-full ml-auto" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
          <Bone className="h-4 w-full" />
          <Bone className="h-3 w-4/5" />
          <div className="flex gap-2 mt-1">
            <Bone className="h-4 w-14 rounded-full" />
            <Bone className="h-4 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <BugCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function KanbanSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <KanbanColumnSkeleton key={i} />
      ))}
    </div>
  );
}
