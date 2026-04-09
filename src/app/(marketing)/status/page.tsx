import { CheckCircle2, Bell } from "lucide-react";

const services = [
  { name: "Web Application", status: "Operational" },
  { name: "API", status: "Operational" },
  { name: "AI Processing", status: "Operational" },
  { name: "WhatsApp Channel", status: "Operational" },
  { name: "Instagram Channel", status: "Operational" },
  { name: "SMS Channel", status: "Operational" },
  { name: "Voice Channel", status: "Operational" },
  { name: "Web Chat", status: "Operational" },
  { name: "HubSpot Sync", status: "Operational" },
  { name: "Stripe Payments", status: "Operational" },
];

const incidents = [
  {
    date: "April 5, 2026",
    title: "Resolved: Intermittent delays in Instagram message processing",
    duration: "2 hours",
    description:
      "Instagram webhook delivery experienced intermittent delays due to upstream Meta API issues. All messages were queued and delivered once connectivity was restored.",
  },
  {
    date: "March 22, 2026",
    title: "Resolved: Scheduled maintenance — database migration",
    duration: "30 minutes",
    description:
      "Planned maintenance window for database schema migration. The API returned read-only mode during this period. No data was lost.",
  },
  {
    date: "March 10, 2026",
    title: "Resolved: Brief Twilio API outage affecting SMS delivery",
    duration: "45 minutes",
    description:
      "Twilio experienced a regional outage impacting SMS delivery in the AU region. Messages were retried and delivered once the upstream service recovered.",
  },
];

export default function StatusPage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">System Status</h1>
        <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-6 py-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="text-green-800 font-semibold">
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Service Status */}
      <div className="max-w-3xl mx-auto px-4 mb-16">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {services.map((service, index) => (
            <div
              key={service.name}
              className={`flex items-center justify-between px-6 py-4 ${
                index < services.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <span className="font-medium text-gray-900">{service.name}</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-sm text-green-700 font-medium">
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uptime */}
      <div className="max-w-3xl mx-auto px-4 mb-16">
        <div className="bg-gray-50 rounded-2xl p-8 text-center border">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            99.97%
          </div>
          <p className="text-gray-600">Uptime over the last 90 days</p>
        </div>
      </div>

      {/* Incident History */}
      <div className="max-w-3xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold mb-8">Incident History</h2>
        <div className="space-y-6">
          {incidents.map((incident) => (
            <div
              key={incident.date}
              className="bg-white border border-gray-200 rounded-2xl p-6"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      {incident.date}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Duration: {incident.duration}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {incident.title}
                  </h3>
                  <p className="text-sm text-gray-600">{incident.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribe */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-gray-50 rounded-2xl p-8 text-center border">
          <Bell className="w-8 h-8 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Subscribe to Updates</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get notified about scheduled maintenance and service incidents via
            email.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
