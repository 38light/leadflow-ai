"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: string | LucideIcon;
  isConnected: boolean;
  onConfigure: () => void;
}

export function IntegrationCard({
  name,
  description,
  icon: Icon,
  isConnected,
  onConfigure,
}: IntegrationCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 text-xl">
        {typeof Icon === "string" ? (
          <span>{Icon}</span>
        ) : (
          <Icon className="h-5 w-5 text-gray-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          "shrink-0 text-xs font-medium px-2.5 py-1 rounded-full",
          isConnected
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600"
        )}
      >
        {isConnected ? "Connected" : "Not connected"}
      </span>

      {/* Action button */}
      <Button
        type="button"
        variant={isConnected ? "outline" : "primary"}
        size="sm"
        onClick={onConfigure}
        className="shrink-0"
      >
        {isConnected ? "Configure" : "Connect"}
      </Button>
    </div>
  );
}
