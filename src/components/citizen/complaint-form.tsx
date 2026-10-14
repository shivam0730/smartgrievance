"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/citizen/image-uploader";
import { LocationMap } from "@/components/citizen/location-map-dynamic";
import { CATEGORY_VALUES, createComplaintSchema, type UploadedImage } from "@/lib/validations/complaint";
import { CATEGORY_LABEL } from "@/lib/format";

// The category <select> uses "" for "let AI decide". Photos are tracked separately (see uploads below).
const formSchema = createComplaintSchema.omit({ images: true }).extend({
  category: z.union([z.enum(CATEGORY_VALUES), z.literal("")]).optional(),
});
type FormValues = z.infer<typeof formSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="mt-1 text-sm text-red-700">{message}</p>;
}

// Optional: turns a map pin into a readable address (OpenStreetMap Nominatim, light use only)
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.display_name === "string" ? data.display_name.slice(0, 300) : null;
  } catch {
    return null;
  }
}

export function ComplaintForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", category: "", address: "" },
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const hasLocation = typeof latitude === "number" && typeof longitude === "number";

  async function setLocation(lat: number, lng: number) {
    setValue("latitude", lat, { shouldValidate: true });
    setValue("longitude", lng, { shouldValidate: true });
    if (!getValues("address")?.trim()) {
      const address = await reverseGeocode(lat, lng);
      if (address && !getValues("address")?.trim()) setValue("address", address, { shouldValidate: true });
    }
  }

  function useCurrentLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void setLocation(Number(pos.coords.latitude.toFixed(6)), Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      () => {
        setGeoError("Could not get your location. Allow location access, or click on the map instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, category: values.category || undefined, images: uploads }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setServerError(data?.issues?.[0]?.message ?? data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(`/citizen/complaints/${data.id}`);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 rounded-xl border bg-background p-5 md:p-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" className="mt-1.5" placeholder="e.g. Large pothole near the market" {...register("title")} />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          className="mt-1.5"
          placeholder="Describe the problem, how long it has been there and any danger it causes."
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div>
        <Label htmlFor="category">Category (optional)</Label>
        <select
          id="category"
          className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
          {...register("category")}
        >
          <option value="">Let AI detect the category</option>
          {CATEGORY_VALUES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Photos (optional, but helps verification)</legend>
        <div className="mt-2">
          <ImageUploader onChange={setUploads} onBusyChange={setUploading} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Location</legend>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={useCurrentLocation} disabled={locating}>
            <LocateFixed className="mr-2 size-4" aria-hidden="true" />
            {locating ? "Getting location..." : "Use current location"}
          </Button>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {hasLocation ? `Pin set at ${latitude}, ${longitude}` : "or click on the map to drop a pin"}
          </span>
        </div>
        {geoError && <p role="alert" className="text-sm text-red-700">{geoError}</p>}

        <LocationMap latitude={latitude} longitude={longitude} onPick={(lat, lng) => void setLocation(lat, lng)} />
        {(errors.latitude || errors.longitude) && !hasLocation && (
          <p role="alert" className="text-sm text-red-700">
            Location is required. Use your current location or click on the map.
          </p>
        )}

        <div>
          <Label htmlFor="address">Address or landmark</Label>
          <Input id="address" className="mt-1.5" placeholder="e.g. Near City Mall, Ward 12" {...register("address")} />
          <FieldError message={errors.address?.message} />
        </div>
      </fieldset>

      {serverError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || uploading}
        className="h-11 bg-blue-800 px-6 text-white hover:bg-blue-900"
      >
        {isSubmitting ? "Submitting..." : uploading ? "Waiting for photos to upload..." : "Submit complaint"}
      </Button>
    </form>
  );
}
