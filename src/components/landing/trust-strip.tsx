import { Activity, Building2, MapPin, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "AI-Assisted Verification" },
  { icon: MapPin, label: "Location-Based Routing" },
  { icon: Activity, label: "Transparent Tracking" },
  { icon: Building2, label: "Department Assignment" },
];

export function TrustStrip() {
  return (
    <section aria-label="Platform capabilities" className="border-b bg-white">
      <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="font-medium text-slate-800">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
