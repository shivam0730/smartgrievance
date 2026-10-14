import { Activity, Copy, Gauge, MapPinned, Route, ScanSearch, ShieldAlert, Tags } from "lucide-react";
import { SectionHeading } from "./section-heading";

const FEATURES = [
  { icon: Tags, title: "AI Complaint Classification", text: "Automatically identifies the complaint category." },
  { icon: ScanSearch, title: "Image Intelligence", text: "Analyzes uploaded images for civic issues." },
  { icon: Copy, title: "Duplicate Detection", text: "Finds potentially repeated complaints." },
  { icon: ShieldAlert, title: "Suspicion Detection", text: "Flags unusual or potentially manipulated submissions for human review." },
  { icon: Route, title: "Smart Routing", text: "Recommends the responsible department." },
  { icon: Gauge, title: "Priority Prediction", text: "Highlights urgent complaints." },
  { icon: Activity, title: "Live Tracking", text: "Citizens can track complaint progress." },
  { icon: MapPinned, title: "Geographic Intelligence", text: "Administrators can identify complaint hotspots." },
];

export function Features() {
  return (
    <section id="features" className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Features"
          title="Built for citizens, officers and administrators"
          description="Every AI feature supports a human decision. Nothing is rejected automatically."
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border border-slate-200 bg-white p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
