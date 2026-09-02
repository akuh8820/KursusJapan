/** Registrasi service worker (PRD §8 full offline). Dipanggil dari layout. */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (location.hostname === "localhost" && process.env.NODE_ENV !== "production") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline tidak kritis — app tetap jalan */
    });
  });
}