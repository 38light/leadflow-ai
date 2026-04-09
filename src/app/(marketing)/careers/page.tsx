import Link from "next/link";
import {
  Globe,
  Rocket,
  BookOpen,
  Heart,
  MapPin,
  Clock,
  Building2,
  ArrowRight,
  Mail,
} from "lucide-react";

const perks = [
  {
    icon: Globe,
    title: "Remote-First",
    description: "Work from anywhere in Australia",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Rocket,
    title: "Ownership",
    description: "Ship features that impact thousands of businesses",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: BookOpen,
    title: "Learning",
    description: "AI moves fast — we invest in your growth",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: Heart,
    title: "Balance",
    description: "Flexible hours, unlimited leave, no burnout culture",
    color: "bg-pink-100 text-pink-600",
  },
];

const positions = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Next.js, TypeScript, Supabase, AI integrations",
    departmentColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Claude API, RAG, embeddings, prompt engineering",
    departmentColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Growth Marketing Lead",
    department: "Marketing",
    location: "Sydney / Remote",
    type: "Full-time",
    description:
      "Content, SEO, product-led growth",
    departmentColor: "bg-green-100 text-green-700",
  },
  {
    title: "Customer Success Manager",
    department: "Support",
    location: "Sydney",
    type: "Full-time",
    description:
      "Onboarding, training, retention",
    departmentColor: "bg-amber-100 text-amber-700",
  },
];

export default function CareersPage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Join us in building the future of{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            service business automation
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          We&apos;re a small team with a big mission.
        </p>
      </div>

      {/* Culture / Perks */}
      <div className="bg-gray-50 py-20 mb-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why you&apos;ll love working here
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {perks.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  className="bg-white rounded-2xl p-8 border text-center"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${perk.color} flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{perk.title}</h3>
                  <p className="text-gray-600 text-sm">{perk.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="max-w-4xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
        <div className="space-y-4">
          {positions.map((position) => (
            <div
              key={position.title}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{position.title}</h3>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${position.departmentColor}`}
                    >
                      {position.department}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {position.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {position.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {position.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {position.department}
                    </span>
                  </div>
                </div>
                <Link
                  href={`mailto:careers@leadflow.ai?subject=Application: ${position.title}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all text-sm shrink-0"
                >
                  Apply
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Application */}
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-2xl font-bold mb-4">
          Don&apos;t see your role?
        </h2>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
          We&apos;re always looking for talented people who share our mission.
          Send us your resume and tell us how you&apos;d contribute.
        </p>
        <Link
          href="mailto:careers@leadflow.ai?subject=General Application"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Mail className="w-5 h-5" />
          Send General Application
        </Link>
      </div>
    </div>
  );
}
