import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { SimplePage } from "@/components/landing/simple-page";

export const metadata: Metadata = { title: "Contact | SmartGrievance" };

const CONTACTS = [
  { icon: Mail, label: "Email", value: "support@smartgrievance.demo" },
  { icon: Phone, label: "Helpline", value: "1800-000-0000" },
  { icon: MapPin, label: "Office", value: "Grievance Cell, Municipal Office (demo address)" },
];

export default function ContactPage() {
  return (
    <SimplePage title="Contact">
      <p>Reach out for help with your account or a complaint. These are demo contact details.</p>
      <ul className="grid gap-4 sm:grid-cols-3">
        {CONTACTS.map(({ icon: Icon, label, value }) => (
          <li key={label} className="rounded-xl border border-slate-200 p-5">
            <Icon className="size-5 text-blue-800" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-500">{label}</p>
            <p className="font-medium text-slate-900">{value}</p>
          </li>
        ))}
      </ul>
    </SimplePage>
  );
}
