import { createImage, imageToCanvas } from "./pixels";
import type { PipelineResult } from "./types";

export interface WitnessReport {
  agreeRatio: number;
  dissentRatio: number;
  agreed: ImageData;
  dissent: ImageData;
}

export function scaleImage(src: ImageData, w: number, h: number): ImageData {
  const from = imageToCanvas(src);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(from, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function isInk(data: Uint8ClampedArray, i: number): boolean {
  return (data[i] + data[i + 1] + data[i + 2]) / 3 < 140;
}

export function compareWitness(primary: ImageData, secondary: ImageData): WitnessReport {
  const w = primary.width;
  const h = primary.height;
  const b = secondary.width === w && secondary.height === h ? secondary : scaleImage(secondary, w, h);
  const agreed = createImage(w, h, [243, 238, 228, 255]);
  const dissent = createImage(w, h, [243, 238, 228, 255]);
  let inkA = 0;
  let both = 0;
  let xor = 0;

  for (let i = 0; i < primary.data.length; i += 4) {
    const a = isInk(primary.data, i);
    const s = isInk(b.data, i);
    if (a) inkA += 1;
    if (a && s) {
      both += 1;
      agreed.data[i] = 18;
      agreed.data[i + 1] = 16;
      agreed.data[i + 2] = 14;
    }
    if (a !== s) {
      xor += 1;
      dissent.data[i] = 138;
      dissent.data[i + 1] = 52;
      dissent.data[i + 2] = 40;
    }
  }

  return {
    agreeRatio: inkA ? both / inkA : 1,
    dissentRatio: inkA ? xor / inkA : 0,
    agreed,
    dissent,
  };
}

export function applyWitness(result: PipelineResult, secondPhoto: ImageData): {
  result: PipelineResult;
  report: WitnessReport;
} {
  const report = compareWitness(result.layers.binary, secondPhoto);
  const notes = [
    ...result.notes.filter((n) => !n.startsWith("Dual-witness")),
    `Dual-witness: ${(report.agreeRatio * 100).toFixed(0)}% of ink agrees with the second photograph. Disagreement is a hole, not a vote.`,
  ];
  return {
    report,
    result: {
      ...result,
      layers: { ...result.layers, binary: report.agreed },
      notes,
    },
  };
}

export function leafFingerprint(img: ImageData): string {
  const d = img.data;
  let h = 2166136261;
  for (let i = 0; i < d.length; i += 97) {
    h ^= d[i];
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
