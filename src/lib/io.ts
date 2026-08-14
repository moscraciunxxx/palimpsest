import { WORKFLOW_NEXT, type CaseFile } from "../cases/catalog";
import { drawImageElement, imageToCanvas } from "../engine/pixels";
import type { Dossier, ForgeryEdition, PipelineResult } from "../engine/types";
import { leafFingerprint } from "../engine/witness";

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
  file: CaseFile,
  result: PipelineResult,
  dossier: Dossier | null,
  forgery: ForgeryEdition | null,
  witnessNote?: string,
) {
  const print = leafFingerprint(result.layers.original);
  const md = [
    `# Palimpsest first-aid packet — ${file.title}`,
    ``,
    `This is not a legal restoration, a title, a credential, or a medical record.`,
    `It is a chain-of-custody note for what the camera still saw.`,
    ``,
    `## Leaf`,
    `- Origin: ${file.origin === "teaching" ? "teaching instrument (generated in-browser, not an archive)" : "field photograph"}`,
    `- Workflow: ${file.workflow}`,
    `- Place: ${file.place}`,
    `- Date on the leaf: ${file.year}`,
    `- Witness fingerprint (local, non-cryptographic): ${print}`,
    witnessNote ? `- Dual-witness: ${witnessNote}` : `- Dual-witness: none — a second photograph was not offered`,
    ``,
    `## Next human action`,
    WORKFLOW_NEXT[file.workflow],
    ``,
    `## Instrument readings`,
    `- Skew: ${result.metrics.skewDegrees.toFixed(2)}°`,
    `- Contrast gain: ${result.metrics.contrastGain.toFixed(2)}×`,
    `- Readable area: ${(result.metrics.readableArea * 100).toFixed(1)}%`,
    `- Lacuna area: ${(result.metrics.lacunaArea * 100).toFixed(1)}%`,
    `- Pipeline: ${result.metrics.elapsedMs.toFixed(0)} ms, on-device`,
    ``,
    ...(typeof result.metrics?.ironGall === "number" ||
    typeof result.metrics?.carbonInk === "number" ||
    typeof result.metrics?.laterInk === "number"
      ? [
          `## Spectral mass`,
          ...(typeof result.metrics?.ironGall === "number"
            ? [`- Iron-gall: ${(result.metrics.ironGall * 100).toFixed(1)}%`]
            : []),
          ...(typeof result.metrics?.carbonInk === "number"
            ? [`- Carbon ink: ${(result.metrics.carbonInk * 100).toFixed(1)}%`]
            : []),
          ...(typeof result.metrics?.laterInk === "number"
            ? [`- Later ink: ${(result.metrics.laterInk * 100).toFixed(1)}%`]
            : []),
          ``,
        ]
      : []),
    ...(typeof result.metrics?.sentinelRefuse === "number"
      ? [
          `## Sentinel`,
          `- Refused ${(result.metrics.sentinelRefuse * 100).toFixed(1)}% of dark patches — not letters`,
          ``,
        ]
      : []),
    `## Method notes`,
    ...result.notes.map((n) => `- ${n}`),
    ``,
    `## Seen (diplomatic)`,
    ``,
    "```",
    dossier?.diplomatic || "(not yet read)",
    "```",
    ``,
    `## Spoken ink only (confidence ≥ 62)`,
    ``,
    "```",
    dossier?.spokenOnly || "(not yet read)",
    "```",
    ``,
    `## Inferred (holes, not letters)`,
    ...(dossier?.inferredSpans.map((s) => `- ${s.text} — ${s.reason}`) || ["- none marked"]),
    ``,
    `## Entities from spoken ink only`,
    ...(dossier?.entities.map((e) => `- (${e.type}, ${e.confidence.toFixed(2)}) ${e.text}`) || [
      "- none",
    ]),
    ``,
    `## Forgery table (NOT EVIDENCE)`,
    forgery
      ? [
          forgery.warning,
          ...forgery.spans.map((s) => `- Invented “${s.invented}” into ${s.hole}: ${s.risk}`),
        ].join("\n")
      : "Not generated.",
    ``,
    `## Caution`,
    dossier?.caution || "Treat all recoveries as drafts.",
    ``,
    `_Generated locally by Palimpsest. No document left the machine._`,
  ].join("\n");

  const blob = new Blob([md], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `palimpsest-first-aid-${file.title.toLowerCase().replace(/\s+/g, "-")}.md`;
  a.click();
  URL.revokeObjectURL(a.href);

  const png = imageToCanvas(result.layers.restored).toDataURL("image/png");
  const b = document.createElement("a");
  b.href = png;
  b.download = `palimpsest-restored.png`;
  b.click();
}
