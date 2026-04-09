import { Bell, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Page title area */}
      <div className="min-w-0 flex-1">
        {/* Page title is supplied by individual pages; this acts as a slot area */}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          type="button"
          className={cn(
            "relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          )}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Notification badge (static placeholder) */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Account dropdown trigger */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Account menu"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline font-medium">Account</span>
          <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
