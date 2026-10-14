import { redirect } from "next/navigation";

// Clerk handles password reset inside the login flow ("Forgot password?" link).
export default function ForgotPasswordPage() {
  redirect("/login");
}
