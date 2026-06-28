import Link from "next/link";
import { Brain, ArrowRight } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

interface AIHandledStatsProps {
  ownerId: string;
}

export async function AIHandledStats({ ownerId }: AIHandledStatsProps) {
  const supabase = await createServerClient();

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceISO = since.toISOString();

  const [totalRes, toolsRes] = await Promise.all([
    supabase
      .from("ai_interaction_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId)
      .gte("created_at", sinceISO),
    supabase
      .from("ai_interaction_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId)
      .gte("created_at", sinceISO)
      .not("tools_called", "is", null)
      .neq("tools_called", "[]"),
  ]);

  const total = totalRes.count ?? 0;
  const withTools = toolsRes.count ?? 0;

  if (total === 0) {
    return (
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              AI ready to handle conversations
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Configure your AI agents to start auto-replying to leads.
            </p>
          </div>
          <Link
            href="/settings/ai"
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-800"
          >
            Set up AI <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
      <CardContent className="p-6 flex items-center gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 shrink-0">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-gray-900">
              {total.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              conversations handled by AI this week
            </p>
          </div>
          {withTools > 0 ? (
            <p className="mt-1 text-xs text-gray-500">
              {withTools.toLocaleString()} with tools used
            </p>
          ) : null}
        </div>
        <Link
          href="/analytics/team"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-800 shrink-0"
        >
          View details <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
