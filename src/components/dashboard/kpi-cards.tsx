"use client";

import { Users, Flame, MessageSquare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardsProps {
  totalContacts: number;
  hotLeads: number;
  activeConversations: number;
  wonDeals: number;
}

interface KpiCardConfig {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

export function KpiCards({
  totalContacts,
  hotLeads,
  activeConversations,
  wonDeals,
}: KpiCardsProps) {
  const cards: KpiCardConfig[] = [
    {
      label: "Total Contacts",
      value: totalContacts,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Hot Leads",
      value: hotLeads,
      icon: Flame,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      label: "Active Conversations",
      value: activeConversations,
      icon: MessageSquare,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Won Deals",
      value: wonDeals,
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start gap-4"
          >
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg shrink-0",
                card.iconBg
              )}
            >
              <Icon className={cn("h-5 w-5", card.iconColor)} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-0.5">
                {card.value.toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
