import { Suspense } from "react";
import { ConversationsList } from "@/components/conversations/conversations-list";
import { Skeleton } from "@/components/ui/skeleton";

function ConversationsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<ConversationsListSkeleton />}>
      <ConversationsList />
    </Suspense>
  );
}
