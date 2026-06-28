import { ApprovalsClient } from "@/components/approvals/approvals-client";

export const dynamic = "force-dynamic";

export default function ApprovalsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Approval Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review AI-drafted replies before they go out. Drafts land here when AI
          confidence is below your threshold or you require approval on every
          message.
        </p>
      </div>
      <ApprovalsClient />
    </div>
  );
}
