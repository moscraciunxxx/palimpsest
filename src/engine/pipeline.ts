import {
  correctIllumination,
  detectLacunae,
  estimateSkew,
  inkMap,
  inkVisualization,
  lacunaVisualization,
  restore,
  rotateGray,
  sauvola,
  unsharp,
} from "./filters";
import { detectLines, extractRegions } from "./layout";
import { fromGray, mean, percentile, toGray, variance } from "./pixels";
import type { LayerId, PipelineResult } from "./types";

export async function runPipeline(source: ImageData): Promise<PipelineResult> {
  const t0 = performance.now();
  const w0 = source.width;
  const h0 = source.height;
  const gray0 = toGray(source);
  const contrast0 = percentile(gray0, 0.9) - percentile(gray0, 0.1);

  const skew = estimateSkew(gray0, w0, h0);
  const rotated = rotateGray(gray0, w0, h0, -skew, mean(gray0));
  const w = rotated.w;
  const h = rotated.h;
  const deskewed = rotated.data;

  const lit = correctIllumination(deskewed, w, h);
  const sharp = unsharp(lit, w, h, 1.15);
  const inkRgb = rotateGray(inkMap(source), w0, h0, -skew, 0).data;
  const inkAligned = fuseInk(inkRgb, sharp);
  const binary = sauvola(sharp, w, h, 25, 0.22);
  const holes = detectLacunae(source, deskewed, inkAligned);
  const lacunaRot = rotateGray(holes.combined, w0, h0, -skew, 0).data;

  const illuminationImg = fromGray(sharp, w, h);
  const inkImg = inkVisualization(inkAligned, w, h);
  const binaryImg = fromGray(binary, w, h);
  const lacunaImg = lacunaVisualization(holes, w0, h0);
  const restored = restore(source, sharp, inkAligned, lacunaRot);

  const lacunae = extractRegions(
    holes.combined,
    holes.stain,
    holes.wash,
    holes.mold,
    holes.tear,
    w0,
    h0,
  );
  const lines = detectLines(binary, lacunaRot, w, h);

  const contrast1 = percentile(sharp, 0.9) - percentile(sharp, 0.1);
  const readable = lines.reduce((s, l) => s + (l.y1 - l.y0) * (l.x1 - l.x0), 0) / (w * h);
  const lacunaArea = holes.combined.reduce((s, v) => s + (v > 0.35 ? 1 : 0), 0) / holes.combined.length;
  const meanInk = mean(inkAligned);

  const notes: string[] = [];
  if (Math.abs(skew) >= 0.5) notes.push(`Deskewed ${skew.toFixed(1)}° using projection-profile energy.`);
  else notes.push("Page was already square to the camera; no material skew.");
  notes.push("Illumination divided out with a large-kernel paper estimate (homomorphic-style).");
  notes.push("Ink isolated via Beer–Lambert optical density in RGB.");
  notes.push("Glyphs thresholded with Sauvola adaptive windows — local, not global.");
  if (lacunae.length) {
    notes.push(
      `${lacunae.length} lacunae marked. Restored layer inpaints paper fiber only — never invented letters.`,
    );
  } else {
    notes.push("No severe lacunae. Transcription can proceed with ordinary caution.");
  }

  const layers: Record<LayerId, ImageData> = {
    original: source,
    illumination: illuminationImg,
    ink: inkImg,
    binary: binaryImg,
    lacuna: lacunaImg,
    restored,
  };

  return {
    width: w,
    height: h,
    layers,
    lacunae,
    lines,
    metrics: {
      skewDegrees: skew,
      contrastGain: contrast0 > 1e-6 ? contrast1 / contrast0 : 1,
      readableArea: readable,
      lacunaArea,
      meanInk,
      paperVariance: variance(lit),
      elapsedMs: performance.now() - t0,
    },
    notes,
  };
}

function fuseInk(optical: Float32Array, gray: Float32Array): Float32Array {
  const out = new Float32Array(optical.length);
  for (let i = 0; i < out.length; i++) {
    const fromGray = Math.max(0, Math.min(1, (0.72 - gray[i]) / 0.55));
    out[i] = Math.max(0, Math.min(1, optical[i] * 0.55 + fromGray * 0.7));
  }
  return out;
}
