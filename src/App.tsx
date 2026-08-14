import { useCallback, useEffect, useMemo, useState } from "react";
import { featherlessArchivist, localArchivist, type ArchivistTurn } from "./ai/archivist";
import { forgeEdition } from "./ai/forger";
import { CASES, fieldLeaf, type CaseFile } from "./cases/catalog";
import { renderCase } from "./cases/render";
import { Filmstrip, LABELS } from "./components/Filmstrip";
import { LightTable } from "./components/LightTable";
import { Prologue } from "./components/Prologue";
import { runPipeline } from "./engine/pipeline";
import type { Dossier, ForgeryEdition, LayerId, PipelineResult } from "./engine/types";
import { applyWitness } from "./engine/witness";
import { LESSONS } from "./lessons";
import { downloadDossier, loadUserImage } from "./lib/io";
import { assistFromGroundTruth, transcribe } from "./ocr/transcribe";

type Tab = "story" | "read" | "forge" | "talk";

export default function App() {
  const [phase, setPhase] = useState<"prologue" | "studio">("prologue");
  const [active, setActive] = useState<CaseFile | null>(CASES[0]);
  const [fromArchive, setFromArchive] = useState(true);
  const [sourceImg, setSourceImg] = useState<ImageData | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [layer, setLayer] = useState<LayerId>("restored");
  const [compare, setCompare] = useState(0.56);
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [tab, setTab] = useState<Tab>("story");
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [forgery, setForgery] = useState<ForgeryEdition | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [chat, setChat] = useState<ArchivistTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [lessons, setLessons] = useState(false);
  const [settings, setSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("palimpsest.featherless") || "");
  const [status, setStatus] = useState("Ready.");
  const [witnessNote, setWitnessNote] = useState("");

  const process = useCallback(async (img: ImageData, file: CaseFile | null, second: ImageData | null = null) => {
    setBusy(true);
    setDossier(null);
    setForgery(null);
    setStatus("Running the bench…");
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    let out = await runPipeline(img);
    if (second) {
      const applied = applyWitness(out, second);
      out = applied.result;
      setWitnessNote(
        `${(applied.report.agreeRatio * 100).toFixed(0)}% of ink agrees; dissent is a hole, not a vote.`,
      );
    } else {
      setWitnessNote("");
    }
    setSourceImg(img);
    setResult(out);
    setActive(file);
    setFromArchive(file?.origin === "teaching");
    setLayer("restored");
    setBusy(false);
    if (file?.origin === "teaching" && file.groundTruth) {
      const d = assistFromGroundTruth(file.groundTruth, out);
      setDossier(d);
      setForgery(forgeEdition(d.diplomatic, file));
      setStatus(`Recovered in ${out.metrics.elapsedMs.toFixed(0)} ms · teaching leaf, holes left open`);
    } else {
      setStatus(`Recovered in ${out.metrics.elapsedMs.toFixed(0)} ms · on-device`);
    }
  }, []);

  useEffect(() => {
    if (phase !== "studio" || result) return;
    void process(renderCase(CASES[0]), CASES[0], null);
  }, [phase, result, process]);

  const openCase = (file: CaseFile) => {
    void process(renderCase(file), file, null);
    setTab("story");
    setChat([]);
  };

  const onUpload = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    const img = await loadUserImage(file);
    await process(img, fieldLeaf(file.name), null);
    setTab("story");
    setChat([]);
  };

  const onWitness = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file || !sourceImg) return;
    const img = await loadUserImage(file);
    await process(sourceImg, active, img);
    setStatus((s) => `${s} · second witness applied`);
  };

  const readInk = async (mode: "ocr" | "assist") => {
    if (!result) return;
    setOcrBusy(true);
    setTab("read");
    try {
      if (mode === "assist" && active?.groundTruth) {
        const d = assistFromGroundTruth(active.groundTruth, result);
        setDossier(d);
        setForgery(forgeEdition(d.diplomatic, active));
        setStatus("Diplomatic reading from the case witness, damaged by measured lacunae.");
      } else {
        setStatus("Tesseract.js is looking at the Sauvola layer…");
        const d = await transcribe(result);
        setDossier(d);
        setForgery(forgeEdition(d.diplomatic, active));
        setStatus("Ink read. Names remain hypotheses. Low-confidence words are holes.");
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
    () => [
      "What did the water take?",
      "Show me the forger.",
      "May I trust the names?",
      "What is a teaching leaf?",
    ],
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
          Field leaf — first-class.{" "}
          <label>
            Open image
            <input type="file" accept="image/*" onChange={(e) => void onUpload(e.target.files)} />
          </label>
        </div>
        <div className="upload">
          Second witness — only agreeing ink is trusted.{" "}
          <label>
            Open witness
            <input type="file" accept="image/*" onChange={(e) => void onWitness(e.target.files)} />
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
              {witnessNote ? ` ${witnessNote}` : ""}
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
          {(["story", "read", "forge", "talk"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        {tab === "story" && active && (
          <div className="story">
            <div className={`honesty ${active.origin}`}>
              {active.origin === "teaching"
                ? "Teaching leaf — generated in this browser to demonstrate the ethic. Not a recovered archive."
                : "Field leaf — your photograph. First-class. The five staged cases exist only to teach."}
            </div>
            <div className="kicker">{active.year}</div>
            <h3>{active.title}</h3>
            <p>{active.story}</p>
            <p>{active.impact}</p>
            <div className="badges">
              <i>{active.place}</i>
              <i>{active.damage}</i>
              <i>{active.workflow}</i>
              <i>{active.origin}</i>
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
                disabled={!result || !active}
                onClick={() =>
                  result && active && downloadDossier(active, result, dossier, forgery, witnessNote)
                }
              >
                First-aid packet
              </button>
            </div>
            <pre className="transcript">
              {dossier?.diplomatic ||
                "The bench has enhanced the leaf. Reading is a separate, fallible act. Choose Tesseract on the binary layer, or — for a teaching leaf — a diplomatic text damaged by the measured holes."}
            </pre>
            {dossier?.words.length ? (
              <div className="wicks" aria-label="Word confidence">
                {dossier.words.map((w, i) => (
                  <span
                    key={`${w.text}-${i}`}
                    className={w.spoken ? "spoken" : "hole"}
                    title={`${w.confidence.toFixed(0)}`}
                  >
                    {w.spoken ? w.text : "†"}
                  </span>
                ))}
              </div>
            ) : null}
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
        {tab === "forge" && (
          <div className="forge">
            <div className="forge-banner">{forgery?.label || "FORGERY — NOT EVIDENCE"}</div>
            <p className="forge-lede">
              Left: the diplomatic edition — holes stay holes. Right: what a completing model
              would invent. Palimpsest will not file the right-hand column as the page.
            </p>
            <div className="forge-grid">
              <div>
                <h4>Diplomat</h4>
                <pre className="transcript">
                  {dossier?.diplomatic || "Read the leaf first, or open a teaching case."}
                </pre>
              </div>
              <div>
                <h4>Forger</h4>
                {forgery ? <ForgedText edition={forgery} /> : (
                  <pre className="transcript">No completing model has been run against this leaf.</pre>
                )}
              </div>
            </div>
            {forgery && (
              <ul className="forge-risks">
                {forgery.spans.map((s) => (
                  <li key={s.invented}>
                    <strong>{s.invented}</strong> — {s.risk}
                  </li>
                ))}
              </ul>
            )}
            <div className="caution">{forgery?.warning || "The forge is a warning, never a product."}</div>
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

function ForgedText({ edition }: { edition: ForgeryEdition }) {
  const parts = splitOnInventions(edition.text, edition.spans.map((s) => s.invented));
  return (
    <pre className="transcript forged">
      {parts.map((part, i) =>
        part.hit ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
      )}
    </pre>
  );
}

function splitOnInventions(text: string, needles: string[]): { text: string; hit: boolean }[] {
  const unique = [...new Set(needles.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!unique.length) return [{ text, hit: false }];
  const escaped = unique.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(${escaped})`, "g");
  return text.split(re).filter(Boolean).map((chunk) => ({
    text: chunk,
    hit: unique.includes(chunk),
  }));
}
