import { BadgeCheck, Brain, UserCheck } from "lucide-react";

export function AITransparency() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">AI transparency</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            AI does not make the final rejection decision
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            AI helps officers work faster, but people stay in charge. Every AI suggestion can be reviewed and overridden,
            and every override is recorded.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
            <div className="flex items-center gap-2 font-semibold text-indigo-900">
              <Brain className="size-5" aria-hidden="true" /> AI provides
            </div>
            <ul className="mt-3 space-y-2 text-slate-700">
              <li>Recommendations</li>
              <li>Confidence scores</li>
              <li>Similarity scores</li>
              <li>Reasons for every decision</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center gap-2 font-semibold text-blue-900">
              <UserCheck className="size-5" aria-hidden="true" /> Human officers
            </div>
            <ul className="mt-3 space-y-2 text-slate-700">
              <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-blue-800" aria-hidden="true" /> Make the final decisions</li>
              <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-blue-800" aria-hidden="true" /> Can override any AI result</li>
              <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-blue-800" aria-hidden="true" /> Review flagged complaints</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
