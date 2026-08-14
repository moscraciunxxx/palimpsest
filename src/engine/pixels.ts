export function createImage(w: number, h: number, fill = [0, 0, 0, 255]): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3];
  }
  return new ImageData(data, w, h);
}

export function cloneImage(src: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

export function imageToCanvas(img: ImageData): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d")!.putImageData(img, 0, 0);
  return c;
}

export function canvasToImage(c: HTMLCanvasElement): ImageData {
  return c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
}

export function drawImageElement(
  source: CanvasImageSource,
  maxW = 920,
): ImageData {
  const w = "width" in source ? Number(source.width) : maxW;
  const h = "height" in source ? Number(source.height) : maxW;
  const scale = Math.min(1, maxW / Math.max(w, 1));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(source as CanvasImageSource, 0, 0, cw, ch);
  return ctx.getImageData(0, 0, cw, ch);
}

export function toGray(img: ImageData): Float32Array {
  const { data, width, height } = img;
  const g = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    g[p] = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  }
  return g;
}

export function fromGray(gray: Float32Array, w: number, h: number): ImageData {
  const out = createImage(w, h);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p] * 255)));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = 255;
  }
  return out;
}

export function rgbChannels(img: ImageData) {
  const n = img.width * img.height;
  const r = new Float32Array(n);
  const g = new Float32Array(n);
  const b = new Float32Array(n);
  const d = img.data;
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    r[p] = d[i] / 255;
    g[p] = d[i + 1] / 255;
    b[p] = d[i + 2] / 255;
  }
  return { r, g, b };
}

export function composeRgb(
  r: Float32Array,
  g: Float32Array,
  b: Float32Array,
  w: number,
  h: number,
): ImageData {
  const out = createImage(w, h);
  for (let p = 0, i = 0; p < r.length; p++, i += 4) {
    out.data[i] = clampByte(r[p] * 255);
    out.data[i + 1] = clampByte(g[p] * 255);
    out.data[i + 2] = clampByte(b[p] * 255);
    out.data[i + 3] = 255;
  }
  return out;
}

export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function mean(arr: Float32Array): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

export function variance(arr: Float32Array, m?: number): number {
  const mu = m ?? mean(arr);
  let s = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = arr[i] - mu;
    s += d * d;
  }
  return s / arr.length;
}

export function percentile(arr: Float32Array, p: number): number {
  const copy = Array.from(arr);
  copy.sort((a, b) => a - b);
  const i = Math.max(0, Math.min(copy.length - 1, Math.floor(p * (copy.length - 1))));
  return copy[i];
}
