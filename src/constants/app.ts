export const APP_NAME = "LeadFlow AI";

export const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "qualified", label: "Qualified", color: "bg-purple-100 text-purple-800" },
  { value: "proposal", label: "Proposal", color: "bg-indigo-100 text-indigo-800" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-800" },
  { value: "won", label: "Won", color: "bg-green-100 text-green-800" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-800" },
] as const;

export const TEMPERATURES = [
  { value: "hot", label: "Hot", color: "bg-red-100 text-red-800" },
  { value: "warm", label: "Warm", color: "bg-orange-100 text-orange-800" },
  { value: "cold", label: "Cold", color: "bg-blue-100 text-blue-800" },
] as const;

export const CHANNEL_TYPES = [
  { value: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
  { value: "instagram", label: "Instagram", icon: "Instagram" },
  { value: "facebook", label: "Facebook", icon: "Facebook" },
  { value: "sms", label: "SMS", icon: "Smartphone" },
  { value: "voice", label: "Voice", icon: "Phone" },
  { value: "web_chat", label: "Web Chat", icon: "Globe" },
] as const;

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  conversations: "/conversations",
  contacts: "/contacts",
  customers: "/customers",
  knowledge: "/knowledge",
  channels: "/channels",
  analytics: "/analytics",
  pipelines: "/pipelines",
  settings: "/settings",
  pricing: "/pricing",
} as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/conversations",
  "/contacts",
  "/customers",
  "/knowledge",
  "/channels",
  "/analytics",
  "/pipelines",
  "/settings",
] as const;

export const AUTH_ROUTES = ["/login", "/register"] as const;
