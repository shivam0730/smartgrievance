"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { resizeToJpeg } from "@/lib/image-resize";
import { MAX_IMAGES, type UploadedImage } from "@/lib/validations/complaint";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024; // before shrinking

type Item = {
  id: string;
  name: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
  uploaded?: UploadedImage;
};

function uploadFile(file: File, onProgress: (percent: number) => void): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data as UploadedImage);
        else reject(new Error(data.error ?? "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error. Please try again."));
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}

export function ImageUploader({
  onChange,
  onBusyChange,
}: {
  onChange: (images: UploadedImage[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  // Tell the form which photos are ready and whether any upload is still running
  useEffect(() => {
    onChange(items.flatMap((i) => (i.uploaded ? [i.uploaded] : [])));
    onBusyChange(items.some((i) => i.status === "uploading"));
  }, [items, onChange, onBusyChange]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = (id: string, changes: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));

  async function processFile(file: File) {
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.push(previewUrl);
    setItems((prev) => [...prev, { id, name: file.name, previewUrl, status: "uploading", progress: 0 }]);
    try {
      const small = await resizeToJpeg(file);
      const uploaded = await uploadFile(small, (progress) => patch(id, { progress }));
      patch(id, { status: "done", progress: 100, uploaded });
    } catch (e) {
      patch(id, { status: "error", error: e instanceof Error ? e.message : "Upload failed" });
    }
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setMessage(null);
    const files = Array.from(list);
    const used = items.filter((i) => i.status !== "error").length;
    const slots = MAX_IMAGES - used;
    if (slots <= 0) {
      setMessage(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    const problems: string[] = [];
    const valid = files.filter((f) => {
      if (!ACCEPTED.includes(f.type)) {
        problems.push(`${f.name}: only JPG, PNG or WEBP images are allowed.`);
        return false;
      }
      if (f.size > MAX_ORIGINAL_BYTES) {
        problems.push(`${f.name}: file is too large (max 15 MB).`);
        return false;
      }
      return true;
    });
    if (valid.length > slots) problems.push(`Only ${slots} more photo${slots === 1 ? "" : "s"} can be added.`);
    if (problems.length) setMessage(problems.join(" "));
    valid.slice(0, slots).forEach((f) => void processFile(f));
  }

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center ${
          dragging ? "border-blue-700 bg-blue-50" : "border-slate-300"
        }`}
      >
        <ImagePlus className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Drag and drop photos here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Choose or take photos
        </button>
        <p className="text-xs text-muted-foreground">JPG, PNG or WEBP. Up to {MAX_IMAGES} photos.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          aria-label="Upload photos"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // allow picking the same file again
          }}
        />
      </div>

      <p role="status" aria-live="polite" className="mt-2 text-sm text-red-700">
        {message}
      </p>

      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((i) => (
            <li key={i.id} className="relative overflow-hidden rounded-lg border bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.previewUrl} alt={`Preview of ${i.name}`} className="h-28 w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i.id)}
                aria-label={`Remove ${i.name}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <div className="p-2 text-xs">
                {i.status === "uploading" && (
                  <>
                    <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200">
                      <div className="h-full bg-blue-700 transition-all" style={{ width: `${i.progress}%` }} />
                    </div>
                    <p className="mt-1 text-muted-foreground">Uploading... {i.progress}%</p>
                  </>
                )}
                {i.status === "done" && <p className="font-medium text-green-700">Uploaded</p>}
                {i.status === "error" && <p className="text-red-700">{i.error}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
