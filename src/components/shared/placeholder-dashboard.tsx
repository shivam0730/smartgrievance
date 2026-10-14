import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";

// Temporary page content. Replaced by real dashboards in later steps.
export async function PlaceholderDashboard({ portal }: { portal: string }) {
  const user = await getCurrentUser();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome, {user?.name}</CardTitle>
        <CardDescription>{portal} dashboard (placeholder)</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Signed in as {user?.email} with role <strong>{user?.role}</strong>.
      </CardContent>
    </Card>
  );
}
