import { useCallback, useEffect, useMemo, useState } from "react";
import { featherlessArchivist, localArchivist, type ArchivistTurn } from "./ai/archivist";
import { CASES, type CaseFile } from "./cases/catalog";
import { renderCase } from "./cases/render";
import { Filmstrip, LABELS } from "./components/Filmstrip";
import { LightTable } from "./components/LightTable";
import { Prologue } from "./components/Prologue";
import { runPipeline } from "./engine/pipeline";
import type { Dossier, LayerId, PipelineResult } from "./engine/types";
import { LESSONS } from "./lessons";
import { downloadDossier, loadUserImage } from "./lib/io";
import { assistFromGroundTruth, transcribe } from "./ocr/transcribe";

type Tab = "story" | "read" | "talk";

export default function App() {
  const [phase, setPhase] = useState<"prologue" | "studio">("prologue");
  const [active, setActive] = useState<CaseFile | null>(CASES[0]);
  const [fromArchive, setFromArchive] = useState(true);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [layer, setLayer] = useState<LayerId>("restored");
  const [compare, setCompare] = useState(0.56);
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [tab, setTab] = useState<Tab>("story");
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [chat, setChat] = useState<ArchivistTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [lessons, setLessons] = useState(false);
  const [settings, setSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("palimpsest.featherless") || "");
  const [status, setStatus] = useState("Ready.");

  const process = useCallback(async (img: ImageData, file: CaseFile | null) => {
    setBusy(true);
    setDossier(null);
    setStatus("Running the bench…");
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const out = await runPipeline(img);
    setResult(out);
    setActive(file);
    setFromArchive(Boolean(file && CASES.some((c) => c.title === file.title)));
    setLayer("restored");
    setBusy(false);
    setStatus(`Recovered in ${out.metrics.elapsedMs.toFixed(0)} ms · on-device`);
  }, []);

  useEffect(() => {
    if (phase !== "studio" || result) return;
    void process(renderCase(CASES[0]), CASES[0]);
  }, [phase, result, process]);

  const openCase = (file: CaseFile) => {
    void process(renderCase(file), file);
    setTab("story");
    setChat([]);
  };

  const onUpload = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    const img = await loadUserImage(file);
    await process(img, {
      ...CASES[0],
      id: "kerala",
      shelf: "00 — Field",
      title: file.name,
      year: new Date().toISOString().slice(0, 10),
      place: "Local capture",
      damage: "Unknown — instrument will hypothesise",
      story: "A leaf you brought to the table. The pipeline does not know its history; it only knows light.",
      impact: "Your document never left this machine.",
      groundTruth: "",
      font: "deed",
    });
  };

  const readInk = async (mode: "ocr" | "assist") => {
    if (!result) return;
    setOcrBusy(true);
    setTab("read");
    try {
      if (mode === "assist" && active?.groundTruth) {
        setDossier(assistFromGroundTruth(active.groundTruth, result));
        setStatus("Diplomatic reading from the case witness, damaged by measured lacunae.");
      } else {
        setStatus("Tesseract.js is looking at the Sauvola layer…");
        const d = await transcribe(result);
        setDossier(d);
        setStatus("Ink read. Names remain hypotheses.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "The reader stumbled.");
    } finally {
      setOcrBusy(false);
    }
  };

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    setQuestion("");
    setChat((c) => [...c, { role: "user", text: q }]);
    try {
      const answer = apiKey
        ? await featherlessArchivist(apiKey, q, active, result, dossier)
        : localArchivist(q, active, result, dossier);
      setChat((c) => [...c, { role: "archivist", text: answer }]);
    } catch {
      const fallback = localArchivist(q, active, result, dossier);
      setChat((c) => [
        ...c,
        { role: "archivist", text: `Featherless was silent. Local bench says: ${fallback}` },
      ]);
    }
  };

  useEffect(() => {
    localStorage.setItem("palimpsest.featherless", apiKey);
  }, [apiKey]);

  const m = result?.metrics;
  const prompts = useMemo(
    () => ["What did the water take?", "Explain Sauvola.", "May I trust the names?", "Why deskew first?"],
    [],
  );

  if (phase === "prologue") {
    return <Prologue onEnter={() => setPhase("studio")} />;
  }

  return (
    <div className="studio">
      <header className="topbar">
        <div className="brand">
          <b>Palimpsest</b>
          <span>Scriptorium</span>
        </div>
        <div className="metrics">
          <span>skew <em>{m ? `${m.skewDegrees.toFixed(1)}°` : "—"}</em></span>
          <span>contrast <em>{m ? `${m.contrastGain.toFixed(2)}×` : "—"}</em></span>
          <span>readable <em>{m ? `${(m.readableArea * 100).toFixed(0)}%` : "—"}</em></span>
          <span>lacunae <em>{result ? result.lacunae.length : "—"}</em></span>
        </div>
        <div className="top-actions">
          <button className="tiny" onClick={() => setOverlay((v) => !v)}>
            {overlay ? "Hide holes" : "Show holes"}
          </button>
          <button className="tiny" onClick={() => setLessons((v) => !v)}>
            Lessons
          </button>
          <button className="tiny" onClick={() => setSettings((v) => !v)}>
            Key
          </button>
          <button className="tiny" onClick={() => setPhase("prologue")}>
            Prologue
          </button>
        </div>
      </header>

      <aside className="shelf">
        <h2>Archive</h2>
        {CASES.map((c) => (
          <button
            key={c.id}
            className={`case ${fromArchive && active?.id === c.id ? "active" : ""}`}
            onClick={() => openCase(c)}
          >
            <small>{c.shelf}</small>
            <strong>{c.title}</strong>
            <em>{c.place}</em>
          </button>
        ))}
        <div className="upload">
          Bring your own leaf.{" "}
          <label>
            Open image
            <input type="file" accept="image/*" onChange={(e) => void onUpload(e.target.files)} />
          </label>
        </div>
      </aside>

      <main className="table">
        <div className="table-head">
          <div>
            <h2>Light table</h2>
            <p>
              {active
                ? `${active.damage}. Drag the brass rule to compare the witness with the working layer.`
                : "Choose a case file."}
            </p>
          </div>
          <div className="layers">
            {LABELS.map((l) => (
              <button key={l.id} className={layer === l.id ? "on" : ""} onClick={() => setLayer(l.id)}>
                {l.name}
              </button>
            ))}
          </div>
        </div>
        <LightTable
          result={result}
          layer={layer}
          compare={compare}
          onCompare={setCompare}
          showOverlay={overlay}
          busy={busy}
        />
        {result ? <Filmstrip result={result} layer={layer} onPick={setLayer} /> : <div className="film" />}
      </main>

      <aside className="dossier">
        <div className="tabs">
          {(["story", "read", "talk"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        {tab === "story" && active && (
          <div className="story">
            <div className="kicker">{active.year}</div>
            <h3>{active.title}</h3>
            <p>{active.story}</p>
            <p>{active.impact}</p>
            <div className="badges">
              <i>{active.place}</i>
              <i>{active.damage}</i>
            </div>
            {result && (
              <ol className="notes">
                {result.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ol>
            )}
          </div>
        )}
        {tab === "read" && (
          <div className="read">
            <div className="cta-row" style={{ marginBottom: 12 }}>
              <button className="btn" disabled={!result || ocrBusy} onClick={() => void readInk("ocr")}>
                {ocrBusy ? "Reading…" : "Read with Tesseract"}
              </button>
              {active?.groundTruth ? (
                <button className="btn ghost" disabled={!result} onClick={() => void readInk("assist")}>
                  Diplomatic from witness
                </button>
              ) : null}
              <button
                className="tiny"
                disabled={!result}
                onClick={() => result && active && downloadDossier(active, result, dossier)}
              >
                Export
              </button>
            </div>
            <pre className="transcript">
              {dossier?.diplomatic ||
                "The bench has enhanced the leaf. Reading is a separate, fallible act. Choose Tesseract on the binary layer, or — for a case file — a diplomatic text damaged by the measured holes."}
            </pre>
            {dossier && (
              <>
                <div className="entities">
                  {dossier.entities.map((e) => (
                    <b key={`${e.type}${e.text}`} className={e.type}>
                      {e.type} · {e.text}
                    </b>
                  ))}
                </div>
                <div className="caution">{dossier.caution}</div>
              </>
            )}
          </div>
        )}
        {tab === "talk" && (
          <div className="talk">
            <div className="prompts">
              {prompts.map((p) => (
                <button key={p} className="tiny" onClick={() => void ask(p)}>
                  {p}
                </button>
              ))}
            </div>
            <div className="log">
              {chat.length === 0 && (
                <div className="bubble archivist">
                  I am the archivist. I will explain the bench and refuse to invent missing
                  ink. {apiKey ? "Featherless is listening." : "Running locally — add a Featherless key if you wish."}
                </div>
              )}
              {chat.map((t, i) => (
                <div key={i} className={`bubble ${t.role}`}>
                  {t.text}
                </div>
              ))}
            </div>
            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                void ask(question);
              }}
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about a stain, a name, a method…"
              />
              <button className="btn" type="submit">
                Ask
              </button>
            </form>
          </div>
        )}
      </aside>

      <footer className="foot">
        <span>{status}</span>
        <span>Nothing leaves the machine unless you open Featherless</span>
      </footer>

      {lessons && (
        <div className="lessons" onClick={() => setLessons(false)}>
          <div className="lesson-grid" onClick={(e) => e.stopPropagation()}>
            {LESSONS.map((l) => (
              <article key={l.id} className="lesson">
                <div className="num">{l.numeral}</div>
                <h3>{l.title}</h3>
                <p className="lede">{l.lede}</p>
                {l.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {l.formula ? <div className="formula">{l.formula}</div> : null}
              </article>
            ))}
          </div>
        </div>
      )}

      {settings && (
        <div className="settings">
          <h2>Featherless (optional)</h2>
          <p>
            The bench never needs a key. If you add one, the archivist may speak with an
            open-weight model — still forbidden from inventing letters.
          </p>
          <input
            type="password"
            value={apiKey}
            placeholder="fl-…"
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button className="tiny" onClick={() => setSettings(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
