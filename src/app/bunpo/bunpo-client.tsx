"use client";

import { useCallback, useEffect, useState } from "react";
import type { GrammarPoint, Particle } from "@/lib/content/schema";
import { setPracticeDone, getPracticeDone, type PracticeFlags } from "@/lib/progress/store";

interface GrammarPointWithUnit extends GrammarPoint {
  unitId: string;
  unitNo: number;
  level: string;
  theme: string;
}

interface BunpoClientProps {
  grammarPoints: GrammarPointWithUnit[];
  particles: Particle[];
}

type Tab = "bunpo" | "partikel";

export default function BunpoClient({ grammarPoints, particles }: BunpoClientProps) {
  const [tab, setTab] = useState<Tab>("bunpo");
  const [selectedGp, setSelectedGp] = useState<GrammarPointWithUnit | null>(null);
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  const [practiceDone, setPracticeDoneState] = useState<Record<string, PracticeFlags>>({});

  useEffect(() => {
    let mounted = true;
    getPracticeDone().then((d) => mounted && setPracticeDoneState(d));
    return () => {
      mounted = false;
    };
  }, []);

  const markDone = useCallback(async (unitId: string, area: keyof PracticeFlags) => {
    await setPracticeDone(unitId, area);
    const d = await getPracticeDone();
    setPracticeDoneState(d);
  }, []);

  // ---- Latihan bunpo#n: verifikasi pola grammar unit n ----
  const [bunpoPracticeUnit, setBunpoPracticeUnit] = useState<GrammarPointWithUnit | null>(null);
  const [bunpoPicked, setBunpoPicked] = useState<number | null>(null);

  function openBunpoPractice(gp: GrammarPointWithUnit) {
    setBunpoPracticeUnit(gp);
    setBunpoPicked(null);
  }

  // ---- Latihan partikel#n: pilih fungsi partikel yang muncul di unit n ----
  const [partikelPracticeUnit, setPartikelPracticeUnit] = useState<GrammarPointWithUnit | null>(null);
  const [partikelPicked, setPartikelPicked] = useState<Record<string, number>>({});

  function openPartikelPractice(gp: GrammarPointWithUnit) {
    setPartikelPracticeUnit(gp);
    setPartikelPicked({});
  }

  const unitParticles = partikelPracticeUnit
    ? particles.filter((p) => p.unit_ids.includes(partikelPracticeUnit.unitId))
    : [];

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Bunpō & Partikel</h1>
        <p className="mt-1 text-sm text-muted">Pola bunpō & partikel JLPT N5 dari semua unit</p>
      </header>

      {/* Tabs */}
      <div className="mb-4 flex rounded-xl border border-border bg-card p-1" role="tablist" aria-label="Pilih area">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "bunpo"}
          onClick={() => {
            setTab("bunpo");
            setSelectedGp(null);
            setSelectedParticle(null);
            setBunpoPracticeUnit(null);
            setPartikelPracticeUnit(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "bunpo" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Bunpō
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "partikel"}
          onClick={() => {
            setTab("partikel");
            setSelectedGp(null);
            setSelectedParticle(null);
            setBunpoPracticeUnit(null);
            setPartikelPracticeUnit(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "partikel" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Partikel
        </button>
      </div>

      {tab === "bunpo" && (
        <>
          {!selectedGp && !bunpoPracticeUnit && (
            <section aria-label="Daftar pola bunpō" className="space-y-2">
              {grammarPoints.map((gp) => {
                const done = practiceDone[gp.unitId]?.bunpo;
                return (
                  <div key={gp.unitId} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setSelectedGp(gp)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          U{String(gp.unitNo).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-muted">{gp.level}</span>
                        {done && (
                          <span className="ml-auto text-xs font-semibold text-green-600 dark:text-green-400">✓</span>
                        )}
                      </div>
                      <p className="mt-2 font-semibold">{gp.pattern}</p>
                      <p className="mt-1 text-sm text-muted line-clamp-1">{gp.meaning_id}</p>
                      <p className="mt-1 text-xs text-muted">{gp.theme}</p>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openBunpoPractice(gp)}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold transition active:scale-[0.99]"
                      >
                        Latihan Bunpō #{gp.unitNo}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {selectedGp && (
            <article className="space-y-4 animate-fade-in">
              <button
                type="button"
                onClick={() => setSelectedGp(null)}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
              >
                ← Kembali ke daftar
              </button>
              <header className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    U{String(selectedGp.unitNo).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-muted">{selectedGp.level}</span>
                </div>
                <h2 className="text-xl font-bold">{selectedGp.pattern}</h2>
                <p className="mt-2 text-sm text-muted">{selectedGp.meaning_id}</p>
                <p className="mt-3 text-sm font-medium">Pembentukan:</p>
                <p className="mt-1 font-mono text-sm">{selectedGp.formation}</p>
              </header>
              <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h3 className="font-semibold">Contoh</h3>
                <div className="mt-3 space-y-3">
                  {selectedGp.examples.map((ex, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p lang="ja" className="text-lg font-medium">
                          {ex.jp}
                        </p>
                        <p className="text-sm italic text-muted">{ex.romaji}</p>
                        <p className="text-sm">{ex.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </article>
          )}

          {bunpoPracticeUnit && (
            <BunpoPractice
              gp={bunpoPracticeUnit}
              picked={bunpoPicked}
              onPick={setBunpoPicked}
              onDone={() => markDone(bunpoPracticeUnit.unitId, "bunpo")}
              onBack={() => setBunpoPracticeUnit(null)}
            />
          )}
        </>
      )}

      {tab === "partikel" && (
        <>
          {!selectedParticle && !partikelPracticeUnit && (
            <section aria-label="Daftar partikel" className="space-y-2">
              {particles.map((p) => {
                const firstUnit = grammarPoints.find((gp) => p.unit_ids.includes(gp.unitId));
                const done = firstUnit ? practiceDone[firstUnit.unitId]?.partikel : false;
                return (
                  <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setSelectedParticle(p)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span lang="ja" className="text-2xl font-bold text-primary">{p.char}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{p.romaji}</p>
                          <p className="text-sm text-muted">{p.function_id}</p>
                        </div>
                        <span className="text-xs text-muted">{p.unit_ids.length} unit</span>
                        {done && (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓</span>
                        )}
                      </div>
                    </button>
                    {firstUnit && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openPartikelPractice(firstUnit)}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold transition active:scale-[0.99]"
                        >
                          Latihan Partikel #{firstUnit.unitNo}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {selectedParticle && (
            <article className="space-y-4 animate-fade-in">
              <button
                type="button"
                onClick={() => setSelectedParticle(null)}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
              >
                ← Kembali ke daftar
              </button>
              <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span lang="ja" className="text-4xl font-bold text-primary">{selectedParticle.char}</span>
                  <div>
                    <p className="text-lg font-semibold">{selectedParticle.romaji}</p>
                    <p className="text-sm text-muted">{selectedParticle.function_id}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p lang="ja" className="text-lg">{selectedParticle.example_jp}</p>
                  <p className="text-sm italic text-muted">{selectedParticle.example_romaji}</p>
                  <p className="text-sm">{selectedParticle.example_id}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted">Muncul di unit:</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selectedParticle.unit_ids.map((u) => (
                      <span key={u} className="rounded bg-muted/10 px-1.5 py-0.5 text-[11px] text-muted">
                        {u.replace("n5-u", "U")}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </article>
          )}

          {partikelPracticeUnit && (
            <PartikelPractice
              unit={partikelPracticeUnit}
              particles={unitParticles}
              picked={partikelPicked}
              onPick={(id, idx) => setPartikelPicked((prev) => ({ ...prev, [id]: idx }))}
              onDone={() => markDone(partikelPracticeUnit.unitId, "partikel")}
              onBack={() => setPartikelPracticeUnit(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

function BunpoPractice({
  gp,
  picked,
  onPick,
  onDone,
  onBack,
}: {
  gp: GrammarPointWithUnit;
  picked: number | null;
  onPick: (i: number | null) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const options = [gp.pattern, ...gp.examples.map((e) => e.jp)].slice(0, 4);

  function check() {
    setChecked(true);
    if (picked === 0) onDone();
  }

  return (
    <article className="space-y-4 animate-fade-in">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
        ← Kembali ke daftar
      </button>
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
            Latihan Bunpō #{gp.unitNo}
          </span>
        </div>
        <p className="text-sm font-semibold">
          Pola bunpō unit {gp.unitNo} adalah: <span lang="ja">{gp.pattern}</span>
        </p>
        <p className="mt-1 text-sm text-muted">{gp.meaning_id}</p>
        <div className="mt-3 grid gap-2" role="group" aria-label="Pilih pola yang benar">
          {options.map((opt, j) => {
            let state: "idle" | "right" | "wrong" | "dim" = "idle";
            if (checked) {
              if (j === 0) state = "right";
              else if (j === picked) state = "wrong";
              else state = "dim";
            }
            return (
              <button
                key={opt}
                type="button"
                onClick={() => !checked && onPick(j)}
                disabled={checked}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  state === "right"
                    ? "border-emerald-500/60 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400"
                    : state === "wrong"
                      ? "border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400"
                      : state === "dim"
                        ? "border-border text-muted opacity-50"
                        : "border-border bg-background active:scale-[0.99]"
                }`}
              >
                {String.fromCharCode(65 + j)}. <span lang="ja">{opt}</span>
              </button>
            );
          })}
        </div>
        {!checked ? (
          <button
            type="button"
            onClick={check}
            disabled={picked === null}
            className="mt-3 w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            Periksa
          </button>
        ) : (
          <p
            aria-live="polite"
            className={`mt-3 text-sm font-bold ${
              picked === 0 ? "text-green-600 dark:text-green-400" : "text-primary"
            }`}
          >
            {picked === 0 ? "✓ Benar! Latihan bunpō selesai." : "✗ Belum tepat — coba lagi."}
          </p>
        )}
      </section>
    </article>
  );
}

function PartikelPractice({
  unit,
  particles,
  picked,
  onPick,
  onDone,
  onBack,
}: {
  unit: GrammarPointWithUnit;
  particles: Particle[];
  picked: Record<string, number>;
  onPick: (id: string, idx: number) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const allCorrect =
    particles.length > 0 && particles.every((p) => picked[p.id] === 0);

  function check() {
    setChecked(true);
    if (allCorrect) onDone();
  }

  return (
    <article className="space-y-4 animate-fade-in">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
        ← Kembali ke daftar
      </button>
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
            Latihan Partikel #{unit.unitNo}
          </span>
        </div>
        <p className="text-sm text-muted">
          Pilih fungsi yang benar untuk tiap partikel yang muncul di unit {unit.unitNo}.
        </p>
        {particles.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Tidak ada partikel baru di unit ini — latihan dianggap selesai.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {particles.map((p) => {
              const options = [p.function_id, ...["penanda objek", "penanda topik", "penanda lokasi"].filter((f) => f !== p.function_id)].slice(0, 4);
              const chosen = picked[p.id];
              let state: "idle" | "right" | "wrong" | "dim" = "idle";
              if (checked) {
                if (chosen === 0) state = "right";
                else if (chosen !== undefined) state = "wrong";
                else state = "dim";
              }
              return (
                <div key={p.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <span lang="ja" className="text-xl font-bold text-primary">{p.char}</span>
                    <span className="text-sm font-semibold">{p.romaji}</span>
                  </div>
                  <div className="mt-2 grid gap-1.5" role="group" aria-label={`Fungsi ${p.char}`}>
                    {options.map((opt, j) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => !checked && onPick(p.id, j)}
                        disabled={checked}
                        className={`rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                          state === "right"
                            ? "border-emerald-500/60 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400"
                            : state === "wrong"
                              ? "border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400"
                              : state === "dim"
                                ? "border-border text-muted opacity-50"
                                : "border-border bg-background active:scale-[0.99]"
                        }`}
                      >
                        {String.fromCharCode(65 + j)}. {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!checked ? (
          <button
            type="button"
            onClick={check}
            disabled={particles.length > 0 && !allCorrect}
            className="mt-3 w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            Periksa
          </button>
        ) : (
          <p
            aria-live="polite"
            className={`mt-3 text-sm font-bold ${
              allCorrect ? "text-green-600 dark:text-green-400" : "text-primary"
            }`}
          >
            {allCorrect ? "✓ Benar! Latihan partikel selesai." : "✗ Belum tepat — coba lagi."}
          </p>
        )}
      </section>
    </article>
  );
}