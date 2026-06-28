export interface ChangelogItem {
  text: string;
  href?: string;
}

export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  items: ChangelogItem[];
}

// Newest first. Bump the top entry's `version` to trigger the in-app popup.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v0.4",
    date: "2026-04-18",
    title: "Visualize your pipeline like never before",
    items: [
      { text: "Conversion Funnel", href: "/analytics/funnel" },
      { text: "Contact Journey Timeline", href: "/contacts" },
      { text: "Channel Flow Sankey", href: "/analytics" },
      { text: "Live Activity Stream", href: "/dashboard" },
    ],
  },
];

export const LATEST_CHANGELOG: ChangelogEntry = CHANGELOG[0];
