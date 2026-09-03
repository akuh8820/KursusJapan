/**
 * Progres lokal (IndexedDB) — PRD §6.3, §8.
 * Menyimpan: status unit (linear unlock), hasil kuis akhiran, state SRS Leitner,
 * dan preferensi tema. Pengganti streak.ts (streak dihapus dari konsep, PRD §6.1).
 *
 * SRS Leitner 5 kotak (PRD §6.4): interval 1/3/7/14/30 hari.
 * Benar → naik kotak (maks 5); salah → kembali ke kotak 1.
 */

const DB_NAME = "gojapan";
const DB_VERSION = 1;
const STORE_UNITS = "units";
const STORE_SRS = "srs";
const STORE_SETTINGS = "settings";

export type UnitStatus = "locked" | "unlocked" | "in_progress" | "completed";

export type UnitProgress = {
  unitId: string;
  status: UnitStatus;
  quizPassed: boolean;
  completedAt: string | null;
  lastActivityAt: string | null;
};

export type SrsCard = {
  id: string; // `${unitId}:${vocabIndex}`
  unitId: string;
  term: string;
  kana: string;
  meaning: string;
  box: number; // 1..5
  dueAt: string; // ISO
  lastReviewedAt: string | null;
  reviewCount: number;
};

export const SRS_BOX_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_UNITS)) {
        db.createObjectStore(STORE_UNITS, { keyPath: "unitId" });
      }
      if (!db.objectStoreNames.contains(STORE_SRS)) {
        db.createObjectStore(STORE_SRS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

function getAll<T>(store: string): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const t = db.transaction(store, "readonly");
        const req = t.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      }),
  );
}

function put<T>(store: string, value: T): Promise<void> {
  return tx(store, "readwrite", (s) => s.put(value)).then(() => undefined);
}

// ---------- UNIT PROGRESS ----------

export async function getUnitProgress(unitId: string): Promise<UnitProgress | null> {
  if (typeof indexedDB === "undefined") return null;
  const all = await getAll<UnitProgress>(STORE_UNITS);
  return all.find((u) => u.unitId === unitId) ?? null;
}

export async function listUnitProgress(): Promise<UnitProgress[]> {
  if (typeof indexedDB === "undefined") return [];
  return getAll<UnitProgress>(STORE_UNITS);
}

export async function setUnitProgress(
  unitId: string,
  patch: Partial<Omit<UnitProgress, "unitId">>,
): Promise<UnitProgress> {
  const cur = (await getUnitProgress(unitId)) ?? {
    unitId,
    status: "unlocked",
    quizPassed: false,
    completedAt: null,
    lastActivityAt: null,
  };
  const next: UnitProgress = { ...cur, ...patch, unitId };
  await put(STORE_UNITS, next);
  return next;
}

export async function markUnitStarted(unitId: string): Promise<UnitProgress> {
  return setUnitProgress(unitId, {
    status: "in_progress",
    lastActivityAt: new Date().toISOString(),
  });
}

export async function markQuizPassed(unitId: string): Promise<UnitProgress> {
  return setUnitProgress(unitId, {
    status: "completed",
    quizPassed: true,
    completedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  });
}

/** Unit terbuka jika unit sebelumnya sudah completed (akses linear, PRD §6.2). */
export async function isUnitUnlocked(unitId: string, prevUnitId: string | null): Promise<boolean> {
  if (!prevUnitId) return true;
  const prev = await getUnitProgress(prevUnitId);
  return prev?.status === "completed";
}

// ---------- SRS (LEITNER) ----------

export function nextSrsState(card: SrsCard, correct: boolean): SrsCard {
  const now = Date.now();
  if (correct) {
    const box = Math.min(card.box + 1, 5);
    const days = SRS_BOX_INTERVALS_DAYS[box - 1];
    return {
      ...card,
      box,
      dueAt: new Date(now + days * 86_400_000).toISOString(),
      lastReviewedAt: new Date(now).toISOString(),
      reviewCount: card.reviewCount + 1,
    };
  }
  return {
    ...card,
    box: 1,
    dueAt: new Date(now + SRS_BOX_INTERVALS_DAYS[0] * 86_400_000).toISOString(),
    lastReviewedAt: new Date(now).toISOString(),
    reviewCount: card.reviewCount + 1,
  };
}

