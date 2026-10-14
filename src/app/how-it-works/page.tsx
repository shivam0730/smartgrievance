import type { Metadata } from "next";
import { AITransparency } from "@/components/landing/ai-transparency";
import { CtaSection } from "@/components/landing/cta-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PublicShell } from "@/components/landing/public-shell";

export const metadata: Metadata = { title: "How It Works | SmartGrievance" };

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <HowItWorks />
      <AITransparency />
      <CtaSection />
    </PublicShell>
  );
}
