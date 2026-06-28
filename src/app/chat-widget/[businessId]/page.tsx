import { ChatWidget } from "@/components/chat-widget/chat-widget";

interface ChatWidgetPageProps {
  params: Promise<{ businessId: string }>;
}

export default async function ChatWidgetPage({ params }: ChatWidgetPageProps) {
  const { businessId } = await params;
  return <ChatWidget businessId={businessId} />;
}

export const metadata = {
  robots: "noindex",
};
