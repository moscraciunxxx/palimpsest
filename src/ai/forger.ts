import type { CaseFile } from "../cases/catalog";
import type { ForgeryEdition, ForgerySpan } from "../engine/types";

const DEFAULT_FORGERIES: ForgerySpan[] = [
  {
    invented: "No. 0000 / recovered",
    hole: "identifier",
    risk: "A completing model loves a serial number.",
  },
  {
    invented: "the undersigned agrees",
    hole: "legal formula",
    risk: "Boilerplate is how forgeries look official.",
  },
  {
    invented: "14 August 2018",
    hole: "date",
    risk: "A date pulled from the flood, not the page.",
  },
];

const HOLE =
  /\[\u2026\]|\[\.\.\.\]|⟦[^⟧]*⟧|〈[^〉]+〉|\[[\u00B7.]{2,}\]/g;

export function forgeEdition(diplomatic: string, file: CaseFile | null): ForgeryEdition {
  const fillers = file?.forgeries.length ? file.forgeries : DEFAULT_FORGERIES;
  const used: ForgerySpan[] = [];
  let i = 0;
  let text = diplomatic.replace(HOLE, () => {
    const span = fillers[i % fillers.length];
    i += 1;
    used.push(span);
    return span.invented;
  });

  if (!used.length) {
    text = [
      diplomatic,
      "",
      "— Completing model (not on the page) —",
      fillers.map((f) => f.invented).join("; "),
    ].join("\n");
    used.push(...fillers);
  }

  return {
    label: "FORGERY — NOT EVIDENCE",
    text,
    spans: dedupe(used),
    warning:
      "The oxblood words were never recovered. They are what “AI document recovery” usually sells. Palimpsest will not use them as the restored product, a title, a dose, or a name.",
  };
}

function dedupe(spans: ForgerySpan[]): ForgerySpan[] {
  const seen = new Set<string>();
  return spans.filter((s) => {
    const key = s.invented.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
