import { boxBlur } from "./filters";
import { clamp01, createImage, mean, variance } from "./pixels";

export function estimateRelief(gray: Float32Array, w: number, h: number): Float32Array {
  const blur = boxBlur(gray, w, h, 2);
  const hi = boxExtremum(gray, w, h, 2, true);
  const lo = boxExtremum(gray, w, h, 2, false);
  const relief = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const residual = gray[i] - blur[i];
    const range = hi[i] - lo[i];
    relief[i] = residual * (1 + 2.2 * range) - 0.12 * (gray[i] - 0.5);
  }
  const mu = mean(relief);
  const s = Math.sqrt(variance(relief, mu)) || 1;
  const inv = 1 / (2.6 * s);
  for (let i = 0; i < relief.length; i++) {
    const v = (relief[i] - mu) * inv;
    relief[i] = v < -1 ? -1 : v > 1 ? 1 : v;
  }
  return relief;
}

export function rake(
  gray: Float32Array,
  relief: Float32Array,
  w: number,
  h: number,
  azimuthDeg: number,
  elevationDeg: number,
): ImageData {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (Math.max(10, Math.min(80, elevationDeg)) * Math.PI) / 180;
  const cosEl = Math.cos(el);
  const lx = cosEl * Math.cos(az);
  const ly = -cosEl * Math.sin(az);
  const lz = Math.sin(el);
  const gain = 16;
  const out = createImage(w, h, [232, 215, 184, 255]);
  const d = out.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const dzdx =
        x > 0 && x < w - 1
          ? (relief[p + 1] - relief[p - 1]) * 0.5
          : x < w - 1
            ? relief[p + 1] - relief[p]
            : relief[p] - relief[p - 1];
      const dzdy =
        y > 0 && y < h - 1
          ? (relief[p + w] - relief[p - w]) * 0.5
          : y < h - 1
            ? relief[p + w] - relief[p]
            : relief[p] - relief[p - w];
      let nx = -dzdx * gain;
      let ny = -dzdy * gain;
      let nz = 1;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;
      const ndotl = Math.max(0, nx * lx + ny * ly + nz * lz);
      const shade = 0.16 + 0.84 * ndotl;
      const g = gray[p];
      const paper = 0.32 + 0.68 * g;
      const t = clamp01(shade * paper);
      const i = p * 4;
      d[i] = Math.round(44 + (236 - 44) * t);
      d[i + 1] = Math.round(28 + (218 - 28) * t);
      d[i + 2] = Math.round(16 + (186 - 16) * t);
    }
  }
  return out;
}

function boxExtremum(
  src: Float32Array,
  w: number,
  h: number,
  radius: number,
  pickMax: boolean,
): Float32Array {
  const r = Math.max(1, Math.round(radius));
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const seed = pickMax ? -1e9 : 1e9;

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let v = seed;
      for (let k = -r; k <= r; k++) {
        const s = src[row + clampX(x + k, w)];
        if (pickMax) {
          if (s > v) v = s;
        } else if (s < v) {
          v = s;
        }
      }
      tmp[row + x] = v;
    }
  }

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let v = seed;
      for (let k = -r; k <= r; k++) {
        const s = tmp[clampY(y + k, h) * w + x];
        if (pickMax) {
          if (s > v) v = s;
        } else if (s < v) {
          v = s;
        }
      }
      out[y * w + x] = v;
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
