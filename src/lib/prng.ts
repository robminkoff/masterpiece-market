/**
 * Deterministic PRNG — Mulberry32
 *
 * Fast 32-bit generator with good statistical properties.
 * All randomness in solo mode flows through this class
 * so results are fully reproducible given the same seed.
 */

export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform integer in [min, max] inclusive. */
  uniformInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Uniform float in [min, max]. */
  uniform(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Normal (Gaussian) sample via Box-Muller transform. */
  normal(mean: number, std: number): number {
    const u1 = this.next() || 1e-10; // avoid log(0)
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }

  /** Normal sample clamped to [min, max]. */
  normalClamped(mean: number, std: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, this.normal(mean, std)));
  }

  /** Returns true with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Weighted random selection from parallel arrays. */
  weightedChoice<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Pick n random items from arr (without replacement). */
  pick<T>(arr: T[], n: number): T[] {
    const copy = [...arr];
    const result: T[] = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      const idx = this.uniformInt(0, copy.length - 1);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }
}
