import { createHash } from "node:crypto";
import type { UploadApiResponse } from "cloudinary";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/current-user";
import { getCloudinary } from "@/lib/cloudinary";
import {
  MAX_UPLOAD_BYTES,
  detectImageMime,
  signUpload,
  uploadFolder,
  resolutionFolder,
} from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Determine intended purpose from the URL (?purpose=resolution)
  const url = new URL(req.url);
  const purpose = url.searchParams.get("purpose") === "resolution" ? "resolution" : "complaint";

  // Citizens can upload complaint photos.
  // Officers can ONLY upload resolution evidence.
  const allowedRoles = purpose === "resolution" ? ["OFFICER", "CITIZEN"] : ["CITIZEN", "OFFICER"];
  const a = await authorizeApi(allowedRoles as ("CITIZEN" | "OFFICER")[]);
  if ("error" in a) return a.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  if (file.size === 0)
    return NextResponse.json({ error: "The file is empty" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES)
    return NextResponse.json({ error: "Image is too large (max 4 MB)" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImageMime(buffer);
  if (!mimeType)
    return NextResponse.json(
      { error: "Only JPG, PNG or WEBP images are allowed" },
      { status: 415 },
    );
  const imageHash = createHash("sha256").update(buffer).digest("hex");

  let cloudinary;
  try {
    cloudinary = getCloudinary();
  } catch (e) {
    console.error("[uploads] storage not configured:", e);
    return NextResponse.json(
      { error: "Image storage is not configured" },
      { status: 500 },
    );
  }

  const folder =
    purpose === "resolution"
      ? resolutionFolder(a.user.id)
      : uploadFolder(a.user.id);

  let result: UploadApiResponse;
  try {
    result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder, resource_type: "image", overwrite: false },
          (err, res) => {
            if (err || !res) reject(err ?? new Error("Upload failed"));
            else resolve(res);
          },
        )
        .end(buffer);
    });
  } catch (e) {
    console.error("[uploads] cloudinary upload failed:", e);
    return NextResponse.json(
      { error: "Could not upload the image. Please try again." },
      { status: 502 },
    );
  }

  const meta = {
    imageUrl: result.secure_url,
    storageKey: result.public_id,
    fileName:
      file.name.replace(/[^\w.\- ]/g, "_").slice(0, 100) || "photo.jpg",
    mimeType,
    sizeBytes: file.size,
    imageHash,
  };
  return NextResponse.json(
    { ...meta, proof: signUpload(a.user.id, meta) },
    { status: 201 },
  );
}