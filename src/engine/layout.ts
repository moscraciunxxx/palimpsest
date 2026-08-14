import type { DamageKind, LacunaRegion, TextLine } from "./types";

export function extractRegions(
  combined: Float32Array,
  stain: Float32Array,
  wash: Float32Array,
  mold: Float32Array,
  tear: Float32Array,
  w: number,
  h: number,
): LacunaRegion[] {
  const cell = 16;
  const regions: LacunaRegion[] = [];
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      let acc = 0;
      let n = 0;
      let s = 0;
      let wa = 0;
      let m = 0;
      let t = 0;
      const x1 = Math.min(w, x + cell);
      const y1 = Math.min(h, y + cell);
      for (let yy = y; yy < y1; yy++) {
        for (let xx = x; xx < x1; xx++) {
          const p = yy * w + xx;
          acc += combined[p];
          s += stain[p];
          wa += wash[p];
          m += mold[p];
          t += tear[p];
          n++;
        }
      }
      const severity = acc / n;
      if (severity < 0.28) continue;
      const votes: [DamageKind, number][] = [
        ["stain", s / n],
        ["wash", wa / n],
        ["mold", m / n],
        ["tear", t / n],
      ];
      votes.sort((a, b) => b[1] - a[1]);
      regions.push({
        x,
        y,
        w: x1 - x,
        h: y1 - y,
        kind: votes[0][0],
        severity,
      });
    }
  }
  return mergeRegions(regions);
}

function mergeRegions(regions: LacunaRegion[]): LacunaRegion[] {
  if (regions.length === 0) return [];
  const used = new Set<number>();
  const out: LacunaRegion[] = [];
  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue;
    let a = { ...regions[i] };
    used.add(i);
    let grew = true;
    while (grew) {
      grew = false;
      for (let j = 0; j < regions.length; j++) {
        if (used.has(j)) continue;
        const b = regions[j];
        if (b.kind !== a.kind) continue;
        if (!near(a, b, 20)) continue;
        a = {
          x: Math.min(a.x, b.x),
          y: Math.min(a.y, b.y),
          w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x),
          h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y),
          kind: a.kind,
          severity: Math.max(a.severity, b.severity),
        };
        used.add(j);
        grew = true;
      }
    }
    if (a.w * a.h > 280) out.push(a);
  }
  return out.sort((p, q) => q.severity - p.severity).slice(0, 18);
}

function near(a: LacunaRegion, b: LacunaRegion, pad: number) {
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  );
}

export function detectLines(
  binary: Float32Array,
  lacuna: Float32Array,
  w: number,
  h: number,
): TextLine[] {
  const inkRow = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    let s = 0;
    const row = y * w;
    for (let x = 0; x < w; x++) s += 1 - binary[row + x];
    inkRow[y] = s / w;
  }
  const thresh = 0.01;
  const lines: TextLine[] = [];
  let y = 0;
  let idx = 0;
  while (y < h) {
    while (y < h && inkRow[y] < thresh) y++;
    if (y >= h) break;
    const y0 = y;
    while (y < h && inkRow[y] >= thresh * 0.55) y++;
    const y1 = y;
    if (y1 - y0 < 4) continue;
    let x0 = w;
    let x1 = 0;
    let ink = 0;
    let hole = 0;
    let n = 0;
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const p = yy * w + xx;
        if (binary[p] < 0.5) {
          x0 = Math.min(x0, xx);
          x1 = Math.max(x1, xx);
          ink += 1;
        }
        hole += lacuna[p];
        n++;
      }
    }
    if (x1 <= x0) continue;
    const inkStrength = ink / Math.max(1, (y1 - y0) * (x1 - x0));
    const lacunaOverlap = hole / n;
    const confidence = clamp(
      0.18 + inkStrength * 1.4 - lacunaOverlap * 0.85,
      0.05,
      0.98,
    );
    lines.push({
      id: `L${++idx}`,
      y0,
      y1,
      x0,
      x1,
      inkStrength,
      lacunaOverlap,
      confidence,
    });
  }
  return lines;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
