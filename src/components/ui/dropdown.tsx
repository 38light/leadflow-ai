"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, type ReactNode } from "react";

type DropdownItemVariant = "default" | "danger";

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: DropdownItemVariant;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  className?: string;
}

const itemVariantStyles: Record<DropdownItemVariant, string> = {
  default: "text-gray-700 hover:bg-gray-100",
  danger: "text-red-600 hover:bg-red-50",
};

export function Dropdown({ trigger, items, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <div
        onClick={() => setOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        {trigger}
      </div>

      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                itemVariantStyles[item.variant ?? "default"]
              )}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
