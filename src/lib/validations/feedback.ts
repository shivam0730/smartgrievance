import { z } from "zod";

export const OUTCOME_VALUES = ["YES", "PARTIALLY", "NO"] as const;

export const feedbackSchema = z.object({
  complaintId: z.string().min(1),
  rating: z.number().int().min(1, "Please select a rating").max(5),
  outcome: z.enum(OUTCOME_VALUES),
  comment: z.string().trim().max(1000, "Comment is too long").optional(),
});

export const notificationsQuerySchema = z.object({
  filter: z.enum(["all", "unread", "read"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
});
