import { Mail, MessageSquare, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";

const contactMethods = [
  {
    icon: Mail,
    title: "Email us",
    description: "Our team will respond within 24 hours.",
    value: "hello@leadflow.ai",
    href: "mailto:hello@leadflow.ai",
  },
  {
    icon: MessageSquare,
    title: "Live chat",
    description: "Chat with our team in real-time.",
    value: "Start a conversation",
    href: "#",
  },
  {
    icon: MapPin,
    title: "Office",
    description: "Come visit our Sydney office.",
    value: "Sydney, NSW, Australia",
    href: "#",
  },
  {
    icon: Clock,
    title: "Support hours",
    description: "We're here when you need us.",
    value: "Mon-Fri, 9am-6pm AEST",
    href: "#",
  },
];

export default function ContactPage() {
  return (
    <div className="py-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in touch</h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Have questions about LeadFlow AI? We&apos;d love to hear from you.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {contactMethods.map((method) => {
            const Icon = method.icon;
            return (
              <a
                key={method.title}
                href={method.href}
                className="bg-white border rounded-2xl p-8 hover:shadow-lg transition-shadow block"
              >
                <Icon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-lg mb-1">{method.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{method.description}</p>
                <p className="text-blue-600 font-medium">{method.value}</p>
              </a>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
