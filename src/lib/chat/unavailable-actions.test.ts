import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { executeTool } from "@/lib/ai/tools";

describe("unconnected AI actions", () => {
  it.each(["check_calendar", "book_appointment", "generate_payment_link"])("%s hands off without inventing success", async tool => {
    const query = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), then: (resolve: (r: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve) };
    const db = { from: vi.fn().mockReturnValue(query) } as unknown as SupabaseClient;
    const result = await executeTool(tool, {}, { userId: "owner", contactId: "contact", conversationId: "conversation", supabase: db });
    expect(result).toMatchObject({ success: false, requiresHuman: true });
    expect(result).not.toHaveProperty("booked");
    expect(result).not.toHaveProperty("url");
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ is_ai_active: false }));
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  });
});
