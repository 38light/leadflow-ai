"use client";

export function NewsletterForm() {
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-email"
        type="email"
        placeholder="Enter your email"
        required
        className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Subscribe
      </button>
    </form>
  );
}
