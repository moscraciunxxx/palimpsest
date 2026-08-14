import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { imageToCanvas, toGray } from "../engine/pixels";
import { rake } from "../engine/raking";
import { probeInk, type ProbeReading } from "../engine/spectra";
import type { LayerId, PipelineResult } from "../engine/types";

export interface LightTableProps {
  result: PipelineResult | null;
  layer: LayerId;
  compare: number;
  onCompare: (n: number) => void;
  showOverlay: boolean;
  busy: boolean;
  /** Lamp compass angle in degrees. 0 = from the right, increasing counter-clockwise. */
  azimuth?: number;
  /** Lamp height above the leaf, 15 (grazing) to 70 (steeper). */
  elevation?: number;
  onLamp?: (az: number, el: number) => void;
}

export const LAMP_DEFAULTS = { azimuth: 40, elevation: 35 } as const;

export function LightTable({
  result,
  layer,
  compare,
  onCompare,
  showOverlay,
  busy,
  azimuth = LAMP_DEFAULTS.azimuth,
  elevation = LAMP_DEFAULTS.elevation,
  onLamp,
}: LightTableProps) {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [az, setAz] = useState(azimuth);
  const [el, setEl] = useState(elevation);
  const [grabbing, setGrabbing] = useState(false);
  const [probe, setProbe] = useState<{ sx: number; sy: number; reading: ProbeReading } | null>(null);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const ro = new ResizeObserver(() => setBox({ w: node.clientWidth, h: node.clientHeight }));
    ro.observe(node);
    setBox({ w: node.clientWidth, h: node.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => setAz(azimuth), [azimuth]);
  useEffect(() => setEl(elevation), [elevation]);
  useEffect(() => setProbe(null), [result]);

  const raked = useMemo(() => computeRake(result, az, el), [result, az, el]);

  useEffect(() => {
    if (!result || !baseRef.current || !topRef.current) return;
    const working = workingLayer(result, layer, raked);
    paintContain(baseRef.current, result.layers.original, box.w, box.h);
    paintContain(topRef.current, working, box.w, box.h);
  }, [result, layer, box, raked]);

  const overlays =
    result && showOverlay && box.w && layer !== "undertext" && layer !== "raking" && layer !== "overtext"
      ? placeOverlays(result, box.w, box.h)
      : [];
  const well = result && box.w ? leafFrame(result, box.w, box.h) : null;
  const lamp = box.w ? lampPose(box.w, box.h, az, el) : null;
  const raking = layer === "raking";

  const aim = (e: PointerEvent<HTMLElement>) => {
    const node = wrapRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setLamp(...aimFromPointer(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height));
  };

  const sampleLeaf = (clientX: number, clientY: number) => {
    if (!result || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const frame = leafFrame(result, rect.width, rect.height);
    const ix = (sx - frame.ox) / frame.scale;
    const iy = (sy - frame.oy) / frame.scale;
    const reading = probeInk(result.layers.original, ix, iy);
    if (!reading) {
      setProbe(null);
      return;
    }
    setProbe({ sx, sy, reading });
  };

  const setLamp = (nextAz: number, nextEl: number) => {
    const az2 = ((nextAz % 360) + 360) % 360;
    const el2 = Math.max(15, Math.min(70, nextEl));
    setAz(az2);
    setEl(el2);
    onLamp?.(az2, el2);
  };

  return (
    <div
      className="viewport"
      ref={wrapRef}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest(".lamp, .lamp-height, .range, button")) return;
        sampleLeaf(e.clientX, e.clientY);
      }}
    >
      <canvas ref={baseRef} />
      <div className="compare-clip" style={{ width: `${compare * 100}%` }}>
        <canvas ref={topRef} style={{ width: box.w, height: box.h }} />
      </div>
      {well ? (
        <div
          className="well"
          style={{ left: well.ox - 10, top: well.oy - 10, width: well.dw + 20, height: well.dh + 20 }}
        />
      ) : null}
      {raking && lamp ? (
        <div
          className="lamp-wash"
          style={{
            background: `radial-gradient(ellipse 70% 55% at ${lamp.washX}% ${lamp.washY}%, rgba(201,163,106,0.16), transparent 62%)`,
          }}
        />
      ) : null}
      <div className="slider" style={{ left: `${compare * 100}%` }} />
      {overlays.map((b) => (
        <div key={b.key} className={b.className} style={b.style}>
          {b.label ? <span>{b.label}</span> : null}
        </div>
      ))}
      {raking && lamp ? (
        <>
          <div
            className="lamp-spoke"
            style={{
              width: lamp.r,
              left: box.w / 2,
              top: box.h / 2,
              transform: `rotate(${-az}deg)`,
            }}
          />
          <button
            type="button"
            className={`lamp${grabbing ? " dragging" : ""}`}
            style={{ left: lamp.x, top: lamp.y }}
            aria-label="Raking lamp"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(az)}
            title="Drag around the leaf to rake"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              dragging.current = true;
              setGrabbing(true);
              aim(e);
            }}
            onPointerMove={(e) => {
              if (!dragging.current) return;
              aim(e);
            }}
            onPointerUp={(e) => {
              dragging.current = false;
              setGrabbing(false);
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancel={() => {
              dragging.current = false;
              setGrabbing(false);
            }}
          />
          <label className="lamp-height">
            <span>height</span>
            <input
              type="range"
              min={15}
              max={70}
              step={1}
              value={el}
              onChange={(e) => setLamp(az, Number(e.target.value))}
              aria-label="Lamp height"
            />
          </label>
        </>
      ) : null}
      {probe ? (
        <div className="probe" style={{ left: probe.sx, top: probe.sy }}>
          <i className="probe-pin" />
          <div className="probe-card">
            <b>Probe</b>
            <span>iron {(probe.reading.iron * 100).toFixed(0)}%</span>
            <span>carbon {(probe.reading.carbon * 100).toFixed(0)}%</span>
            <span>later {(probe.reading.later * 100).toFixed(0)}%</span>
          </div>
        </div>
      ) : null}
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

