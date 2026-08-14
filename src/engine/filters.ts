import { clamp01, fromGray, rgbChannels } from "./pixels";

export function boxBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const r = Math.max(1, Math.round(radius));
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);

  for (let y = 0; y < h; y++) {
    let acc = 0;
    const row = y * w;
    for (let x = -r; x <= r; x++) acc += src[row + clampX(x, w)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / (2 * r + 1);
      acc += src[row + clampX(x + r + 1, w)] - src[row + clampX(x - r, w)];
    }
  }

  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[clampY(y, h) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[clampY(y + r + 1, h) * w + x] - tmp[clampY(y - r, h) * w + x];
    }
  }
  return out;
}

function clampX(x: number, w: number) {
  return x < 0 ? 0 : x >= w ? w - 1 : x;
}
function clampY(y: number, h: number) {
  return y < 0 ? 0 : y >= h ? h - 1 : y;
}

export function correctIllumination(gray: Float32Array, w: number, h: number): Float32Array {
  const radius = Math.max(18, Math.round(Math.min(w, h) / 14));
  const bg = boxBlur(gray, w, h, radius);
  const out = new Float32Array(gray.length);
  let paper = 0;
  const step = Math.max(1, Math.floor(gray.length / 4000));
  let n = 0;
  for (let i = 0; i < gray.length; i += step) {
    paper += bg[i];
    n++;
  }
  const target = (paper / n) || 0.72;
  for (let i = 0; i < gray.length; i++) {
    out[i] = clamp01((gray[i] / (bg[i] + 1e-4)) * target);
  }
  return out;
}

export function unsharp(gray: Float32Array, w: number, h: number, amount = 0.85): Float32Array {
  const blur = boxBlur(gray, w, h, 2);
  const out = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = clamp01(gray[i] + amount * (gray[i] - blur[i]));
  }
  return out;
}

export function rotateGray(
  gray: Float32Array,
  w: number,
  h: number,
  deg: number,
  fill = 0.78,
): { data: Float32Array; w: number; h: number } {
  if (Math.abs(deg) < 0.05) return { data: gray, w, h };
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const nw = w;
  const nh = h;
  const out = new Float32Array(nw * nh);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const ncx = (nw - 1) / 2;
  const ncy = (nh - 1) / 2;
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const dx = x - ncx;
      const dy = y - ncy;
      const sx = cos * dx + sin * dy + cx;
      const sy = -sin * dx + cos * dy + cy;
      out[y * nw + x] = sampleBilinear(gray, w, h, sx, sy, fill);
    }
  }
  return { data: out, w: nw, h: nh };
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
  const i10 = i00 + 1;
  const i01 = i00 + w;
  const i11 = i01 + 1;
  return (
    src[i00] * (1 - fx) * (1 - fy) +
    src[i10] * fx * (1 - fy) +
    src[i01] * (1 - fx) * fy +
    src[i11] * fx * fy
  );
}

export function estimateSkew(gray: Float32Array, w: number, h: number): number {
  const scale = Math.min(1, 220 / w);
  const sw = Math.max(32, Math.round(w * scale));
  const sh = Math.max(32, Math.round(h * scale));
  const small = downsample(gray, w, h, sw, sh);
  let bestAngle = 0;
  let bestScore = -Infinity;
  for (let deg = -8; deg <= 8; deg += 0.5) {
    const { data } = rotateGray(small, sw, sh, deg);
    const score = projectionEnergy(data, sw, sh);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = deg;
    }
  }
  return bestAngle;
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

function projectionEnergy(gray: Float32Array, w: number, h: number): number {
  const proj = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    let s = 0;
    const row = y * w;
    for (let x = 0; x < w; x++) s += 1 - gray[row + x];
    proj[y] = s;
  }
  let mean = 0;
  for (let i = 0; i < h; i++) mean += proj[i];
  mean /= h;
  let varSum = 0;
  for (let i = 0; i < h; i++) {
    const d = proj[i] - mean;
    varSum += d * d;
  }
  return varSum / h;
}

export function sauvola(
  gray: Float32Array,
  w: number,
  h: number,
  window = 21,
  k = 0.28,
): Float32Array {
  const { sat, sat2 } = integrals(gray, w, h);
  const r = Math.floor(window / 2);
  const R = 0.5;
  const out = new Float32Array(gray.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const y0 = Math.max(0, y - r);
      const x1 = Math.min(w, x + r + 1);
      const y1 = Math.min(h, y + r + 1);
      const n = (x1 - x0) * (y1 - y0);
      const sum = rect(sat, w, x0, y0, x1, y1);
      const sum2 = rect(sat2, w, x0, y0, x1, y1);
      const m = sum / n;
      const s = Math.sqrt(Math.max(0, sum2 / n - m * m));
      const t = m * (1 + k * (s / R - 1));
      out[y * w + x] = gray[y * w + x] < t ? 0 : 1;
    }
  }
  return out;
}

function integrals(gray: Float32Array, w: number, h: number) {
  const W = w + 1;
  const sat = new Float64Array((w + 1) * (h + 1));
  const sat2 = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y++) {
    for (let x = 1; x <= w; x++) {
      const v = gray[(y - 1) * w + (x - 1)];
      const i = y * W + x;
      sat[i] = v + sat[i - 1] + sat[i - W] - sat[i - W - 1];
      sat2[i] = v * v + sat2[i - 1] + sat2[i - W] - sat2[i - W - 1];
    }
  }
  return { sat, sat2 };
}

