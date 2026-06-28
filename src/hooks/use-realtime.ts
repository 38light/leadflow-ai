"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions<T extends Record<string, unknown>> {
  table: string;
  event?: PostgresEvent;
  filter?: string;
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useRealtime<T extends Record<string, unknown>>({
  table,
  event = "*",
  filter,
  onPayload,
}: UseRealtimeOptions<T>) {
  useEffect(() => {
    const supabase = createClient();

    const channelConfig: Record<string, unknown> = {
      event,
      schema: "public",
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(`realtime-${table}-${filter ?? "all"}`)
      .on(
        "postgres_changes" as never,
        channelConfig as never,
        onPayload as never
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, event, filter, onPayload]);
}
