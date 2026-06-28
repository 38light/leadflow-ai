import { Header, Footer } from "@/components/marketing";
import { CommandPalette } from "@/components/marketing/command-palette";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <CommandPalette />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
