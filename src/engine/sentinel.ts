import { boxBlur } from "./filters";
import { clamp01, clampByte, createImage } from "./pixels";

export function sentinelMap(
  gray: Float32Array,
  w: number,
  h: number,
): { image: ImageData; refuse: number } {
  const n = w * h;
  const ix2 = new Float32Array(n);
  const iy2 = new Float32Array(n);
  const ixiy = new Float32Array(n);

  for (let y = 0; y < h; y++) {
    const ym = y > 0 ? y - 1 : 0;
    const yp = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const xm = x > 0 ? x - 1 : 0;
      const xp = x < w - 1 ? x + 1 : w - 1;
      const tl = gray[ym * w + xm];
      const tc = gray[ym * w + x];
      const tr = gray[ym * w + xp];
      const ml = gray[y * w + xm];
      const mr = gray[y * w + xp];
      const bl = gray[yp * w + xm];
      const bc = gray[yp * w + x];
      const br = gray[yp * w + xp];
      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const p = y * w + x;
      ix2[p] = gx * gx;
      iy2[p] = gy * gy;
      ixiy[p] = gx * gy;
    }
  }

  const jxx = boxBlur(ix2, w, h, 2);
  const jyy = boxBlur(iy2, w, h, 2);
  const jxy = boxBlur(ixiy, w, h, 2);

  const image = createImage(w, h, [232, 215, 184, 255]);
  const d = image.data;
  let darkN = 0;
  let refuseN = 0;

  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const trace = jxx[p] + jyy[p];
    const det = jxx[p] * jyy[p] - jxy[p] * jxy[p];
    const disc = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
    const coh = (2 * disc) / (trace + 1e-6);
    const dark = gray[p] < 0.55;
    if (dark) {
      darkN += 1;
      if (coh < 0.36) refuseN += 1;
    }
    const stain = clamp01((0.55 - gray[p]) / 0.28) * clamp01((0.36 - coh) / 0.36);
    if (stain > 0.02) {
      d[i] = clampByte(232 * (1 - stain) + 138 * stain);
      d[i + 1] = clampByte(215 * (1 - stain) + 52 * stain);
      d[i + 2] = clampByte(184 * (1 - stain) + 40 * stain);
    }
  }

  return { image, refuse: darkN ? refuseN / darkN : 0 };
}
