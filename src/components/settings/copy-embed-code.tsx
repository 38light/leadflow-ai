"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyEmbedCodeProps {
  code: string;
}

export function CopyEmbedCode({ code }: CopyEmbedCodeProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-xl border border-gray-200 bg-gray-950 overflow-hidden">
      <pre className="px-5 py-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-400" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
