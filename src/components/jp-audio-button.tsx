"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "playing" | "error";

/**
 * Tombol putar audio pelajaran (MP3 hasil VOICEVOX).
 * Lazy-load: file baru ditarik saat pertama kali diketuk.
 */
export default function JpAudioButton({
  src,
  label,
  small = false,
}: {
  src: string;
  label: string;
  small?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  const toggle = useCallback(() => {
    if (status === "playing") {
      audioRef.current?.pause();
      setStatus("idle");
      return;
    }
    let el = audioRef.current;
    if (status === "error" || !el) {
      el?.pause();
      el = new Audio(src);
      el.preload = "none";
      el.addEventListener("ended", () => setStatus("idle"));
      audioRef.current = el;
    }
    setStatus("loading");
    el.play()
      .then(() => setStatus("playing"))
      .catch(() => {
        setStatus("error");
        audioRef.current = null;
      });
  }, [src, status]);

  const glyph =
    status === "error"
      ? "⚠"
      : status === "loading"
        ? "…"
        : status === "playing"
          ? "■"
          : "🔊";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Putar audio: ${label}`}
      title={`Putar audio: ${label}`}
      className={`shrink-0 rounded-full border border-border bg-background leading-none transition active:scale-95 ${
        small ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
      } ${status === "error" ? "opacity-60" : ""}`}
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}
