export default function IntegrationsSettingsPage() {
  const integrations = [
    { name: "HubSpot", description: "CRM sync for contacts and deals", status: "Not connected" },
    { name: "Google Calendar", description: "Real-time availability and booking", status: "Not connected" },
    { name: "Outlook Calendar", description: "Real-time availability and booking", status: "Not connected" },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div key={integration.name} className="bg-white border rounded-lg p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{integration.name}</h3>
              <p className="text-sm text-gray-500">{integration.description}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {integration.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
