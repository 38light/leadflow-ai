"use client";

import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { NotificationPanel } from "./notification-panel";

export function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Resolve current user id for the notification panel
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Page title area */}
      <div className="min-w-0 flex-1">
        {/* Page title is supplied by individual pages; this acts as a slot area */}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationPanel userId={userId} />

        {/* Account dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Account menu"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline font-medium">Account</span>
            <ChevronDown
              className={cn(
                "hidden sm:block h-4 w-4 text-gray-400 transition-transform duration-150",
                dropdownOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50"
            >
              <a
                href="/settings/profile"
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings className="h-4 w-4 text-gray-400" />
                Profile Settings
              </a>

              <div className="my-1 h-px bg-gray-100" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-gray-400" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
