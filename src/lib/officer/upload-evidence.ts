// "use server";

// import { uploadToCloudinary } from "@/lib/uploads"; // ← swap import after we confirm name

// export type EvidenceUploadResult =
//   | {
//       ok: true;
//       items: {
//         imageUrl: string;
//         storageKey: string;
//         fileName: string;
//         mimeType: string;
//         sizeBytes?: number;
//       }[];
//     }
//   | { ok: false; error: string };

// export async function uploadResolutionEvidence(
//   files: File[],
// ): Promise<EvidenceUploadResult> {
//   if (files.length === 0) return { ok: true, items: [] };
//   if (files.length > 5) return { ok: false, error: "Maximum 5 evidence photos" };

//   const results: {
//     imageUrl: string;
//     storageKey: string;
//     fileName: string;
//     mimeType: string;
//     sizeBytes?: number;
//   }[] = [];

//   for (const file of files) {
//     if (!file.type.startsWith("image/")) {
//       return { ok: false, error: `Not an image: ${file.name}` };
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       return { ok: false, error: `${file.name} exceeds 5 MB` };
//     }

//     try {
//       const uploaded = await uploadToCloudinary(file, "smartgrievance/resolutions");
//       results.push({
//         imageUrl: uploaded.url,
//         storageKey: uploaded.publicId,
//         fileName: file.name,
//         mimeType: file.type,
//         sizeBytes: file.size,
//       });
//     } catch (e) {
//       return {
//         ok: false,
//         error: `Upload failed for ${file.name}: ${(e as Error).message}`,
//       };
//     }
//   }

//   return { ok: true, items: results };
// }