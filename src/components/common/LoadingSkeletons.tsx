import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-[#e8e2d7]/60 dark:bg-[#25382d]/60 rounded-lg ${className}`}
    aria-hidden="true"
  />
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`p-5 rounded-2xl border border-[#e8e2d7] dark:border-[#25382d] bg-[#ffffff] dark:bg-[#15221b] space-y-4 ${className}`}
    aria-busy="true"
    aria-label="Loading card content"
  >
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-5 w-1/3" />
      <SkeletonBox className="h-8 w-8 rounded-full" />
    </div>
    <SkeletonBox className="h-4 w-full" />
    <SkeletonBox className="h-4 w-4/5" />
    <div className="pt-2 flex items-center gap-3">
      <SkeletonBox className="h-9 w-24 rounded-xl" />
      <SkeletonBox className="h-9 w-20 rounded-xl" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div
    className="w-full rounded-2xl border border-[#e8e2d7] dark:border-[#25382d] bg-[#ffffff] dark:bg-[#15221b] overflow-hidden"
    aria-busy="true"
    aria-label="Loading table data"
  >
    <div className="p-4 bg-[#f3efe6] dark:bg-[#1d2d24] border-b border-[#e8e2d7] dark:border-[#25382d] flex items-center justify-between gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonBox key={i} className="h-4 flex-1 max-w-[140px]" />
      ))}
    </div>
    <div className="divide-y divide-[#e8e2d7] dark:divide-[#25382d]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex items-center justify-between gap-4">
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonBox key={c} className="h-4 flex-1 max-w-[160px]" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ChatSkeleton: React.FC = () => (
  <div className="p-4 space-y-4 max-w-3xl mx-auto w-full" aria-busy="true" aria-label="Loading conversation">
    <div className="flex items-start gap-3">
      <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="space-y-2 flex-1 max-w-md">
        <SkeletonBox className="h-14 w-full rounded-2xl" />
      </div>
    </div>
    <div className="flex items-start gap-3 justify-end">
      <div className="space-y-2 flex-1 max-w-sm">
        <SkeletonBox className="h-10 w-full rounded-2xl ml-auto" />
      </div>
      <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
    </div>
    <div className="flex items-start gap-3">
      <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="space-y-2 flex-1 max-w-lg">
        <SkeletonBox className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 w-full animate-fade-up" aria-busy="true" aria-label="Loading health dashboard">
    {/* Next Immediate Action Banner Skeleton */}
    <div className="p-6 rounded-2xl bg-[#ffffff] dark:bg-[#15221b] border border-[#e8e2d7] dark:border-[#25382d] space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-8 h-8 rounded-full" />
        <SkeletonBox className="h-6 w-48" />
      </div>
      <SkeletonBox className="h-4 w-3/4" />
      <div className="flex gap-3 pt-2">
        <SkeletonBox className="h-10 w-32 rounded-xl" />
        <SkeletonBox className="h-10 w-28 rounded-xl" />
      </div>
    </div>

    {/* Metric Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>

    {/* Main Content Area Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export const PageSkeleton: React.FC<{ title?: string }> = ({ title = 'Loading page' }) => (
  <div className="space-y-6 max-w-6xl mx-auto p-4" aria-busy="true" aria-label={title}>
    <div className="space-y-2">
      <SkeletonBox className="h-8 w-64" />
      <SkeletonBox className="h-4 w-96" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <TableSkeleton rows={4} columns={3} />
  </div>
);