function computeRake(result: PipelineResult | null, az: number, el: number): ImageData | null {
  if (!result) return null;
  const relief = result.relief;
  if (!relief) return null;
  const plate = result.layers.illumination ?? result.layers.original;
  if (!plate) return null;
  const gray = toGray(plate);
  const w = result.width;
  const h = result.height;
  if (relief.length !== w * h || gray.length !== w * h) return null;
  return rake(gray, relief, w, h, az, el);
}

function workingLayer(result: PipelineResult, layer: LayerId, raked: ImageData | null): ImageData {
  if (layer === "raking") {
    return raked ?? result.layers.illumination ?? result.layers.original;
  }
  if (layer === "original") return result.layers.restored;
  return result.layers[layer] ?? result.layers.illumination ?? result.layers.original;
}

function lampPose(cw: number, ch: number, az: number, el: number) {
  const maxR = Math.max(48, Math.min(cw, ch) / 2 - 22);
  const minR = maxR * 0.38;
  const t = (70 - el) / 55;
  const r = minR + t * (maxR - minR);
  const rad = (az * Math.PI) / 180;
  const x = cw / 2 + r * Math.cos(rad);
  const y = ch / 2 - r * Math.sin(rad);
  return {
    x,
    y,
    r,
    washX: 50 + Math.cos(rad) * 38,
    washY: 50 - Math.sin(rad) * 38,
  };
}

function aimFromPointer(x: number, y: number, cw: number, ch: number): [number, number] {
  const dx = x - cw / 2;
  const dy = y - ch / 2;
  const az = (Math.atan2(-dy, dx) * 180) / Math.PI;
  const dist = Math.hypot(dx, dy);
  const maxR = Math.max(48, Math.min(cw, ch) / 2 - 22);
  const minR = maxR * 0.38;
  const t = Math.max(0, Math.min(1, (dist - minR) / (maxR - minR || 1)));
  const elevation = 70 - t * 55;
  return [az, elevation];
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
  ctx.fillStyle = "#080604";
  ctx.fillRect(0, 0, cw, ch);
  const src = imageToCanvas(img);
  const scale = Math.min(cw / src.width, ch / src.height);
  const w = src.width * scale;
  const h = src.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(src, (cw - w) / 2, (ch - h) / 2, w, h);
}

function leafFrame(result: PipelineResult, cw: number, ch: number) {
  const iw = result.layers.original.width;
  const ih = result.layers.original.height;
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  return { ox: (cw - dw) / 2, oy: (ch - dh) / 2, dw, dh, scale };
}

function placeOverlays(result: PipelineResult, cw: number, ch: number) {
  const { ox, oy, scale } = leafFrame(result, cw, ch);
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
