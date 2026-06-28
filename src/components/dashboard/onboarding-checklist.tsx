"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  OnboardingItem,
  OnboardingResponse,
} from "@/app/api/dashboard/onboarding/route";

const DISMISS_STORAGE_KEY = "onboarding_checklist_dismissed";

export function OnboardingChecklist() {
  const [data, setData] = useState<OnboardingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard/onboarding", { cache: "no-store" });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const json = (await res.json()) as { data: OnboardingResponse };
        if (!cancelled) {
          setData(json.data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
    }
    setDismissed(true);
  }

  if (loading || !data) return null;

  // If user is past onboarding (has contacts) OR they've dismissed, hide.
  if (data.hasContacts || dismissed) return null;

  const doneCount = data.items.filter((i) => i.done).length;
  const total = data.items.length;

  if (data.allDone) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 shrink-0">
            <Sparkles className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              You&apos;re all set!
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Your workspace is fully configured. Time to start converting leads.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle>Get started</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              {doneCount} of {total} done
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${data.percent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-gray-100">
          {data.items.map((item) => (
            <ChecklistRow key={item.key} item={item} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ChecklistRow({ item }: { item: OnboardingItem }) {
  return (
    <li>
      <Link
        href={item.href as Route}
        className={cn(
          "group flex items-start gap-3 py-3 px-1 -mx-1 rounded-md transition-colors hover:bg-gray-50",
          item.done && "opacity-60"
        )}
      >
        <span className="mt-0.5 shrink-0">
          {item.done ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium text-gray-900",
              item.done && "line-through text-gray-500"
            )}
          >
            {item.label}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-600" />
      </Link>
    </li>
  );
}
