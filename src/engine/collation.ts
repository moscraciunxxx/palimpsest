import { mean } from "./pixels";

export function registerGray(
  a: Float32Array,
  wa: number,
  ha: number,
  b: Float32Array,
  wb: number,
  hb: number,
): { data: Float32Array; w: number; h: number; dx: number; dy: number; score: number } {
  const fitted = resizeGray(b, wb, hb, wa, ha);
  const scale = Math.min(1, 160 / wa);
  const sw = Math.max(16, Math.round(wa * scale));
  const sh = Math.max(16, Math.round(ha * scale));
  const aS = downsample(a, wa, ha, sw, sh);
  const bS = downsample(fitted, wa, ha, sw, sh);

  let bestDx = 0;
  let bestDy = 0;
  let best = -Infinity;
  for (let dy = -12; dy <= 12; dy += 2) {
    for (let dx = -12; dx <= 12; dx += 2) {
      const s = nccShift(aS, bS, sw, sh, dx, dy);
      if (s > best) {
        best = s;
        bestDx = dx;
        bestDy = dy;
      }
    }
  }
  for (let dy = bestDy - 1; dy <= bestDy + 1; dy++) {
    for (let dx = bestDx - 1; dx <= bestDx + 1; dx++) {
      if (dx === bestDx && dy === bestDy) continue;
      if (dx < -12 || dx > 12 || dy < -12 || dy > 12) continue;
      const s = nccShift(aS, bS, sw, sh, dx, dy);
      if (s > best) {
        best = s;
        bestDx = dx;
        bestDy = dy;
      }
    }
  }

  const dx = Math.round(bestDx * (wa / sw));
  const dy = Math.round(bestDy * (ha / sh));
  const fill = mean(fitted);
  const data = new Float32Array(wa * ha);
  for (let y = 0; y < ha; y++) {
    for (let x = 0; x < wa; x++) {
      data[y * wa + x] = sampleBilinear(fitted, wa, ha, x - dx, y - dy, fill);
    }
  }

  return { data, w: wa, h: ha, dx, dy, score: best };
}

function resizeGray(
  src: Float32Array,
  sw: number,
  sh: number,
  nw: number,
  nh: number,
): Float32Array {
  if (sw === nw && sh === nh) return src;
  const out = new Float32Array(nw * nh);
  const sx = sw / nw;
  const sy = sh / nh;
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      out[y * nw + x] = sampleBilinear(src, sw, sh, (x + 0.5) * sx - 0.5, (y + 0.5) * sy - 0.5, 0.78);
    }
  }
  return out;
}

function downsample(src: Float32Array, w: number, h: number, nw: number, nh: number): Float32Array {
  const out = new Float32Array(nw * nh);
  const sx = w / nw;
  const sy = h / nh;
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      out[y * nw + x] = src[Math.min(h - 1, Math.floor(y * sy)) * w + Math.min(w - 1, Math.floor(x * sx))];
    }
  }
  return out;
}

function nccShift(
  a: Float32Array,
  b: Float32Array,
  w: number,
  h: number,
  dx: number,
  dy: number,
): number {
  const x0 = Math.max(0, dx);
  const x1 = Math.min(w, w + dx);
  const y0 = Math.max(0, dy);
  const y1 = Math.min(h, h + dy);
  if (x1 - x0 < 8 || y1 - y0 < 8) return -1;
  let n = 0;
  let sa = 0;
  let sb = 0;
  let saa = 0;
  let sbb = 0;
  let sab = 0;
  for (let y = y0; y < y1; y++) {
    const ia = y * w;
    const ib = (y - dy) * w - dx;
    for (let x = x0; x < x1; x++) {
      const va = a[ia + x];
      const vb = b[ib + x];
      sa += va;
      sb += vb;
      saa += va * va;
      sbb += vb * vb;
      sab += va * vb;
      n += 1;
    }
  }
  const da = saa - (sa * sa) / n;
  const db = sbb - (sb * sb) / n;
  const denom = Math.sqrt(Math.max(0, da) * Math.max(0, db));
  if (denom < 1e-12) return -1;
  return (sab - (sa * sb) / n) / denom;
}

function sampleBilinear(
  src: Float32Array,
  w: number,
  h: number,
  x: number,
  y: number,
  fill: number,
): number {
  if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) return fill;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const i00 = y0 * w + x0;
  return (
    src[i00] * (1 - fx) * (1 - fy) +
    src[i00 + 1] * fx * (1 - fy) +
    src[i00 + w] * (1 - fx) * fy +
    src[i00 + w + 1] * fx * fy
  );
}
