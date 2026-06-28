import { FunnelClient } from "./funnel-client";

export const metadata = {
  title: "Conversion Funnel | Analytics",
  description:
    "Track how leads progress through pipeline stages and where they drop off.",
};

export default function FunnelPage() {
  return <FunnelClient />;
}
