import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shared button styles for the public website (government-blue theme)
export const primaryCta = cn(buttonVariants(), "h-11 gap-2 bg-blue-800 px-6 text-white hover:bg-blue-900");
export const outlineCta = cn(
  buttonVariants({ variant: "outline" }),
  "h-11 gap-2 border-blue-800 bg-white px-6 text-blue-900 hover:bg-blue-50",
);
export const lightCta = cn(buttonVariants(), "h-11 gap-2 bg-white px-6 text-blue-900 hover:bg-blue-50");
