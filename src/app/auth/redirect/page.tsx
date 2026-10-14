import { redirect } from "next/navigation";
import { homeForRole, requireUser } from "@/lib/auth/current-user";

// After login/register Clerk sends everyone here; we forward by role.
export default async function AuthRedirectPage() {
  const user = await requireUser();
  redirect(homeForRole(user.role));
}
