"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement, SVGProps } from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

// ── Types ────────────────────────────────────────────────────────────────────

interface FlowNode {
  name: string;
  kind: "channel" | "status";
  rawKey: string;
}

interface FlowLink {
  source: number;
  target: number;
  value: number;
}

interface FlowData {
  nodes: FlowNode[];
  links: FlowLink[];
  total: number;
  days: number;
}

interface ChannelFlowSankeyProps {
  days?: number;
}

// ── Colour maps ──────────────────────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "#25D366",
  sms: "#3B82F6",
  instagram: "#E4405F",
  facebook: "#1877F2",
  voice: "#8B5CF6",
  web_chat: "#10B981",
  manual: "#6B7280",
  hubspot: "#FF7A59",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#9CA3AF",
  contacted: "#60A5FA",
  qualified: "#34D399",
  proposal: "#FBBF24",
  negotiation: "#FB923C",
  won: "#10B981",
  lost: "#EF4444",
};

const FALLBACK_COLOR = "#9CA3AF";

// ── Helpers ──────────────────────────────────────────────────────────────────

function humanize(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function colorForNode(node: FlowNode): string {
  if (node.kind === "channel") {
    return CHANNEL_COLORS[node.rawKey] ?? FALLBACK_COLOR;
  }
  return STATUS_COLORS[node.rawKey] ?? FALLBACK_COLOR;
}

// ── Custom node renderer ─────────────────────────────────────────────────────

interface CustomNodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: {
    name?: string;
    value?: number;
  };
  nodes?: FlowNode[];
}

function renderNode({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  payload,
  nodes = [],
}: CustomNodeProps): ReactElement<SVGProps<SVGGElement>> {
  const node = nodes[index];
  if (!node) return <g />;

  const fill = colorForNode(node);
  const label = humanize(node.rawKey);
  const isChannel = node.kind === "channel";
  const labelX = isChannel ? x - 6 : x + width + 6;
  const textAnchor = isChannel ? "end" : "start";
  const labelY = y + height / 2;
  const value = payload?.value ?? 0;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={0.95}
      />
      <text
        x={labelX}
        y={labelY - 2}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize={12}
        fill="#374151"
        fontWeight={500}
      >
        {label}
      </text>
      <text
        x={labelX}
        y={labelY + 12}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize={11}
        fill="#9CA3AF"
      >
        {value.toLocaleString()}
      </text>
    </g>
  );
}

// ── Custom link renderer ─────────────────────────────────────────────────────

interface CustomLinkProps {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  index?: number;
  payload?: {
    source?: { rawKey?: string; kind?: string } | number;
    target?: { rawKey?: string; kind?: string } | number;
  };
  nodes?: FlowNode[];
}

function renderLink({
  sourceX = 0,
  targetX = 0,
  sourceY = 0,
  targetY = 0,
  sourceControlX = 0,
  targetControlX = 0,
  linkWidth = 0,
  payload,
}: CustomLinkProps): ReactElement<SVGProps<SVGPathElement>> {
  const source = payload?.source;
  const sourceRaw =
    typeof source === "object" && source !== null ? source.rawKey : undefined;
  const fill = (sourceRaw && CHANNEL_COLORS[sourceRaw]) || FALLBACK_COLOR;

  return (
    <path
      d={`
        M${sourceX},${sourceY + linkWidth / 2}
        C${sourceControlX},${sourceY + linkWidth / 2}
         ${targetControlX},${targetY + linkWidth / 2}
         ${targetX},${targetY + linkWidth / 2}
        L${targetX},${targetY - linkWidth / 2}
        C${targetControlX},${targetY - linkWidth / 2}
         ${sourceControlX},${sourceY - linkWidth / 2}
         ${sourceX},${sourceY - linkWidth / 2}
        Z
      `}
      fill={fill}
      fillOpacity={0.35}
      stroke="none"
    />
  );
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

interface SankeyTooltipPayloadItem {
  payload?: {
    payload?: {
      source?: { rawKey?: string; kind?: string };
      target?: { rawKey?: string; kind?: string };
      value?: number;
      rawKey?: string;
      kind?: "channel" | "status";
    };
    value?: number;
    name?: string;
  };
  name?: string;
  value?: number;
}

interface SankeyTooltipProps {
  active?: boolean;
  payload?: SankeyTooltipPayloadItem[];
}

function SankeyCustomTooltip({ active, payload }: SankeyTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const inner = item?.payload?.payload;

  // Link hover
  if (inner?.source && inner?.target) {
    const srcKey = inner.source.rawKey ?? "?";
    const tgtKey = inner.target.rawKey ?? "?";
    const value = inner.value ?? item?.value ?? 0;
    return (
      <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
        <div className="font-medium text-gray-900">
          {humanize(srcKey)} → {humanize(tgtKey)}
        </div>
        <div className="text-gray-500 mt-0.5">
          {value.toLocaleString()} contact{value === 1 ? "" : "s"}
        </div>
      </div>
    );
  }

  // Node hover
  const rawKey = inner?.rawKey ?? item?.name ?? "";
  const value = item?.value ?? inner?.value ?? 0;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-gray-900">{humanize(rawKey)}</div>
      <div className="text-gray-500 mt-0.5">
        {value.toLocaleString()} contact{value === 1 ? "" : "s"}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function ChannelFlowSankey({ days = 90 }: ChannelFlowSankeyProps) {
  const [data, setData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/channel-flow?days=${days}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data: FlowData };
        if (!cancelled) {
          setData(json.data);
        }
      } catch {
        // silently fail — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const sankeyData = useMemo(() => {
    if (!data) return null;
    return {
      nodes: data.nodes.map((n) => ({ ...n, name: humanize(n.rawKey) })),
      links: data.links,
    };
  }, [data]);

  const hasData = Boolean(
    data && data.links.length > 0 && data.nodes.length > 0 && data.total > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel → Outcome Flow</CardTitle>
        <p className="text-sm text-gray-500">
          Where your leads come from and where they end up
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-80 w-full" />
        ) : !hasData || !sankeyData ? (
          <div className="flex h-80 items-center justify-center text-sm text-gray-400">
            No channel flow data yet
          </div>
        ) : (
          <div className="w-full" style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankeyData}
                nodePadding={24}
                nodeWidth={14}
                linkCurvature={0.5}
                iterations={64}
                margin={{ top: 10, right: 110, bottom: 10, left: 110 }}
                node={
                  ((nodeProps: CustomNodeProps) =>
                    renderNode({
                      ...nodeProps,
                      nodes: data!.nodes,
                    })) as unknown as ReactElement<SVGElement>
                }
                link={
                  renderLink as unknown as ReactElement<SVGElement>
                }
              >
                <Tooltip content={<SankeyCustomTooltip />} />
              </Sankey>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
