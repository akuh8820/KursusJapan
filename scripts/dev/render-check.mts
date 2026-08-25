import { renderToStaticMarkup } from "react-dom/server";
import * as ns from "../../src/app/page.tsx";

/**
 * Smoke test render dashboard tanpa server (dipakai saat sandbox
 * melarang bind port). Jalankan: npx tsx scripts/dev/render-check.mts
 */
const raw: unknown = (ns as { default: unknown }).default;
const Page =
  typeof raw === "function"
    ? (raw as () => Promise<React.ReactNode>)
    : ((raw as { default: () => Promise<React.ReactNode> }).default);
const html = await renderToStaticMarkup(await Page());

const checks: Array<[string, boolean]> = [
  ["Slot Kartu Hari Ini ada", html.includes("Kartu Hari Ini")],
  ["Daftar 10 unit pilot", html.includes("Unit N5 pilot (10)")],
  ["Slot iklan non-intrusif footer", html.includes("Slot iklan non-intrusif")],
  ["Tombol 'Mulai 20 menit' aktif", html.includes("Mulai 20 menit")],
  ["Unit tertaut ke /sesi/<unit>", html.includes("/sesi/n5-u001")],
];
let fail = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) fail++;
}
process.exit(fail ? 1 : 0);
