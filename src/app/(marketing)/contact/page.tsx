import { Mail, MessageSquare, MapPin, Clock } from "lucide-react";

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
          <div className="bg-white border rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
            <form className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sarah"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mitchell"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sarah@example.com"
                />
              </div>
              <div>
                <label htmlFor="business" className="block text-sm font-medium text-gray-700 mb-1">
                  Business type
                </label>
                <select
                  id="business"
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select your industry</option>
                  <option value="celebrant">Marriage Celebrant</option>
                  <option value="photography">Photography</option>
                  <option value="events">Event Planning</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tell us about your business and how we can help..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
