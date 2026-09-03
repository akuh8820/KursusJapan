import { readFileSync } from "node:fs";
import { join } from "node:path";
import { particlesFileSchema, type Particle } from "./schema";

const PARTICLES_PATH = join(process.cwd(), "content/particles.json");

let cached: Particle[] | null = null;

/** Loader server-only. Jangan dipanggil dari komponen client. */
export function loadParticles(): Particle[] {
  if (cached) return cached;
  const raw = readFileSync(PARTICLES_PATH, "utf8");
  const parsed = particlesFileSchema.parse(JSON.parse(raw));
  cached = parsed.particles;
  return cached;
}

/** Partikel yang muncul di unit tertentu (untuk latihan partikel#n). */
export function particlesForUnit(unitId: string): Particle[] {
  return loadParticles().filter((p) => p.unit_ids.includes(unitId));
}