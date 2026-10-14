import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/site";
import { lightCta } from "@/lib/cta";

export function CtaSection() {
  return (
    <section className="bg-blue-800 py-16 text-white">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">See a civic problem? Report it in minutes.</h2>
        <div className="mt-8">
          <Link href={ROUTES.report} className={lightCta}>
            Report an Issue <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