export async function getSrsDue(limit = 20): Promise<SrsCard[]> {
  if (typeof indexedDB === "undefined") return [];
  const all = await getAll<SrsCard>(STORE_SRS);
  const now = Date.now();
  return all
    .filter((c) => Date.parse(c.dueAt) <= now)
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
    .slice(0, limit);
}

export async function reviewSrsCard(id: string, correct: boolean): Promise<SrsCard> {
  const all = await getAll<SrsCard>(STORE_SRS);
  const cur = all.find((c) => c.id === id);
  if (!cur) throw new Error(`SRS card tidak ditemukan: ${id}`);
  const next = nextSrsState(cur, correct);
  await put(STORE_SRS, next);
  return next;
}

/** Seed kartu SRS dari kosakata unit saat unit pertama kali dibuka. */
export async function seedSrsFromVocab(
  unitId: string,
  vocab: { term: string; kana: string; meaning_id: string }[],
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const existing = await getAll<SrsCard>(STORE_SRS);
  const existingIds = new Set(existing.map((c) => c.id));
  const now = new Date().toISOString();
  const fresh: SrsCard[] = vocab
    .map((v, i) => ({
      id: `${unitId}:${i}`,
      unitId,
      term: v.term,
      kana: v.kana,
      meaning: v.meaning_id,
      box: 1,
      dueAt: now,
      reviewCount: 0,
      lastReviewedAt: null,
    }))
    .filter((c) => !existingIds.has(c.id));
  for (const card of fresh) await put(STORE_SRS, card);
}

// ---------- SETTINGS (tema) ----------

export async function getSetting<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  const all = await getAll<{ key: string; value: T }>(STORE_SETTINGS);
  return all.find((s) => s.key === key)?.value ?? null;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await put(STORE_SETTINGS, { key, value });
}

// ---------- GATING LOCKSTEP PER-UNIT ----------
// Flag disimpan sebagai objek serializable via setSetting/getSetting.
// practice_done: { [unitId]: { kanji: bool, bunpo: bool, partikel: bool } }
// exam_pass:     { [unitId]: bool }

export type PracticeFlags = { kanji: boolean; bunpo: boolean; partikel: boolean };

export async function getPracticeDone(): Promise<Record<string, PracticeFlags>> {
  return (await getSetting<Record<string, PracticeFlags>>("practice_done")) ?? {};
}

export async function setPracticeDone(unitId: string, area: keyof PracticeFlags): Promise<void> {
  const cur = await getPracticeDone();
  const next = { ...cur, [unitId]: { ...(cur[unitId] ?? { kanji: false, bunpo: false, partikel: false }), [area]: true } };
  await setSetting("practice_done", next);
}

export async function getExamPass(): Promise<Record<string, boolean>> {
  return (await getSetting<Record<string, boolean>>("exam_pass")) ?? {};
}

export async function setExamPass(unitId: string): Promise<void> {
  const cur = await getExamPass();
  await setSetting("exam_pass", { ...cur, [unitId]: true });
}

/** Apakah latihan ringan unit n sudah selesai (kanji+bunpo+partikel). */
export async function isPracticeDone(unitId: string): Promise<boolean> {
  const flags = (await getPracticeDone())[unitId];
  return Boolean(flags && flags.kanji && flags.bunpo && flags.partikel);
}

/** Apakah ujian unit n sudah lolos 100%. */
export async function isExamPassed(unitId: string): Promise<boolean> {
  return Boolean((await getExamPass())[unitId]);
}

/**
 * Status gating unit n: 'locked' | 'practice_open' | 'exam_open' | 'exam_passed'.
 * Lockstep: latihan #n terbuka bila ujian #(n-1) sudah lolos (atau n adalah unit
 * pertama). Ujian #n terbuka setelah latihan #n selesai. Lolos 100% → #n+1 terbuka.
 * `prevUnitId` = unit sebelum n (urut lockstep); null utk unit pertama.
 */
export async function getUnitLockState(
  unitId: string,
  prevUnitId: string | null,
): Promise<"locked" | "practice_open" | "exam_open" | "exam_passed"> {
  if (await isExamPassed(unitId)) return "exam_passed";
  if (prevUnitId && !(await isExamPassed(prevUnitId))) return "locked";
  if (await isPracticeDone(unitId)) return "exam_open";
  return "practice_open";
}