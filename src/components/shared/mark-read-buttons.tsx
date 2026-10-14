"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BTN = "rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50";

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }
  return (
    <button type="button" onClick={onClick} disabled={loading} className={BTN}>
      {loading ? "Saving..." : "Mark as read"}
    </button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }
  return (
    <button type="button" onClick={onClick} disabled={loading} className={BTN}>
      {loading ? "Saving..." : "Mark all as read"}
    </button>
  );
}
