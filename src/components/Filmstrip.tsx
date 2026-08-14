import { useEffect, useRef } from "react";
import { imageToCanvas } from "../engine/pixels";
import type { LayerId, PipelineResult } from "../engine/types";

const LABELS: { id: LayerId; name: string }[] = [
  { id: "original", name: "Witness" },
  { id: "illumination", name: "Lamp out" },
  { id: "ink", name: "Density" },
  { id: "binary", name: "Sauvola" },
  { id: "lacuna", name: "Holes" },
  { id: "restored", name: "Restored" },
  { id: "raking", name: "Raking" },
  { id: "undertext", name: "Undertext" },
  { id: "overtext", name: "Later hand" },
  { id: "sentinel", name: "Sentinel" },
];

export function Filmstrip({
  result,
  layer,
  onPick,
}: {
  result: PipelineResult;
  layer: LayerId;
  onPick: (id: LayerId) => void;
}) {
  return (
    <div className="film">
      {LABELS.map((l) => {
        if (!result.layers[l.id]) return null;
        return (
          <button
            key={l.id}
            className={`chip ${layer === l.id ? "on" : ""}`}
            onClick={() => onPick(l.id)}
          >
            <Thumb img={result.layers[l.id]} />
            <b>{l.name}</b>
          </button>
        );
      })}
    </div>
  );
}

function Thumb({ img }: { img: ImageData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const src = imageToCanvas(img);
    ref.current.width = 200;
    ref.current.height = 120;
    const ctx = ref.current.getContext("2d")!;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, 200, 120);
    const scale = Math.min(200 / src.width, 120 / src.height);
    const w = src.width * scale;
    const h = src.height * scale;
    ctx.drawImage(src, (200 - w) / 2, (120 - h) / 2, w, h);
  }, [img]);
  return <canvas ref={ref} />;
}

export { LABELS };
