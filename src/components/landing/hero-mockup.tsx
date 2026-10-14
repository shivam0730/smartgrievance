import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKERS = [
  { x: "20%", y: "28%", label: "Critical", dot: "bg-red-600" },
  { x: "60%", y: "20%", label: "High", dot: "bg-orange-500" },
  { x: "72%", y: "60%", label: "Medium", dot: "bg-yellow-500" },
  { x: "30%", y: "70%", label: "Low", dot: "bg-green-600" },
  { x: "46%", y: "46%", label: "High", dot: "bg-orange-500" },
];

const STEPS = [
  { label: "Submitted", done: true },
  { label: "AI analyzed", done: true },
  { label: "Assigned", done: true },
  { label: "In progress", done: false },
  { label: "Resolved", done: false },
];

// Decorative dashboard illustration (demo data only)
export function HeroMockup() {
  return (
    <div
      role="img"
      aria-label="Illustration of the SmartGrievance dashboard showing a complaint map, AI analysis and resolution progress"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      <div aria-hidden="true">
        <div className="flex items-center justify-between border-b bg-blue-950 px-4 py-2.5 text-white">
          <span className="text-sm font-semibold">Complaint Overview</span>
          <span className="rounded bg-white/15 px-2 py-0.5 text-xs">Live demo</span>
        </div>

        {/* Map */}
        <div className="relative h-44 overflow-hidden bg-slate-100">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute left-0 right-0 top-[40%] h-3 -rotate-6 bg-white" />
          <div className="absolute bottom-0 top-0 left-[55%] w-3 rotate-6 bg-white" />
          {MARKERS.map((m, i) => (
            <div
              key={i}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1"
              style={{ left: m.x, top: m.y }}
            >
              <span className={cn("size-3.5 rounded-full ring-2 ring-white", m.dot)} />
              <span className="rounded bg-white/95 px-1 text-[10px] font-medium text-slate-700 shadow-sm">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Complaint panel */}
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">SG-2026-000123</p>
            <p className="font-semibold text-slate-900">Large pothole on main road</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Category</dt><dd className="font-medium">Pothole (94%)</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Severity</dt><dd className="font-medium">High</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Duplicate</dt><dd className="font-medium">No strong match</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Suspicion</dt><dd className="font-medium">Low</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Department</dt><dd className="font-medium">Road Dept.</dd></div>
            </dl>
          </div>
          <ol className="space-y-2 text-sm">
            {STEPS.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                {s.done ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-green-600 text-white">
                    <Check className="size-3" />
                  </span>
                ) : (
                  <Circle className="size-5 text-slate-300" />
                )}
                <span className={s.done ? "font-medium text-slate-900" : "text-slate-500"}>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
