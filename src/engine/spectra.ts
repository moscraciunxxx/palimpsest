import { clamp01, clampByte, createImage } from "./pixels";

/**
 * Three-channel unmixing. A real MSI camera would use 365–940 nm.
 * Here the older hand is the cool residual against estimated paper;
 * the later hand is the warm / red-biased residual. Carbon is the
 * achromatic remainder. Faded undertext is mid-tone — we must not
 * require darkness before chemistry is allowed to speak.
 */
export type InkShares = {
  iron: number;
  carbon: number;
  later: number;
  ink: number;
};

export type PaperEstimate = { r: number; g: number; b: number };

export type ProbeReading = InkShares & {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
};

export function estimatePaper(source: ImageData): PaperEstimate {
  const { data } = source;
  const hr = new Uint32Array(256);
  const hg = new Uint32Array(256);
  const hb = new Uint32Array(256);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const R = data[i];
    const G = data[i + 1];
    const B = data[i + 2];
    const y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    if (y < 150) continue;
    hr[R]++;
    hg[G]++;
    hb[B]++;
    count++;
  }
  if (count < 32) return { r: 234, g: 220, b: 190 };
  return {
    r: percentileFromHist(hr, count, 0.88),
    g: percentileFromHist(hg, count, 0.88),
    b: percentileFromHist(hb, count, 0.88),
  };
}

export function unmixPixel(R: number, G: number, B: number, paper: PaperEstimate): InkShares {
  const dR = (paper.r - R) / 255;
  const dG = (paper.g - G) / 255;
  const dB = (paper.b - B) / 255;
  const ink = clamp01((Math.max(0, dR) + Math.max(0, dG) + Math.max(0, dB)) / 3);
  const cool = clamp01((dR - dG) * 3.2);
  const warm = clamp01((dB - dR) * 2.8);
  const redBias = clamp01((R - B) / 160);
  const iron = clamp01(cool * (0.58 + 0.42 * clamp01(ink * 2.6)));
  const later = clamp01((warm * 0.6 + redBias * 0.55) * (0.22 + 0.78 * ink));
  const carbon = Math.max(0, ink - iron * 0.72 - later * 0.72);
  return { iron, carbon, later, ink };
}

export function probeInk(source: ImageData, x: number, y: number, radius = 5): ProbeReading | null {
  const { width: w, height: h, data } = source;
  const cx = Math.round(x);
  const cy = Math.round(y);
  if (cx < 0 || cy < 0 || cx >= w || cy >= h) return null;
  const paper = estimatePaper(source);
  const x0 = Math.max(0, cx - radius);
  const y0 = Math.max(0, cy - radius);
  const x1 = Math.min(w - 1, cx + radius);
  const y1 = Math.min(h - 1, cy + radius);
  let iron = 0;
  let carbon = 0;
  let later = 0;
  let ink = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      const i = (yy * w + xx) * 4;
      const R = data[i];
      const G = data[i + 1];
      const B = data[i + 2];
      const u = unmixPixel(R, G, B, paper);
      iron += u.iron;
      carbon += u.carbon;
      later += u.later;
      ink += u.ink;
      r += R;
      g += G;
      b += B;
      n++;
    }
  }
  if (!n) return null;
  return {
    x: cx,
    y: cy,
    r: r / n,
    g: g / n,
    b: b / n,
    iron: iron / n,
    carbon: carbon / n,
    later: later / n,
    ink: ink / n,
  };
}

export function splitInks(source: ImageData): {
  undertext: ImageData;
  overtext: ImageData;
  ironGall: number;
  carbon: number;
  later: number;
} {
  const { width: w, height: h, data } = source;
  const n = w * h;
  const paper = estimatePaper(source);
  const iron = new Float32Array(n);
  const later = new Float32Array(n);
  const carbon = new Float32Array(n);

  let massIron = 0;
  let massLater = 0;
  let massCarbon = 0;

  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const u = unmixPixel(data[i], data[i + 1], data[i + 2], paper);
    iron[p] = u.iron;
    later[p] = u.later;
    carbon[p] = u.carbon;
    if (u.ink > 0.035 || u.iron > 0.03) {
      massIron += u.iron;
      massLater += u.later;
      massCarbon += u.carbon;
    }
  }

  const mass = massIron + massLater + massCarbon;
  const undertext = createImage(w, h, [12, 10, 18, 255]);
  const overtext = createImage(w, h, [243, 238, 228, 255]);
  const ud = undertext.data;
  const od = overtext.data;

  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const glow = clamp01(iron[p] * 11.5);
    if (glow > 0.02) {
      ud[i] = clampByte(12 + (214 - 12) * glow);
      ud[i + 1] = clampByte(10 + (176 - 10) * glow);
      ud[i + 2] = clampByte(18 + (72 - 18) * glow);
    }
    const hand = clamp01(later[p] * 4.6 + carbon[p] * 2.1);
    if (hand > 0) {
      od[i] = clampByte(243 * (1 - hand) + 92 * hand);
      od[i + 1] = clampByte(238 * (1 - hand) + 28 * hand);
      od[i + 2] = clampByte(228 * (1 - hand) + 22 * hand);
    }
  }

  return {
    undertext,
    overtext,
    ironGall: mass > 0 ? massIron / mass : 0,
    carbon: mass > 0 ? massCarbon / mass : 0,
    later: mass > 0 ? massLater / mass : 0,
  };
}

function percentileFromHist(h: Uint32Array, total: number, p: number): number {
  const target = total * p;
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += h[i];
    if (acc >= target) return i;
  }
  return 255;
}
