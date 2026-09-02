/**
 * Taksonomi event analytics (PRD §12).
 * Metrik retensi/progres tidak bisa diukur tanpa event ini,
 * jadi instrumentasi dipasang sejak F0.
 *
 * PostHog aktif otomatis bila NEXT_PUBLIC_POSTHOG_KEY diisi;
 * tanpa key, track() no-op agar app tetap jalan.
 */

export const EVENTS = {
  unitStart: "unit_start",
  unitComplete: "unit_complete",
  quizResult: "quiz_result",
  exerciseResult: "exercise_result",
  srsReview: "srs_review",
  dailyCardView: "daily_card_view",
  feedbackOpen: "feedback_open",
  feedbackSubmit: "feedback_submit",
  themeToggle: "theme_toggle",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type EventProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: EventName, props?: EventProps): void {
  if (typeof window === "undefined") return;
  const posthog = (window as unknown as { posthog?: { capture: (e: string, p?: EventProps) => void } })
    .posthog;
  if (posthog) {
    posthog.capture(event, props);
    return;
  }
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${event}`, props ?? {});
  }
}