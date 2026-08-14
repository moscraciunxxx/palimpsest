interface Props {
  onEnter: () => void;
}

export function Prologue({ onEnter }: Props) {
  return (
    <section className="prologue">
      <div className="prologue-copy">
        <div>
          <p className="eyebrow">A computational scriptorium</p>
          <h1>
            Recover what
            <br />
            <em>time tried to erase.</em>
          </h1>
          <p className="lede">
            Palimpsest is first aid for paper. It runs a full computer-vision bench —
            illumination correction, Beer–Lambert ink separation, Sauvola
            thresholding, lacuna ethics — entirely in your browser, so a flood-stained
            deed never has to visit a stranger’s server. A completing model is shown
            on a forger’s table and never filed as the page.
          </p>
          <div className="facts">
            <div>
              <strong>850M</strong>
              <span>people still lack official ID; millions more hold it only as paper.</span>
            </div>
            <div>
              <strong>2nd</strong>
              <span>disaster: after the water, the archive. Kerala, Idai, Pakistan.</span>
            </div>
            <div>
              <strong>0</strong>
              <span>invented letters. Holes stay holes. That is the product.</span>
            </div>
          </div>
          <div className="cta-row">
            <button className="btn" onClick={onEnter}>
              Enter the scriptorium
            </button>
            <span className="fine">On-device · no account · five teaching leaves · bring a field photograph</span>
          </div>
        </div>
        <p className="fine">
          Built for the ML Empowerment Build Challenge 2.0 — a student instrument,
          not a startup costume.
        </p>
      </div>
      <aside className="prologue-leaf">
        <div className="grain" />
        <blockquote>
          “A language model completing a survey number is a polite forger.”
          <cite>The ethics of the hole · Lesson V</cite>
        </blockquote>
      </aside>
    </section>
  );
}
