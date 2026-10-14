import type { Metadata } from "next";
import { SimplePage } from "@/components/landing/simple-page";

export const metadata: Metadata = { title: "Privacy Policy | SmartGrievance" };

export default function PrivacyPage() {
  return (
    <SimplePage title="Privacy Policy">
      <p>This is placeholder text for the demo version of SmartGrievance. Replace it with real content before any production use.</p>
    </SimplePage>
  );
}
