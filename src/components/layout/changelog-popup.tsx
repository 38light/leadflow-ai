"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Sparkles, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LATEST_CHANGELOG } from "@/constants/changelog";

const STORAGE_KEY = "changelog_seen_version";

export function ChangelogPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (seen !== LATEST_CHANGELOG.version) {
        // Slight delay so the dashboard paints first.
        const t = window.setTimeout(() => setOpen(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch {
      // localStorage unavailable — silently skip.
    }
  }, []);

  function handleClose() {
    setOpen(false);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, LATEST_CHANGELOG.version);
      } catch {
        // ignore
      }
    }
  }

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
          <Sparkles className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
            What&apos;s new {LATEST_CHANGELOG.version}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            {LATEST_CHANGELOG.title}
          </h2>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {LATEST_CHANGELOG.items.map((item) => {
          const content = (
            <span className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-800">{item.text}</span>
              {item.href ? (
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-400" />
              ) : null}
            </span>
          );
          return (
            <li key={item.text}>
              {item.href ? (
                <Link
                  href={item.href as Route}
                  onClick={handleClose}
                  className="block rounded-md px-3 py-2 -mx-1 hover:bg-gray-50 transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <div className="px-3 py-2">{content}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href={"/changelog" as Route}
          onClick={handleClose}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          See full changelog
        </Link>
        <Button variant="primary" onClick={handleClose}>
          Got it
        </Button>
      </div>
    </Modal>
  );
}
