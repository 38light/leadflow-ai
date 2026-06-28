import { DemoChat } from "@/components/marketing/demo-chat";
import { SectionHeroDark } from "@/components/marketing";

export const metadata = {
  title: "Try the AI — LeadFlow",
  description: "Roleplay as a lead. Real Claude responds in-context as the business AI agent.",
};

export default function DemoPage() {
  return (
    <>
      <SectionHeroDark
        eyebrow="Live Demo"
        title={
          <>
            Talk to the AI.{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Real Claude.
            </span>
          </>
        }
        subtitle="Pick a scenario, play the lead. The AI responds in-character as the business. Same engine that runs in production."
      />
      <section className="relative overflow-hidden bg-slate-950 pb-24 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 100%",
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
          <DemoChat />
        </div>
      </section>
    </>
  );
}
