'use strict';
// Seeded pseudo-random generator (sfc32) so every build produces the same puzzles.

function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

class RNG {
  constructor(seed) {
    const s = hashSeed(String(seed));
    this.a = s(); this.b = s(); this.c = s(); this.d = s();
    for (let i = 0; i < 12; i++) this.next();
  }
  next() {
    this.a >>>= 0; this.b >>>= 0; this.c >>>= 0; this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }
  int(n) { return Math.floor(this.next() * n); }
  range(lo, hi) { return lo + this.int(hi - lo + 1); }
  pick(arr) { return arr[this.int(arr.length)]; }
  chance(p) { return this.next() < p; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  sample(arr, k) { return this.shuffle(arr).slice(0, k); }
  weighted(pairs) {
    let total = 0;
    for (const [, w] of pairs) total += w;
    let x = this.next() * total;
    for (const [v, w] of pairs) { if ((x -= w) < 0) return v; }
    return pairs[pairs.length - 1][0];
  }
}

module.exports = { RNG };