function rect(sat: Float64Array, w: number, x0: number, y0: number, x1: number, y1: number) {
  const W = w + 1;
  return sat[y1 * W + x1] - sat[y0 * W + x1] - sat[y1 * W + x0] + sat[y0 * W + x0];
}

/** Beer–Lambert ink separation: treat paper as I0, ink as optical density. */
export function inkMap(img: ImageData): Float32Array {
  const { r, g, b } = rgbChannels(img);
  const n = r.length;
  const od = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const rr = -Math.log(Math.max(r[i], 0.02));
    const gg = -Math.log(Math.max(g[i], 0.02));
    const bb = -Math.log(Math.max(b[i], 0.02));
    // Brown/black iron-gall & ballpoint sit heavier in blue/green.
    od[i] = 0.25 * rr + 0.4 * gg + 0.35 * bb;
  }
  let max = 1e-6;
  for (let i = 0; i < n; i++) if (od[i] > max) max = od[i];
  for (let i = 0; i < n; i++) od[i] /= max;
  return od;
}

export function inkVisualization(ink: Float32Array, w: number, h: number): ImageData {
  const paper = fromGray(new Float32Array(ink.length).fill(0.93), w, h);
  for (let p = 0, i = 0; p < ink.length; p++, i += 4) {
    const t = Math.pow(ink[p], 0.85);
    paper.data[i] = Math.round(232 * (1 - t) + 28 * t);
    paper.data[i + 1] = Math.round(220 * (1 - t) + 22 * t);
    paper.data[i + 2] = Math.round(196 * (1 - t) + 18 * t);
  }
  return paper;
}

export interface LacunaPixel {
  stain: Float32Array;
  wash: Float32Array;
  tear: Float32Array;
  mold: Float32Array;
  combined: Float32Array;
}

export function detectLacunae(
  img: ImageData,
  gray: Float32Array,
  ink: Float32Array,
): LacunaPixel {
  const { width: w, height: h } = img;
  const { r, g, b } = rgbChannels(img);
  const local = boxBlur(gray, w, h, 7);
  const stain = new Float32Array(gray.length);
  const wash = new Float32Array(gray.length);
  const tear = new Float32Array(gray.length);
  const mold = new Float32Array(gray.length);
  const combined = new Float32Array(gray.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const mx = Math.max(r[p], g[p], b[p]);
      const mn = Math.min(r[p], g[p], b[p]);
      const chroma = mx - mn;
      const edge =
        x < 10 || y < 10 || x > w - 11 || y > h - 11 ? 1 : 0;
      stain[p] = clamp01((0.55 - gray[p]) * 1.6 + chroma * 1.3);
      wash[p] = clamp01((gray[p] - 0.78) * 3.2) * clamp01(0.12 - ink[p] * 0.4) *
        clamp01(0.08 - Math.abs(gray[p] - local[p]) * 4);
      const greenBias = g[p] - (r[p] + b[p]) * 0.5;
      mold[p] = clamp01(greenBias * 4.5) * clamp01(0.55 - gray[p]);
      tear[p] = edge * clamp01((gray[p] - 0.82) * 4);
      combined[p] = clamp01(Math.max(stain[p], wash[p] * 0.85, mold[p], tear[p]));
    }
  }
  return { stain, wash, tear, mold, combined };
}

export function lacunaVisualization(map: LacunaPixel, w: number, h: number): ImageData {
  const out = fromGray(new Float32Array(map.combined.length).fill(0.08), w, h);
  for (let p = 0, i = 0; p < map.combined.length; p++, i += 4) {
    const s = map.stain[p];
    const wa = map.wash[p];
    const m = map.mold[p];
    const t = map.tear[p];
    out.data[i] = clampByte(20 + s * 200 + t * 80);
    out.data[i + 1] = clampByte(18 + m * 170 + wa * 90);
    out.data[i + 2] = clampByte(22 + wa * 200 + t * 40);
    out.data[i + 3] = 255;
  }
  return out;
}

function clampByte(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function restore(
  img: ImageData,
  illumination: Float32Array,
  ink: Float32Array,
  lacuna: Float32Array,
): ImageData {
  const { width: w, height: h } = img;
  const out = new ImageData(w, h);
  for (let p = 0, i = 0; p < illumination.length; p++, i += 4) {
    const paper = 0.96;
    const inkAmt = Math.pow(Math.max(0, ink[p] - 0.08), 0.55);
    const hole = Math.pow(lacuna[p], 1.15);
    const mix = paper * (1 - inkAmt * 0.97);
    // Honest inpaint: fill lacunae with paper fiber, never invented glyphs.
    const r = mix * 250 * (1 - hole) + (228 + (p % 7)) * hole;
    const g = mix * 236 * (1 - hole) + (216 + ((p * 3) % 6)) * hole;
    const b = mix * 208 * (1 - hole) + (190 + ((p * 5) % 5)) * hole;
    const ir = 210 * inkAmt * (1 - hole);
    const ig = 196 * inkAmt * (1 - hole);
    const ib = 176 * inkAmt * (1 - hole);
    out.data[i] = clampByte(r - ir);
    out.data[i + 1] = clampByte(g - ig);
    out.data[i + 2] = clampByte(b - ib);
    out.data[i + 3] = 255;
  }
  return out;
}
