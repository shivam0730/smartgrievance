import { auth } from "@clerk/nextjs/server";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return <NavbarClient isSignedIn={isSignedIn} />;
}