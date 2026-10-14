import { z } from "zod";

export const CATEGORY_VALUES = [
  "POTHOLE",
  "GARBAGE",
  "DRAINAGE",
  "STREETLIGHT",
  "WATER_LEAKAGE",
  "ROAD_DAMAGE",
  "ELECTRICITY",
  "OTHER",
] as const;

export const STATUS_VALUES = [
  "SUBMITTED",
  "AI_ANALYSIS",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "NEEDS_INFORMATION",
  "DUPLICATE",
  "REJECTED",
  "CANCELLED",
] as const;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGES = 3;

// Returned by POST /api/uploads and sent back when the complaint is submitted.
// "proof" is a server-made signature, so these details cannot be forged by the browser.
export const uploadedImageSchema = z.object({
  imageUrl: z.string().url().max(500),
  storageKey: z.string().min(1).max(300),
  fileName: z.string().min(1).max(200),
  mimeType: z.enum(IMAGE_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(5_000_000),
  imageHash: z.string().length(64),
  proof: z.string().length(64),
});
export type UploadedImage = z.infer<typeof uploadedImageSchema>;

export const createComplaintSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(20, "Please describe the issue in at least 20 characters")
    .max(2000, "Description is too long"),
  category: z.enum(CATEGORY_VALUES).optional(),
  address: z.string().trim().min(5, "Please enter the address or a landmark").max(300, "Address is too long"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  images: z.array(uploadedImageSchema).max(MAX_IMAGES, `You can upload up to ${MAX_IMAGES} photos`).optional(),
});
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export const complaintActionSchema = z.object({
  action: z.literal("CANCEL"),
  remarks: z.string().trim().max(500).optional(),
});

export const listQuerySchema = z.object({
  status: z.enum(STATUS_VALUES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
