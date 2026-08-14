export type LayerId =
  | "original"
  | "illumination"
  | "ink"
  | "binary"
  | "lacuna"
  | "restored";

export type DamageKind = "stain" | "wash" | "tear" | "mold" | "fold";

export interface LacunaRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: DamageKind;
  severity: number;
}

export interface TextLine {
  id: string;
  y0: number;
  y1: number;
  x0: number;
  x1: number;
  inkStrength: number;
  lacunaOverlap: number;
  confidence: number;
}

export interface PipelineMetrics {
  skewDegrees: number;
  contrastGain: number;
  readableArea: number;
  lacunaArea: number;
  meanInk: number;
  paperVariance: number;
  elapsedMs: number;
}

export interface PipelineResult {
  width: number;
  height: number;
  layers: Record<LayerId, ImageData>;
  lacunae: LacunaRegion[];
  lines: TextLine[];
  metrics: PipelineMetrics;
  notes: string[];
}

export interface Entity {
  type: "person" | "place" | "date" | "identifier" | "sum";
  text: string;
  confidence: number;
}

export interface WordReading {
  text: string;
  confidence: number;
  spoken: boolean;
}

export interface ForgerySpan {
  invented: string;
  hole: string;
  risk: string;
}

export interface ForgeryEdition {
  label: "FORGERY — NOT EVIDENCE";
  text: string;
  spans: ForgerySpan[];
  warning: string;
}

export interface Dossier {
  rawText: string;
  diplomatic: string;
  spokenOnly: string;
  words: WordReading[];
  reconstruction: string;
  inferredSpans: { text: string; reason: string }[];
  entities: Entity[];
  caution: string;
  source: "tesseract" | "ground-truth-assist" | "featherless" | "empty";
}
