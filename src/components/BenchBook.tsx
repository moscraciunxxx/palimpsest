import type { PipelineResult } from "../engine/types";

function pct(n: number) {
  return Math.max(0, Math.min(100, n <= 1 ? n * 100 : n));
}

function Meter({ label, value }: { label: string; value: number }) {
  const width = pct(value);
  return (
    <div className="bench-meter">
      <span>{label}</span>
      <i className="bench-track">
        <i className="bench-fill" style={{ width: `${width}%` }} />
      </i>
      <em>{width.toFixed(0)}%</em>
    </div>
  );
}

export function BenchBook({ result }: { result: PipelineResult }) {
  const m = result.metrics;
  const iron = m.ironGall;
  const carbon = m.carbonInk;
  const later = m.laterInk;
  const refuse = m.sentinelRefuse;
  const hasSpectral =
    typeof iron === "number" || typeof carbon === "number" || typeof later === "number";

  return (
    <article className="bench lesson">
      <p className="kicker">Bench book</p>
      <h3>Self-measurement</h3>
      <dl className="bench-readings">
        <div>
          <dt>Skew</dt>
          <dd>{m.skewDegrees.toFixed(2)}°</dd>
        </div>
        <div>
          <dt>Contrast gain</dt>
          <dd>{m.contrastGain.toFixed(2)}×</dd>
        </div>
        <div>
          <dt>Readable</dt>
          <dd>{(m.readableArea * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Lacuna</dt>
          <dd>{(m.lacunaArea * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Elapsed</dt>
          <dd>{m.elapsedMs.toFixed(0)} ms</dd>
        </div>
      </dl>
      {hasSpectral && (
        <div className="bench-spectral">
          <p className="kicker">Spectral mass</p>
          {typeof iron === "number" && <Meter label="Iron-gall" value={iron} />}
          {typeof carbon === "number" && <Meter label="Carbon" value={carbon} />}
          {typeof later === "number" && <Meter label="Later ink" value={later} />}
        </div>
      )}
      {typeof refuse === "number" && (
        <p className="formula">
          Sentinel refused {pct(refuse).toFixed(0)}% of dark patches — not letters
        </p>
      )}
      <p className="bench-ethic">These are instrument readings. They are not a title.</p>
    </article>
  );
}
