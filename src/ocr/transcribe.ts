import { createWorker } from "tesseract.js";
import { imageToCanvas } from "../engine/pixels";
import type { Dossier, Entity, PipelineResult } from "../engine/types";

let workerPromise: ReturnType<typeof createWorker> | null = null;

async function worker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng", 1, {
      errorHandler: () => undefined,
    });
  }
  return workerPromise;
}

export async function transcribe(
  result: PipelineResult,
  onProgress?: (p: number) => void,
): Promise<Dossier> {
  const canvas = imageToCanvas(result.layers.binary);
  const w = await worker();
  const { data } = await w.recognize(canvas, {}, { text: true });
  onProgress?.(1);
  const raw = (data.text || "").replace(/\u000c/g, "").trim();
  return buildDossier(raw, result, "tesseract");
}

export function buildDossier(
  raw: string,
  result: PipelineResult,
  source: Dossier["source"],
): Dossier {
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const diplomatic = lines
    .map((line, i) => {
      const layout = result.lines[i];
      const mark = layout && layout.confidence < 0.45 ? "  †" : "";
      const hole = layout && layout.lacunaOverlap > 0.22 ? "  ⟦lacuna⟧" : "";
      return `${line}${mark}${hole}`;
    })
    .join("\n");

  const inferredSpans = result.lacunae.slice(0, 6).map((l) => ({
    text: `〈${l.kind} ${Math.round(l.severity * 100)}%〉`,
    reason: `${l.kind} region at (${l.x},${l.y}) — not guessed as letters.`,
  }));

  const reconstruction = [
    diplomatic,
    "",
    inferredSpans.length
      ? "— Editorial note —\nLacunae are marked, not invented. A human archivist should complete the gaps from a second witness if one exists."
      : "— Editorial note —\nNo severe lacunae. Still treat OCR as a draft.",
  ].join("\n");

  return {
    rawText: raw,
    diplomatic,
    reconstruction,
    inferredSpans,
    entities: extractEntities(raw),
    caution:
      "Palimpsest distinguishes seen ink from inferred meaning. Anything in 〈angle brackets〉 or marked † is uncertain.",
    source,
  };
}

export function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  const seen = new Set<string>();
  const push = (type: Entity["type"], value: string, confidence: number) => {
    const key = `${type}:${value.toLowerCase()}`;
    if (seen.has(key) || value.length < 3) return;
    seen.add(key);
    entities.push({ type, text: value, confidence });
  };

  const date =
    text.match(
      /\b(\d{1,2}\s+\w+\s+\d{4}|\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4}|\d{4})\b/g,
    ) || [];
  date.slice(0, 6).forEach((d) => push("date", d, 0.72));

  const ids = text.match(/\b(?:No\.?|Survey No\.|OPV|Penta|ESM)\s*[:/]?\s*[\w/]+/gi) || [];
  ids.slice(0, 5).forEach((d) => push("identifier", d, 0.64));

  const money = text.match(/\b\d+\s+(?:cents|kg|\/\s*20)\b/gi) || [];
  money.forEach((d) => push("sum", d, 0.55));

  const proper = text.match(/\b[A-Z][A-Z'’a-z]+(?:\s+[A-Z][A-Z'’a-z]+){1,3}\b/g) || [];
  proper.slice(0, 8).forEach((d) => {
    if (/GOVERNMENT|OFFICE|THIS|THE|AFTER|WHEN|NOTES/i.test(d)) return;
    push("person", d, 0.5);
  });

  const places =
    text.match(
      /\b(Kerala|Alappuzha|Kuttanad|Haifa|Gulu|Patiko|Beira|Mozambique|Dondo|Kainakary|Paicho)\b/gi,
    ) || [];
  places.forEach((d) => push("place", d, 0.8));

  return entities.slice(0, 14);
}

export function assistFromGroundTruth(truth: string, result: PipelineResult): Dossier {
  const damaged = degradeTruth(truth, result);
  return buildDossier(damaged, result, "ground-truth-assist");
}

function degradeTruth(truth: string, result: PipelineResult): string {
  const lines = truth.split("\n");
  return lines
    .map((line, i) => {
      const layout = result.lines[i];
      if (!layout) return line;
      if (layout.lacunaOverlap > 0.3) {
        const cut = Math.max(8, Math.floor(line.length * (1 - layout.lacunaOverlap * 0.6)));
        return `${line.slice(0, cut)} […]`;
      }
      if (layout.confidence < 0.4) {
        return line.replace(/[aeiou]/gi, (ch, idx) => (idx % 5 === 0 ? "·" : ch));
      }
      return line;
    })
    .join("\n");
}
