import { requireRole } from "@/lib/auth/current-user";
import { getCitizenStats } from "@/lib/data/complaints";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Profile | SmartGrievance" };

export default async function CitizenProfilePage() {
  const user = await requireRole(["CITIZEN"]);
  const stats = await getCitizenStats(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <section className="rounded-xl border bg-background p-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{user.name}</dd></div>
          <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{user.email}</dd></div>
          <div><dt className="text-muted-foreground">Account type</dt><dd className="font-medium">Citizen</dd></div>
          <div><dt className="text-muted-foreground">Member since</dt><dd className="font-medium">{formatDate(user.createdAt)}</dd></div>
        </dl>
        <p className="mt-5 text-sm text-muted-foreground">
          To change your name, email or password, click your profile picture at the top right and choose{" "}
          <strong>Manage account</strong>.
        </p>
      </section>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">Your complaints</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div><dt className="text-muted-foreground">Total</dt><dd className="text-2xl font-bold">{stats.total}</dd></div>
          <div><dt className="text-muted-foreground">Pending</dt><dd className="text-2xl font-bold">{stats.pending}</dd></div>
          <div><dt className="text-muted-foreground">In progress</dt><dd className="text-2xl font-bold">{stats.inProgress}</dd></div>
          <div><dt className="text-muted-foreground">Resolved</dt><dd className="text-2xl font-bold">{stats.resolved}</dd></div>
        </dl>
      </section>
    </div>
  );
}
