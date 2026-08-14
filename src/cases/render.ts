import type { CaseFile } from "./catalog";
import { canvasToImage } from "../engine/pixels";

export function renderCase(file: CaseFile): ImageData {
  const w = 720;
  const h = 980;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  paintPaper(ctx, w, h, file);
  paintText(ctx, file, w, h);
  distress(ctx, w, h, file);
  return rotateLeaf(c, file.id === "clinic" ? 1.6 : file.id === "amina" ? -2.4 : 2.8);
}

function paintPaper(ctx: CanvasRenderingContext2D, w: number, h: number, file: CaseFile) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  if (file.font === "carbon") {
    g.addColorStop(0, "#d8d2c4");
    g.addColorStop(1, "#c9c0ae");
  } else if (file.font === "diploma") {
    g.addColorStop(0, "#efe4c8");
    g.addColorStop(1, "#e2d1a8");
  } else {
    g.addColorStop(0, "#ead9b6");
    g.addColorStop(1, "#d8c29a");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const noise = ctx.getImageData(0, 0, w, h);
  const d = noise.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (hash(i) - 0.5) * 28;
    d[i] = clamp(d[i] + n);
    d[i + 1] = clamp(d[i + 1] + n * 0.9);
    d[i + 2] = clamp(d[i + 2] + n * 0.7);
  }
  ctx.putImageData(noise, 0, 0);

  ctx.strokeStyle = "rgba(90, 60, 30, 0.08)";
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(hash(i * 13) * w, 0);
    ctx.bezierCurveTo(
      hash(i * 17) * w,
      hash(i * 19) * h,
      hash(i * 23) * w,
      hash(i * 29) * h,
      hash(i * 31) * w,
      h,
    );
    ctx.stroke();
  }

  if (file.font === "deed" || file.font === "carbon") {
    ctx.strokeStyle = "rgba(40, 70, 120, 0.12)";
    for (let y = 86; y < h - 40; y += 22) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(w - 48, y);
      ctx.stroke();
    }
  }
}

function paintText(ctx: CanvasRenderingContext2D, file: CaseFile, w: number, h: number) {
  const lines = file.groundTruth.split("\n");
  const fonts: Record<CaseFile["font"], { face: string; size: number; color: string; leading: number }> = {
    deed: { face: "13px 'Special Elite', monospace", size: 13, color: "rgba(22, 16, 10, 0.92)", leading: 21 },
    hand: { face: "24px Caveat, cursive", size: 24, color: "rgba(32, 20, 12, 0.88)", leading: 30 },
    carbon: { face: "13px 'IBM Plex Mono', monospace", size: 13, color: "rgba(58, 24, 88, 0.62)", leading: 20 },
    diploma: { face: "italic 18px 'Cormorant Garamond', serif", size: 18, color: "rgba(28, 20, 12, 0.9)", leading: 25 },
    recipe: { face: "22px Caveat, cursive", size: 22, color: "rgba(40, 24, 12, 0.88)", leading: 27 },
  };
  const f = fonts[file.font];
  ctx.fillStyle = f.color;
  ctx.font = f.face;
  ctx.textBaseline = "top";

  let y = file.font === "diploma" ? 88 : 64;
  const x = 56;
  for (const line of lines) {
    if (y > h - 70) break;
    const wobble = file.font === "hand" || file.font === "recipe" ? (hash(y) - 0.5) * 3 : 0;
    ctx.fillText(line, x + wobble, y);
    y += f.leading;
  }

  if (file.font === "diploma") {
    ctx.strokeStyle = "rgba(140, 100, 40, 0.45)";
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, w - 56, h - 56);
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, w - 72, h - 72);
  }
}

