"use client";

import { useState } from "react";
import { DownloadIcon } from "@/components/icons";
import { resolveShopImageSrc } from "@/lib/shop/image-url";

type SaveProductImageButtonProps = {
  imageUrl: string;
  filename: string;
};

function downloadFilename(filename: string, imageUrl: string): string {
  if (/\.(jpe?g|png|webp|gif)$/i.test(filename)) return filename;
  try {
    const pathname = new URL(imageUrl, window.location.origin).pathname;
    const ext = pathname.match(/\.(jpe?g|png|webp|gif)$/i)?.[1]?.toLowerCase();
    return ext ? `${filename}.${ext}` : `${filename}.jpg`;
  } catch {
    return `${filename}.jpg`;
  }
}

async function saveImage(imageUrl: string, filename: string) {
  const name = downloadFilename(filename, imageUrl);
  const resolved = resolveShopImageSrc(imageUrl);
  const href =
    resolved.startsWith("/api/shop/image") ||
    resolved.startsWith("/") ||
    resolved.startsWith(window.location.origin)
      ? resolved
      : `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(name)}`;

  const res = await fetch(href);
  if (!res.ok) throw new Error("Download failed");

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function SaveProductImageButton({
  imageUrl,
  filename,
}: SaveProductImageButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function handleSave() {
    if (status === "saving") return;
    setStatus("saving");
    try {
      await saveImage(imageUrl, filename);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2500);
    }
  }

  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Could not save"
          : "Save image";

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={status === "saving"}
      className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[var(--foreground)]/75 text-white shadow-sm backdrop-blur-sm transition hover:bg-[var(--foreground)]/90 disabled:opacity-60"
      aria-label={label}
      title={label}
    >
      <DownloadIcon className="h-5 w-5" />
    </button>
  );
}
