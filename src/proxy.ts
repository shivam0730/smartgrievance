import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Pages anyone can open without logging in
const isPublicRoute = createRouteMatcher([
  "/",
  "/how-it-works",
  "/features",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/help",
  "/login(.*)",
  "/register(.*)",
  "/forgot-password(.*)",
  "/unauthorized",
]);

// First security layer: "is the user logged in?"
// Role checks happen in layouts and API helpers (src/lib/auth/current-user.ts),
// because roles live in our database.
export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId } = await auth();
  if (userId) return;

  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect_url", req.url);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
