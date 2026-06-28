/**
 * Send a Slack notification via an incoming webhook URL.
 * Non-blocking pattern — callers should use `void sendSlackNotification(...)`.
 * Never throws — returns true on 2xx, false on any failure (timeout, network, non-2xx).
 *
 * @param webhookUrl - The Slack incoming webhook URL (https://hooks.slack.com/...)
 * @param message - { text, blocks? } payload
 */
export async function sendSlackNotification(
  webhookUrl: string,
  message: { text: string; blocks?: unknown[] }
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
