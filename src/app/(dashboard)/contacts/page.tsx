import { Suspense } from "react";
import { ContactsPageInner } from "./contacts-inner";
import { Skeleton } from "@/components/ui/skeleton";

function ContactsSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsSkeleton />}>
      <ContactsPageInner />
    </Suspense>
  );
}
