import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ROUTES } from "@/constants/site";
import { outlineCta, primaryCta } from "@/lib/cta";
import { HeroMockup } from "./hero-mockup";

export function Hero() {
  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900">
            <Sparkles className="size-4" aria-hidden="true" />
            AI-assisted, human-reviewed
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Report. Track. Resolve.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            AI-powered grievance management for faster, smarter and more transparent civic issue resolution.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={ROUTES.report} className={primaryCta}>
              Report an Issue <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={ROUTES.track} className={outlineCta}>
              Track Complaint
            </Link>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>
  );
}
