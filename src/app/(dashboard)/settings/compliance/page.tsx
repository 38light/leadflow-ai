export default function ComplianceSettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Compliance</h1>

      <div className="space-y-4">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-2">AI Transparency</h2>
          <p className="text-sm text-gray-500">
            Your AI assistant identifies itself as an AI in the first message of every conversation,
            complying with Australian consumer protection guidelines.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-2">Opt-Out Handling</h2>
          <p className="text-sm text-gray-500">
            When a contact sends &quot;STOP&quot;, &quot;UNSUBSCRIBE&quot;, or similar keywords,
            the system automatically marks them as opted out and stops all outbound messages.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-2">Data Sovereignty</h2>
          <p className="text-sm text-gray-500">
            All data is stored in your Supabase instance. For Australian Privacy Principles (APP)
            compliance, ensure your Supabase project is hosted in the Sydney (ap-southeast-2) region.
          </p>
        </div>
      </div>
    </div>
  );
}
