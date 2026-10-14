import type { Metadata } from "next";
import { SimplePage } from "@/components/landing/simple-page";

export const metadata: Metadata = { title: "Terms of Use | SmartGrievance" };

export default function TermsPage() {
  return (
    <SimplePage title="Terms of Use">
      <p>This is placeholder text for the demo version of SmartGrievance. Replace it with real content before any production use.</p>
    </SimplePage>
  );
}
