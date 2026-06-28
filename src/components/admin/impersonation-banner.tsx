"use client";

import { useEffect, useState } from "react";
import { Eye, X, LogOut } from "lucide-react";

interface ImpersonationData {
  userId: string;
  email: string;
  adminId: string;
  adminEmail: string;
  startedAt: string;
}

function parseImpersonationCookie(): ImpersonationData | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("impersonation="));

  if (!match) return null;

  const value = match.slice("impersonation=".length);
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as Partial<ImpersonationData>;
    if (!parsed.userId || !parsed.email) return null;
    return parsed as ImpersonationData;
  } catch {
    return null;
  }
}

export function ImpersonationBanner() {
  const [data, setData] = useState<ImpersonationData | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Read cookie on mount
    setData(parseImpersonationCookie());
  }, []);

  if (!data) return null;

  async function handleExit() {
    setExiting(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
    } catch {
      // Best-effort — reload regardless
    }
    // Hard reload so all server state re-evaluates without cookie
    window.location.href = "/admin";
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-amber-400 px-4 py-2.5 shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="h-4 w-4 shrink-0 text-amber-900" aria-hidden="true" />
        <span className="text-sm font-semibold text-amber-900 truncate">
          Impersonation Mode — Viewing as{" "}
          <span className="underline underline-offset-2">{data.email}</span>
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden sm:inline text-xs text-amber-800">
          Admin: {data.adminEmail}
        </span>
        <button
          onClick={handleExit}
          disabled={exiting}
          className="flex items-center gap-1.5 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-50 transition-colors hover:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exiting ? (
            <>
              <X className="h-3.5 w-3.5" />
              Exiting…
            </>
          ) : (
            <>
              <LogOut className="h-3.5 w-3.5" />
              Exit Impersonation
            </>
          )}
        </button>
      </div>
    </div>
  );
}
