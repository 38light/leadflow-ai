import { getUser } from "@/lib/auth/get-user";
import { CopyEmbedCode } from "@/components/settings/copy-embed-code";

export default async function WidgetSettingsPage() {
  const user = await getUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourapp.com";
  const embedSrc = `${appUrl}/api/widget/${user.id}`;
  const embedCode = `<script src="${embedSrc}" defer></script>`;
  const previewUrl = `${appUrl}/chat-widget/${user.id}`;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Web Chat Widget</h1>
        <p className="mt-1 text-sm text-gray-500">
          Embed a live AI-powered chat widget on any website. Visitors chat with your AI agent
          and are automatically added to your CRM.
        </p>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <span className="text-xs text-gray-400 ml-2">Widget Preview</span>
        </div>
        <iframe
          src={previewUrl}
          title="Chat Widget Preview"
          className="w-full h-[480px] border-0"
        />
      </div>

      {/* Embed code */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Embed Code</h2>
        <p className="text-sm text-gray-500">
          Paste this snippet before the closing{" "}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">&lt;/body&gt;</code>{" "}
          tag on any page where you want the chat to appear.
        </p>
        <CopyEmbedCode code={embedCode} />
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">How it works</h2>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">1</span>
            <span>Visitor clicks the chat button on your site</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">2</span>
            <span>Your AI agent (powered by Claude) responds instantly using your knowledge base</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">3</span>
            <span>The visitor is automatically created as a contact in your CRM</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">4</span>
            <span>If they book a meeting, their pipeline stage advances to <strong>Qualified</strong> automatically</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">5</span>
            <span>Complex queries escalate to your team with full context handed off</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
