import { useEffect, useRef, useState, type CSSProperties } from "react";
import { imageToCanvas } from "../engine/pixels";
import type { LayerId, PipelineResult } from "../engine/types";

interface Props {
  result: PipelineResult | null;
  layer: LayerId;
  compare: number;
  onCompare: (n: number) => void;
  showOverlay: boolean;
  busy: boolean;
}

export function LightTable({ result, layer, compare, onCompare, showOverlay, busy }: Props) {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!result || !baseRef.current || !topRef.current) return;
    const show = layer === "original" ? result.layers.restored : result.layers[layer];
    paintContain(baseRef.current, result.layers.original, box.w, box.h);
    paintContain(topRef.current, show, box.w, box.h);
  }, [result, layer, box]);

  const overlays =
    result && showOverlay && box.w ? placeOverlays(result, box.w, box.h) : [];

  return (
    <div className="viewport" ref={wrapRef}>
      <canvas ref={baseRef} />
      <div className="compare-clip" style={{ width: `${compare * 100}%` }}>
        <canvas ref={topRef} style={{ width: box.w, height: box.h }} />
      </div>
      <div className="slider" style={{ left: `${compare * 100}%` }} />
      {overlays.map((b) => (
        <div key={b.key} className={b.className} style={b.style}>
          {b.label ? <span>{b.label}</span> : null}
        </div>
      ))}
      {busy ? <div className="busy">Reading the leaf…</div> : null}
      <input
        className="range"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={compare}
        onChange={(e) => onCompare(Number(e.target.value))}
        aria-label="Compare witness and working layer"
      />
    </div>
  );
}

function paintContain(
  canvas: HTMLCanvasElement,
  img: ImageData,
  cw: number,
  ch: number,
) {
  if (!cw || !ch) return;
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0b0907";
  ctx.fillRect(0, 0, cw, ch);
  const src = imageToCanvas(img);
  const scale = Math.min(cw / src.width, ch / src.height);
  const w = src.width * scale;
  const h = src.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(src, (cw - w) / 2, (ch - h) / 2, w, h);
}

function placeOverlays(result: PipelineResult, cw: number, ch: number) {
  const iw = result.layers.original.width;
  const ih = result.layers.original.height;
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;
  const map = (x: number, y: number, w: number, h: number): CSSProperties => ({
    left: ox + x * scale,
    top: oy + y * scale,
    width: Math.max(2, w * scale),
    height: Math.max(2, h * scale),
  });

  const out: { key: string; className: string; style: CSSProperties; label?: string }[] = [];
  result.lacunae.forEach((l, i) => {
    out.push({
      key: `h${i}`,
      className: "overlay-box",
      style: map(l.x, l.y, l.w, l.h),
      label: l.kind,
    });
  });
  return out;
}
