"use client";

import { useState } from "react";
import type { WritingItem } from "@/lib/content/schema";
import KanjiCanvas from "@/components/kanji-canvas";

type Tab = "hiragana" | "katakana" | "kanji";

interface HurufClientProps {
  hiragana: WritingItem[];
  katakana: WritingItem[];
  kanji: WritingItem[];
}

export default function HurufClient({ hiragana, katakana, kanji }: HurufClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("hiragana");
  const [selectedChar, setSelectedChar] = useState<WritingItem | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  const currentChars = activeTab === "hiragana" ? hiragana : activeTab === "katakana" ? katakana : kanji;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Huruf / Kana</h1>
        <p className="mt-1 text-sm text-muted">Hiragana, Katakana, & Kanji dari semua unit</p>
      </header>

      {/* Tab navigation */}
      <div className="mb-4 flex gap-1 rounded-xl border border-border bg-card p-1" role="tablist">
        {(["hiragana", "katakana", "kanji"] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedChar(null);
              setShowCanvas(false);
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab === "hiragana" && "ひらがな"}
            {tab === "katakana" && "カタカナ"}
            {tab === "kanji" && "漢字"}
          </button>
        ))}
      </div>

      {/* Character grid */}
      <section aria-label={`${activeTab} characters`} className="mb-6">
        {currentChars.length === 0 ? (
          <p className="text-center text-muted py-8">Belum ada karakter di kategori ini</p>
        ) : (
          <div className="grid grid-cols-10 gap-2">
            {currentChars.map((item) => (
              <button
                key={item.char}
                type="button"
                onClick={() => {
                  setSelectedChar(item);
                  setShowCanvas(false);
                }}
                className={`aspect-square rounded-xl border border-border bg-card text-2xl font-bold transition hover:border-primary/40 hover:shadow-sm active:scale-[0.97] ${
                  selectedChar?.char === item.char ? "border-primary bg-primary/5" : ""
                }`}
              >
                {item.char}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Detail panel */}
      {selectedChar && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl font-bold">{selectedChar.char}</span>
              <div>
                <p className="text-lg font-semibold">{selectedChar.romaji}</p>
                {selectedChar.meaning_id && (
                  <p className="text-sm text-muted">{selectedChar.meaning_id}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCanvas(!showCanvas)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-medium transition hover:border-primary/40"
            >
              {showCanvas ? "Tutup Latihan" : "Latihan Menulis"}
            </button>
          </div>

          {showCanvas && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-muted">Tiru goresan di atas kanvas:</p>
              <KanjiCanvas char={selectedChar.char} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}