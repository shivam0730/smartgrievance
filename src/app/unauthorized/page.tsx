import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, homeForRole } from "@/lib/auth/current-user";

const MESSAGES: Record<string, string> = {
  inactive: "Your account is inactive. Please contact the administrator.",
  "no-account": "We could not set up your account. Please make sure your email is verified, then sign in again.",
};

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const user = await getCurrentUser();
  const message = (reason && MESSAGES[reason]) || "You do not have permission to open this page.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          {user && user.status === "ACTIVE" && (
            <Link href={homeForRole(user.role)} className={buttonVariants()}>
              Go to my dashboard
            </Link>
          )}
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Home
          </Link>
          <SignOutButton>
            <Button variant="ghost">Sign out</Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </main>
  );
}
