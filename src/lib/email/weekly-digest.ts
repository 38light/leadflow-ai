import { createServerClient } from "@/lib/supabase/server";

export interface DigestStats {
  newLeads: number;
  wonDeals: number;
  bookings: number;
  aiConversations: number;
  topSourceChannel: string | null;
  avgResponseTimeMs: number | null;
  rangeStart: string;
  rangeEnd: string;
}

export interface DigestPayload {
  subject: string;
  html: string;
  text: string;
  stats: DigestStats;
}

interface ContactSlim {
  status: string;
  source_channel: string | null;
}

interface AIInteractionSlim {
  latency_ms: number | null;
}

/**
 * Build a weekly digest for an owner: stats from the last 7 days
 * across contacts, bookings, and ai_interaction_logs.
 */
export async function buildDigest(ownerId: string): Promise<DigestPayload> {
  const supabase = await createServerClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sinceIso = weekAgo.toISOString();

  // Contacts created in the last 7 days
  const { data: contactsRaw } = await supabase
    .from("contacts")
    .select("status, source_channel")
    .eq("user_id", ownerId)
    .gte("created_at", sinceIso);

  const contacts: ContactSlim[] = contactsRaw ?? [];
  const newLeads = contacts.length;
  const wonDeals = contacts.filter((c) => c.status === "won").length;

  // Top performing source channel by count
  const channelCounts: Record<string, number> = {};
  for (const c of contacts) {
    const ch = c.source_channel ?? "unknown";
    channelCounts[ch] = (channelCounts[ch] ?? 0) + 1;
  }
  let topSourceChannel: string | null = null;
  let topCount = 0;
  for (const [ch, n] of Object.entries(channelCounts)) {
    if (n > topCount) {
      topCount = n;
      topSourceChannel = ch;
    }
  }

  // Bookings created in the last 7 days
  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ownerId)
    .gte("created_at", sinceIso);

  // AI interactions / conversations in the last 7 days
  const { data: aiRaw, count: aiCount } = await supabase
    .from("ai_interaction_logs")
    .select("latency_ms", { count: "exact" })
    .eq("user_id", ownerId)
    .gte("created_at", sinceIso);

  const aiLogs: AIInteractionSlim[] = aiRaw ?? [];
  const latencies = aiLogs
    .map((l) => l.latency_ms)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgResponseTimeMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  const stats: DigestStats = {
    newLeads,
    wonDeals,
    bookings: bookingsCount ?? 0,
    aiConversations: aiCount ?? 0,
    topSourceChannel,
    avgResponseTimeMs,
    rangeStart: weekAgo.toISOString(),
    rangeEnd: now.toISOString(),
  };

  const subject = `Your LeadFlow weekly digest — ${formatRange(weekAgo, now)}`;
  const html = renderHtml(stats);
  const text = renderText(stats);

  return { subject, html, text, stats };
}

function formatRange(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${from.toLocaleDateString("en-US", opts)} – ${to.toLocaleDateString("en-US", opts)}`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "n/a";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function renderHtml(s: DigestStats): string {
  const range = formatRange(new Date(s.rangeStart), new Date(s.rangeEnd));
  const top = s.topSourceChannel ?? "n/a";
  const stat = (label: string, value: string) => `
    <td style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;text-align:center;width:25%">
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">${label}</div>
      <div style="font-size:24px;color:#111827;font-weight:700;margin-top:6px">${value}</div>
    </td>`;

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
    <h1 style="font-size:22px;color:#111827;margin:0 0 4px">Your weekly digest</h1>
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px">${range}</p>
    <table cellpadding="0" cellspacing="8" style="width:100%;border-collapse:separate;border-spacing:8px">
      <tr>
        ${stat("New leads", String(s.newLeads))}
        ${stat("Won", String(s.wonDeals))}
        ${stat("Bookings", String(s.bookings))}
        ${stat("AI chats", String(s.aiConversations))}
      </tr>
    </table>
    <div style="margin-top:24px;padding:16px;border:1px solid #e5e7eb;border-radius:8px">
      <p style="margin:0;font-size:14px;color:#374151"><strong>Top source channel:</strong> ${top}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#374151"><strong>Avg AI response time:</strong> ${formatLatency(s.avgResponseTimeMs)}</p>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af">Sent from LeadFlow AI. Open your dashboard to see more.</p>
  </div>
</body></html>`;
}

function renderText(s: DigestStats): string {
  const range = formatRange(new Date(s.rangeStart), new Date(s.rangeEnd));
  return [
    `Your LeadFlow weekly digest (${range})`,
    "",
    `New leads:       ${s.newLeads}`,
    `Won deals:       ${s.wonDeals}`,
    `Bookings:        ${s.bookings}`,
    `AI chats:        ${s.aiConversations}`,
    `Top channel:     ${s.topSourceChannel ?? "n/a"}`,
    `Avg AI latency:  ${formatLatency(s.avgResponseTimeMs)}`,
  ].join("\n");
}
