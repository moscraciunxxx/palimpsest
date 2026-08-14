import { drawImageElement, imageToCanvas } from "../engine/pixels";
import type { CaseFile } from "../cases/catalog";
import type { Dossier, PipelineResult } from "../engine/types";

export function loadUserImage(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(drawImageElement(img, 920));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

export function downloadDossier(
  file: CaseFile | { title: string; place: string; year: string },
  result: PipelineResult,
  dossier: Dossier | null,
) {
  const md = [
    `# Palimpsest dossier — ${file.title}`,
    ``,
    `Place: ${file.place}`,
    `Date: ${file.year}`,
    ``,
    `## Instrument readings`,
    `- Skew: ${result.metrics.skewDegrees.toFixed(2)}°`,
    `- Contrast gain: ${result.metrics.contrastGain.toFixed(2)}×`,
    `- Readable area: ${(result.metrics.readableArea * 100).toFixed(1)}%`,
    `- Lacuna area: ${(result.metrics.lacunaArea * 100).toFixed(1)}%`,
    `- Pipeline: ${result.metrics.elapsedMs.toFixed(0)} ms, on-device`,
    ``,
    `## Method notes`,
    ...result.notes.map((n) => `- ${n}`),
    ``,
    `## Diplomatic transcription`,
    ``,
    "```",
    dossier?.diplomatic || "(not yet read)",
    "```",
    ``,
    `## Entities (provisional)`,
    ...(dossier?.entities.map((e) => `- (${e.type}) ${e.text}`) || ["- none"]),
    ``,
    `## Caution`,
    dossier?.caution || "Treat all recoveries as drafts.",
    ``,
    `_Generated locally by Palimpsest. No document left the machine._`,
  ].join("\n");

  const blob = new Blob([md], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `palimpsest-${file.title.toLowerCase().replace(/\s+/g, "-")}.md`;
  a.click();
  URL.revokeObjectURL(a.href);

  const png = imageToCanvas(result.layers.restored).toDataURL("image/png");
  const b = document.createElement("a");
  b.href = png;
  b.download = `palimpsest-restored.png`;
  b.click();
}
