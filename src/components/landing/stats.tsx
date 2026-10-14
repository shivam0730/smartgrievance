const STATS = [
  { value: "10,000+", label: "Complaints Processed" },
  { value: "92%", label: "AI Classification Accuracy" },
  { value: "85%", label: "Issues Routed Automatically" },
  { value: "78%", label: "Potential Duplicates Identified" },
];

export function Stats() {
  return (
    <section aria-label="Platform statistics" className="bg-blue-950 py-14 text-white">
      <div className="mx-auto max-w-7xl px-4">
        <dl className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="order-2 mt-1 text-blue-100">{s.label}</dt>
              <dd className="text-4xl font-bold">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-center text-sm text-blue-200">
          Demo statistics shown for illustration. They are not measured results.
        </p>
      </div>
    </section>
  );
}
