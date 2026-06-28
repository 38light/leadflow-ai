import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/widget/[businessId]
 *
 * Returns a self-contained JavaScript snippet that businesses paste on their website:
 *   <script src="https://yourapp.com/api/widget/YOUR_BUSINESS_ID"></script>
 *
 * The script injects a floating chat button + iframe pointing to /chat-widget/[businessId].
 * All CORS headers are set so it loads from any domain.
 *
 * Security: no innerHTML used — all DOM nodes built with createElement/setAttribute/textContent.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, business_name")
    .eq("id", businessId)
    .single();

  if (!profile) {
    return new NextResponse("// Business not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004";
  // widgetUrl is server-controlled (not user input), safe to embed
  const widgetUrl = `${appUrl}/chat-widget/${encodeURIComponent(businessId)}`;

  const script = `
(function() {
  if (window.__LeadFlowWidget) return;
  window.__LeadFlowWidget = true;

  var WIDGET_URL = '${widgetUrl}';
  var isOpen = false;

  /* ---- Styles ---- */
  var style = document.createElement('style');
  style.textContent = [
    '#lf-chat-btn{position:fixed;bottom:24px;right:24px;width:60px;height:60px;',
    'border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);',
    'border:none;cursor:pointer;box-shadow:0 4px 20px rgba(79,70,229,.5);',
    'display:flex;align-items:center;justify-content:center;z-index:2147483646;',
    'transition:transform .2s,box-shadow .2s;}',
    '#lf-chat-btn:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(79,70,229,.6);}',
    '#lf-chat-frame{position:fixed;bottom:100px;right:24px;width:380px;height:560px;',
    'border:none;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);',
    'z-index:2147483645;display:none;}',
    '#lf-chat-frame.lf-open{display:block;}',
    '@media(max-width:480px){#lf-chat-frame{width:100vw;height:100dvh;bottom:0;right:0;border-radius:0;}}'
  ].join('');
  document.head.appendChild(style);

  /* ---- SVG helpers (no innerHTML) ---- */
  var NS = 'http://www.w3.org/2000/svg';

  function makeSvg(w, h, viewBox) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('width', w);
    s.setAttribute('height', h);
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'white');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    return s;
  }

  function chatIcon() {
    var s = makeSvg('28', '28', '0 0 24 24');
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z');
    s.appendChild(p);
    return s;
  }

  function closeIcon() {
    var s = makeSvg('24', '24', '0 0 24 24');
    s.setAttribute('stroke-width', '2.5');
    var l1 = document.createElementNS(NS, 'line');
    l1.setAttribute('x1','18'); l1.setAttribute('y1','6');
    l1.setAttribute('x2','6');  l1.setAttribute('y2','18');
    var l2 = document.createElementNS(NS, 'line');
    l2.setAttribute('x1','6');  l2.setAttribute('y1','6');
    l2.setAttribute('x2','18'); l2.setAttribute('y2','18');
    s.appendChild(l1); s.appendChild(l2);
    return s;
  }

  /* ---- Button ---- */
  var btn = document.createElement('button');
  btn.id = 'lf-chat-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.appendChild(chatIcon());

  /* ---- iFrame ---- */
  var iframe = document.createElement('iframe');
  iframe.id = 'lf-chat-frame';
  iframe.setAttribute('src', WIDGET_URL);
  iframe.setAttribute('title', 'Chat support');
  iframe.setAttribute('allow', 'microphone');

  document.body.appendChild(iframe);
  document.body.appendChild(btn);

  function openWidget() {
    isOpen = true;
    iframe.classList.add('lf-open');
    btn.setAttribute('aria-label', 'Close chat');
    while (btn.firstChild) btn.removeChild(btn.firstChild);
    btn.appendChild(closeIcon());
  }

  function closeWidget() {
    isOpen = false;
    iframe.classList.remove('lf-open');
    btn.setAttribute('aria-label', 'Open chat');
    while (btn.firstChild) btn.removeChild(btn.firstChild);
    btn.appendChild(chatIcon());
  }

  btn.addEventListener('click', function() { isOpen ? closeWidget() : openWidget(); });

  window.addEventListener('message', function(e) {
    if (e.data === 'lf:close') closeWidget();
    if (e.data === 'lf:open')  openWidget();
  });
})();
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