function distress(ctx: CanvasRenderingContext2D, w: number, h: number, file: CaseFile) {
  ctx.save();

  if (file.id === "kerala" || file.id === "idai") {
    bloom(ctx, 180, 220, 210, "rgba(78, 52, 28, 0.38)");
    bloom(ctx, 520, 640, 260, "rgba(60, 40, 22, 0.32)");
    bloom(ctx, 300, 860, 180, "rgba(90, 70, 40, 0.22)");
    tide(ctx, w, h, 0.62);
  }
  if (file.id === "amina") {
    fold(ctx, w, h);
    fox(ctx, w, h, 18);
    fadeBand(ctx, w, h, 0.35, 0.7);
  }
  if (file.id === "clinic") {
    glare(ctx, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0, 0, w, h);
  }
  if (file.id === "idai") {
    mold(ctx, 560, 180, 90);
    tearCorner(ctx, w);
  }
  if (file.id === "recipe") {
    ring(ctx, 210, 240, 70);
    bloom(ctx, 480, 520, 140, "rgba(160, 110, 40, 0.28)");
    bloom(ctx, 140, 780, 120, "rgba(120, 80, 30, 0.22)");
  }

  // Global fade + slight rotation to give the pipeline real work.
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const x = (i / 4) % w;
    const y = Math.floor(i / 4 / w);
    const vignette = 1 - Math.hypot(x / w - 0.5, y / h - 0.5) * 0.35;
    const fade = file.font === "carbon" ? 0.78 : 0.9;
    d[i] = clamp(d[i] * fade * vignette + 18);
    d[i + 1] = clamp(d[i + 1] * fade * vignette + 14);
    d[i + 2] = clamp(d[i + 2] * fade * vignette + 8);
  }
  ctx.putImageData(img, 0, 0);
  ctx.restore();
}

function bloom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 4, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function tide(ctx: CanvasRenderingContext2D, w: number, h: number, at: number) {
  ctx.fillStyle = "rgba(70, 50, 30, 0.16)";
  ctx.beginPath();
  ctx.moveTo(0, h * at);
  for (let x = 0; x <= w; x += 8) {
    ctx.lineTo(x, h * at + Math.sin(x / 28) * 14 + Math.sin(x / 9) * 5);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
}

function fold(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = "rgba(40, 28, 16, 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 0);
  ctx.lineTo(w * 0.48, h);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 240, 210, 0.18)";
  ctx.beginPath();
  ctx.moveTo(w * 0.5 + 3, 0);
  ctx.lineTo(w * 0.48 + 3, h);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function fox(ctx: CanvasRenderingContext2D, w: number, h: number, n: number) {
  for (let i = 0; i < n; i++) {
    bloom(
      ctx,
      hash(i * 3) * w,
      hash(i * 7) * h,
      20 + hash(i * 11) * 40,
      `rgba(150, 80, 20, ${0.08 + hash(i) * 0.12})`,
    );
  }
}

function fadeBand(ctx: CanvasRenderingContext2D, w: number, h: number, y0: number, y1: number) {
  ctx.fillStyle = "rgba(232, 214, 180, 0.35)";
  ctx.fillRect(0, h * y0, w, h * (y1 - y0));
}

function glare(ctx: CanvasRenderingContext2D, w: number, _h: number) {
  const g = ctx.createLinearGradient(0, 0, w, _h * 0.4);
  g.addColorStop(0, "rgba(255,255,255,0.0)");
  g.addColorStop(0.4, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, _h);
}

function mold(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  bloom(ctx, x, y, r, "rgba(40, 80, 36, 0.4)");
  bloom(ctx, x + 30, y + 20, r * 0.6, "rgba(20, 40, 18, 0.35)");
}

function tearCorner(ctx: CanvasRenderingContext2D, w: number) {
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(w - 90, 0);
  ctx.lineTo(w, 110);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.strokeStyle = "rgba(130, 80, 30, 0.28)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function rotateLeaf(src: HTMLCanvasElement, deg: number): ImageData {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#cbb892";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return canvasToImage(out);
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(v: number) {
  return Math.max(0, Math.min(255, v));
}
