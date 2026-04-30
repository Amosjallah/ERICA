export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Contact</h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        For support, partnerships, or press inquiries, reach the Ericah Marketplace team. We respond within 1–2
        business days.
      </p>
      <ul className="mt-8 space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
        <li>
          <span className="text-zinc-500">Email: </span>
          <a href="mailto:support@ericah.market" className="text-amber-700 hover:underline dark:text-amber-400">
            support@ericah.market
          </a>
        </li>
        <li>
          <span className="text-zinc-500">Phone: </span>
          +1 (555) 010-9000
        </li>
        <li>
          <span className="text-zinc-500">Hours: </span>
          Mon–Fri, 9:00–18:00 local time
        </li>
      </ul>
    </div>
  );
}
