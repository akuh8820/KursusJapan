import { readFileSync } from "node:fs";
import { join } from "node:path";

export type ConjugationType = "verb" | "i-adj" | "na-adj";

export interface ConjugationForms {
  dictionary: string;
  masu: string;
  te: string;
  nai: string;
  ta: string;
  ba: string;
  volitional: string;
}

export interface ConjugationEntry {
  term: string;
  type: ConjugationType;
  forms: ConjugationForms;
}

export interface ConjugationsData {
  version: number;
  entries: ConjugationEntry[];
}

const CONJUGATIONS_PATH = join(process.cwd(), "content/conjugations.json");

let cached: ConjugationsData | null = null;

export function loadConjugations(): ConjugationsData {
  if (cached) return cached;
  const raw = readFileSync(CONJUGATIONS_PATH, "utf8");
  cached = JSON.parse(raw);
  return cached!;
}

export function getConjugation(term: string): ConjugationEntry | undefined {
  const data = loadConjugations();
  return data.entries.find((e) => e.term === term);
}

export function getConjugationsForTerms(terms: string[]): ConjugationEntry[] {
  const data = loadConjugations();
  const termSet = new Set(terms);
  return data.entries.filter((e) => termSet.has(e.term));
}