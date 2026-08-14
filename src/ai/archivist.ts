import type { CaseFile } from "../cases/catalog";
import type { Dossier, PipelineResult } from "../engine/types";

const FEATHERLESS = "https://api.featherless.ai/v1/chat/completions";

export interface ArchivistTurn {
  role: "user" | "archivist";
  text: string;
}

export function localArchivist(
  question: string,
  file: CaseFile | null,
  result: PipelineResult | null,
  dossier: Dossier | null,
): string {
  const q = question.toLowerCase();
  if (!result) {
    return "Place a leaf on the light table first. I can only speak to ink I have seen.";
  }

  if (/lacuna|missing|gap|stain|damage|water|flood|took|take/.test(q)) {
    const kinds = tally(result.lacunae.map((l) => l.kind));
    return [
      `I count ${result.lacunae.length} lacunae.`,
      kinds,
      "I will not write letters into a stain. That is how archives become fiction.",
      "If you have a second copy — a neighbour's deed, a parent who remembers the recipe — that is the witness, not the model.",
    ].join(" ");
  }

  if (/skew|deskew|angle|crooked/.test(q)) {
    return `Projection-profile energy peaked at ${result.metrics.skewDegrees.toFixed(2)}°. I rotated the leaf by the opposite amount before thresholding. Crooked text fools a global threshold; it does not fool a local one quite as badly, but I still prefer the page square.`;
  }

  if (/sauvola|threshold|binary|binaris/.test(q)) {
    return "Sauvola asks, for every pixel: is this darker than the paper around it, given how noisy the neighbourhood is? A flood stain that is merely brown will not become a letter. A pale carbon on grey paper still can.";
  }

  if (/beer|lambert|ink|optical/.test(q)) {
    return "Ink is not a colour so much as an absence of light. Beer–Lambert converts RGB to optical density. Iron-gall and ballpoint drink the blue-green channels first. I use that to draw the ink map you see in brass.";
  }

  if (/who|person|name|entity/.test(q) && dossier) {
    const people = dossier.entities.filter((e) => e.type === "person" || e.type === "place");
    if (!people.length) return "The hand is shy. I have not yet locked a proper name.";
    return `From the visible ink I can provisionally read: ${people.map((p) => p.text).join("; ")}. Treat every name as a hypothesis until a human agrees.`;
  }

  if (/trust|hallucin|honest|infer/.test(q)) {
    return "A language model completing a deed is a forger with good manners. Palimpsest is allowed to enhance paper and to mark holes. It is not allowed to invent a survey number. That is the whole ethic.";
  }

  if (/flood|kerala|idai|climate|why/.test(q) && file) {
    return `${file.story} ${file.impact}`;
  }

  if (file) {
    return [
      `This leaf is filed as “${file.title}.”`,
      `Damage hypothesis: ${file.damage}.`,
      `Readable area after recovery: ${(result.metrics.readableArea * 100).toFixed(1)}%.`,
      `Contrast gain: ${result.metrics.contrastGain.toFixed(2)}×.`,
      dossier?.rawText
        ? "Ask me about a lacuna, a name, or an algorithm — I will stay inside the evidence."
        : "Transcribe when you are ready. I prefer the binary layer; it is the most honest surface.",
    ].join(" ");
  }

  return "Ask me about the stain, the skew, the names, or the method. I refuse to gossip beyond the page.";
}

function tally(kinds: string[]) {
  const m = new Map<string, number>();
  for (const k of kinds) m.set(k, (m.get(k) || 0) + 1);
  if (!m.size) return "None severe.";
  return [...m.entries()].map(([k, n]) => `${n} ${k}`).join(", ") + ".";
}

export async function featherlessArchivist(
  apiKey: string,
  question: string,
  file: CaseFile | null,
  result: PipelineResult | null,
  dossier: Dossier | null,
): Promise<string> {
  const context = JSON.stringify(
    {
      case: file && { title: file.title, damage: file.damage, place: file.place },
      metrics: result?.metrics,
      lacunae: result?.lacunae.slice(0, 8),
      transcription: dossier?.diplomatic.slice(0, 1800),
      entities: dossier?.entities,
    },
    null,
    2,
  );

  const res = await fetch(FEATHERLESS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are the Archivist of Palimpsest, a computational scriptorium. You help recover damaged documents. You NEVER invent missing text, names, dates, or legal facts. You mark uncertainty. You explain the computer-vision pipeline in plain, vivid language. You care about climate-lost records, family letters, and clinic carbons. Keep answers under 160 words.",
        },
        {
          role: "user",
          content: `Evidence:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Featherless ${res.status}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() || "The model returned silence.";
}
