import type { Metadata } from "next";
import { Categories } from "@/components/landing/categories";
import { CtaSection } from "@/components/landing/cta-section";
import { Features } from "@/components/landing/features";
import { PublicShell } from "@/components/landing/public-shell";

export const metadata: Metadata = { title: "Features | SmartGrievance" };

export default function FeaturesPage() {
  return (
    <PublicShell>
      <Features />
      <Categories />
      <CtaSection />
    </PublicShell>
  );
}
