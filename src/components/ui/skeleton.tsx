import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      style={{ width, height }}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4 w-full", i === lines - 1 && "w-3/4")}
        />
      ))}
    </div>
  );
}

interface SkeletonCircleProps {
  size?: string | number;
  className?: string;
}

export function SkeletonCircle({ size = 40, className }: SkeletonCircleProps) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      width={size}
      height={size}
    />
  );
}
