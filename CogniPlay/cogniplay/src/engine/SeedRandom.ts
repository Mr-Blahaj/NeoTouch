// ─── Seeded Pseudo-Random Number Generator (Mulberry32) ──────────────────────
//
// Every puzzle generator uses this instead of Math.random() so that
// identical seeds always produce identical puzzles.

export class SeedRandom {
  private state: number;

  constructor(seed: number) {
    // Ensure integer seed; use abs to avoid negative-zero issues
    this.state = Math.abs(seed | 0) || 1;
  }

  /** Returns a float in [0, 1) — the core mulberry32 step */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a random integer in [min, max] (inclusive) */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a random float in [min, max) */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Picks a random element from a non-empty array */
  pick<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array');
    return array[this.nextInt(0, array.length - 1)];
  }

  /** Returns a new shuffled copy (Fisher-Yates) */
  shuffle<T>(array: T[]): T[] {
    const out = [...array];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Returns true with the given probability (default 50 %) */
  nextBool(probability = 0.5): boolean {
    return this.next() < probability;
  }
}
