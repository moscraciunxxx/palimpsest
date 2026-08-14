# Palimpsest

**A computational scriptorium for documents the world cannot afford to lose.**

Recover what time, water, and forgetting tried to erase — entirely in the browser.

**Live demo (no install):** https://moscraciunxxx.github.io/palimpsest/

The demo is the production Vite build on GitHub Pages (`gh-pages` branch).

```
npm install
npm run dev
```

Open the printed address, or the live demo above. Enter the scriptorium. Pull a leaf from the archive.

---

## Problem

Paper is still how most of the world proves it exists.

A land deed in a steel box, a clinic carbon in a sunlit ledger, a Form 4 certificate in a school cabinet, a letter in a biscuit tin: these are not “legacy formats.” They are the working memory of families who do not have a cloud. When the river enters the box — Kerala 2018, Cyclone Idai 2019, Pakistan 2022 — the first disaster is water. The second is administrative. Without a readable document there is no rebuild loan, no immunization series, no nursing-school application, no name that a granddaughter can still hear.

The fashionable answer is to point a language model at a photograph and let it “fill in.” That is forgery with good manners. Completing a recipe is charming. Completing a survey number is a civil risk.

## Solution

Palimpsest is first aid for paper, not a vault and not a novelist.

It runs a classical-and-unsupervised vision bench on-device:

1. **Projection-profile deskew** — find the angle that maximises row-energy, then rotate.
2. **Homomorphic illumination** — divide the page by a large-kernel estimate of the lamp, so a shadow is not a meaning.
3. **Beer–Lambert ink separation** — treat ink as optical density, not a grey value. Unsupervised. No labelled letters.
4. **Sauvola adaptive thresholding** — local mean and variance via integral images, so a flood stain and a pale carbon can share a page without sharing a threshold.
5. **Lacuna detection** — stain, wash, mold, tear. The restored layer inpaints *paper fibre only*. Never glyphs.
6. **Line geometry + confidence** — a diplomatic edition, not a clean one.
7. **Optional Tesseract.js** on the binary layer, and an archivist who is forbidden from inventing missing ink.
8. **Optional Featherless** (sponsor open-weight API) if you want the archivist to speak with a larger model. The bench never needs a key.

An eight-lesson studio sits under **Lessons**: why paper dies, why we divide instead of subtract, why a hole must remain a hole, why the forger is shown and never filed, and why a teaching leaf is not an archive. The instrument is also a classroom — aligned with the ML Empowerment Foundation’s reason for existing.

## Key features

- **Light table** with a brass compare rule: witness versus any working layer.
- **Five teaching leaves**, generated at runtime and labeled as instruments, not recovered archives: a Kerala settlement deed, a 1948 family letter, a Ugandan clinic carbon, a Beira school certificate, a stained recipe card.
- **Field leaf** — a photograph you bring is first-class, not a demo afterthought.
- **Forger’s table** — a labeled FORGERY / NOT EVIDENCE column showing what a completing model would invent. Never the restored product.
- **Uncertainty-aware reading** — Tesseract word confidence; below the wick the word becomes a hole. Entities are taken only from spoken ink.
- **Dual-witness** — a second photograph; only agreeing ink is trusted. Disagreement is a hole, not a vote.
- **First-aid packet** — seen vs inferred, a local fingerprint, and the next human action (registrar, clinician, living witness, ministry). Not a title.
- **Archivist** — local, evidence-bound answers; optional Featherless.
- **Privacy** — the document never leaves the machine unless you deliberately open Featherless.

## Who it is for

- Families and community archives holding the only copy of a life.
- Rural clinics and registrars whose registers are still paper.
- Students of computer vision, digital humanities, and documentary heritage.
- Anyone who has been offered an AI that “completes” a legal text and felt, correctly, that this was a threat.

## Technologies

| Layer | Choice | Why |
| --- | --- | --- |
| Interface | React 19 + TypeScript + Vite | Immediate, inspectable, deployable |
| Geometry | Projection profiles, bilinear resample | Deskew without a neural net |
| Photometry | Homomorphic division, Beer–Lambert OD | Physics before labels |
| Binarisation | Sauvola + integral images | Linear-time adaptive threshold |
| Layout | Projection + connected line bands | Confidence per line |
| Reading | Tesseract.js (in-browser LSTM OCR) | Real OCR, optional |
| Speech | Local archivist · Featherless Llama 3.1 | Sponsor API, never required |
| Storage | Indexed nothing unless you export | Privacy by construction |

No training set was scraped. No deed was sent to a server to write this README.

## Judging notes

| Criterion | Where to look |
| --- | --- |
| Technical implementation | `src/engine/` — real algorithms, not a wrapper |
| Creativity | The ethic: recovery without counterfeit |
| Impact | Climate-lost identity, clinic carbons, family memory |
| Design | The scriptorium, not a purple SaaS dashboard |
| Documentation | This file, `DEVPOST.md`, and the in-app Lessons |

Judge-facing screenshots live in `docs/`. Paste-ready Devpost copy is in `DEVPOST.md`. The submission checklist is `SUBMIT.md`.

## Scripts

```bash
npm install
npm run dev      # studio
npm run build    # production bundle
npm run preview  # serve the bundle
```

Optional: paste a Featherless key under **Key**. The product is complete without it.

## Team

Solo submission. Author: Vitaly.

## License of the idea

Use it to read your grandmother’s hand. Do not use it to invent a boundary.
