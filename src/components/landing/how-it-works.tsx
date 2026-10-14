import { Camera, CircleCheck, Route, Sparkles } from "lucide-react";
import { SectionHeading } from "./section-heading";

const STEPS = [
  { n: "01", icon: Camera, title: "Report", text: "Submit complaint with description, photo and location." },
  { n: "02", icon: Sparkles, title: "AI Analysis", text: "AI categorizes, analyzes severity and checks duplicates." },
  { n: "03", icon: Route, title: "Smart Routing", text: "Complaint is routed to the responsible department." },
  { n: "04", icon: CircleCheck, title: "Track & Resolve", text: "Citizen tracks progress until resolution." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading eyebrow="How it works" title="From report to resolution in four steps" />
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, icon: Icon, title, text }) => (
            <li key={n} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-800">{n}</span>
                <Icon className="size-6 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
