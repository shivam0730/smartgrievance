import { CircleHelp, Construction, Droplets, Lightbulb, Trash2, TrafficCone, Waves, Zap } from "lucide-react";
import { SectionHeading } from "./section-heading";

const CATEGORIES = [
  { icon: Construction, label: "Potholes" },
  { icon: Trash2, label: "Garbage" },
  { icon: Waves, label: "Drainage" },
  { icon: Lightbulb, label: "Streetlights" },
  { icon: Droplets, label: "Water Leakage" },
  { icon: TrafficCone, label: "Road Damage" },
  { icon: Zap, label: "Electricity" },
  { icon: CircleHelp, label: "Other" },
];

export function Categories() {
  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading eyebrow="Categories" title="Issues you can report" />
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Icon className="size-8 text-blue-800" aria-hidden="true" />
              <span className="font-medium text-slate-800">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
