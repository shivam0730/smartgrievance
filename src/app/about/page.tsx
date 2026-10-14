import type { Metadata } from "next";
import { AITransparency } from "@/components/landing/ai-transparency";
import { SimplePage } from "@/components/landing/simple-page";

export const metadata: Metadata = { title: "About | SmartGrievance" };

export default function AboutPage() {
  return (
    <>
      <SimplePage title="About SmartGrievance">
        <p>
          SmartGrievance is a civic grievance platform where citizens report problems such as potholes, garbage,
          drainage and streetlight issues using a description, photos and location.
        </p>
        <p>
          AI helps classify each complaint, estimate its priority, suggest the responsible department and flag possible
          duplicates or unusual submissions. Human officers review these suggestions and make the final decisions,
          and every important action is recorded in an audit trail.
        </p>
        <p>The goal is simple: faster resolution, less manual sorting, and complete visibility for citizens.</p>
      </SimplePage>
      <AITransparency />
    </>
  );
}
