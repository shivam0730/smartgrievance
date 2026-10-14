import { ComplaintForm } from "@/components/citizen/complaint-form";

export const metadata = { title: "Report an Issue | SmartGrievance" };

export default function NewComplaintPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Report an Issue</h1>
        <p className="text-muted-foreground">Tell us what is wrong and where. AI will help route it to the right department.</p>
      </div>
      <ComplaintForm />
    </div>
  );
}
