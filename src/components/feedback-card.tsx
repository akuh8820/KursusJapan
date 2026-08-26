"use client";

import { useState } from "react";
import { EVENTS, track } from "@/lib/analytics/events";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";

const FEEDBACK_URL = "https://github.com/akuh8820/KursusJapan/issues/new/choose";

const JENIS = [
  "Salah ketik / konten bahasa",
  "Audio tidak jelas",
  "Bug / error",
  "Saran fitur",
  "Lainnya",
] as const;

type Status = "idle" | "sending" | "sent" | "failed";

/**
 * Kartu + form umpan balik masa beta (PRD §12: feedback_open/feedback_submit).
 * Tanpa env Supabase: tombol turun ke form issue GitHub.
 */
export default function FeedbackCard() {
  const [open, setOpen] = useState(false);
  const [jenis, setJenis] = useState<string>(JENIS[0]);
  const [pesan, setPesan] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pesan.trim().length < 5 || !supabaseConfigured) return;
    setStatus("sending");
    try {
      const { error } = await getSupabase()
        .from("error_reports")
        .insert({
          lesson_id: null,
          user_id: null,
          message: `[${jenis}] ${pesan.trim()}`,
          context: {
            jenis,
            path: typeof window !== "undefined" ? window.location.pathname : null,
            ua: typeof window !== "undefined" ? window.navigator.userAgent : null,
            sumber: "beta-feedback",
          },
        });
      if (error) throw error;
      setStatus("sent");
      setPesan("");
      track(EVENTS.feedbackSubmit, { jenis });
    } catch {
      setStatus("failed");
    }
  }

  return (
    <section aria-label="Umpan balik" className="mt-6">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-semibold">Sedang masa beta 🧪</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Menemukan salah ketik, audio aneh, atau punya ide fitur? Ceritakan
          di sini — semua masukan dipakai untuk perbaikan.
        </p>

        {!supabaseConfigured ? (
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(EVENTS.feedbackOpen)}
            className="mt-3 inline-block rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition active:scale-[0.99]"
          >
            Lapor bug / kasih saran →
          </a>
        ) : status === "sent" ? (
          <p className="mt-3 rounded-xl bg-background p-3 text-xs font-medium">
            ✅ Terima kasih! Masukanmu sudah masuk dan akan kami tinjau.
          </p>
        ) : !open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              track(EVENTS.feedbackOpen);
            }}
            className="mt-3 inline-block rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition active:scale-[0.99]"
          >
            Lapor bug / kasih saran →
          </button>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-2">
            <label className="block text-[11px] font-medium text-muted">
              Jenis masukan
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
              >
                {JENIS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] font-medium text-muted">
              Pesan kamu
              <textarea
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                rows={4}
                required
                minLength={5}
                placeholder="Ceritakan singkat apa yang terjadi atau yang kamu inginkan…"
                className="mt-1 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted/60"
              />
            </label>
            {status === "failed" && (
              <p className="text-xs text-red-600">
                Gagal mengirim — cek koneksi lalu ulangi, atau{" "}
                <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="underline">
                  lapor lewat GitHub
                </a>
                .
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={status === "sending" || pesan.trim().length < 5}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-50"
              >
                {status === "sending" ? "Mengirim…" : "Kirim"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2 py-2 text-xs text-muted underline"
              >
                Tutup
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
