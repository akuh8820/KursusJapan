/** Util tanggal — zona JST untuk "hari ini" (konsisten dengan konten daily card). */
export function todayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}