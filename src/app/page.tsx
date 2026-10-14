import type { Metadata } from "next";
import { AITransparency } from "@/components/landing/ai-transparency";
import { Categories } from "@/components/landing/categories";
import { CtaSection } from "@/components/landing/cta-section";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PublicShell } from "@/components/landing/public-shell";
import { Stats } from "@/components/landing/stats";
import { Testimonial } from "@/components/landing/testimonial";
import { TrustStrip } from "@/components/landing/trust-strip";

export const metadata: Metadata = {
  title: "SmartGrievance | Report. Track. Resolve.",
  description: "AI-powered grievance management for faster, smarter and more transparent civic issue resolution.",
};

export default function HomePage() {
  return (
    <PublicShell>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Features />
      <AITransparency />
      <Stats />
      <Categories />
      <Testimonial />
      <CtaSection />
    </PublicShell>
  );
}
