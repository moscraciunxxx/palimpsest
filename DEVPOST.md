# Devpost copy — Palimpsest

Paste the sections below into the Devpost submission form.

## Project title

**Palimpsest** — Recover what time tried to erase

## Tagline (if asked)

A computational scriptorium that restores flood-stained, faded, and handwritten documents in the browser — and refuses to invent the missing letters.

## Problem statement

Paper is still how most of the world proves it exists: land deeds, clinic carbons, school certificates, family letters. Climate disasters turn filing cabinets into compost. The first disaster is water. The second is administrative — you cannot rebuild, vaccinate on schedule, or apply to nursing school with a brown rectangle.

The fashionable AI answer is to let a language model “complete” the page. Completing a recipe is charming. Completing a survey number is forgery. Archives become fiction, and fiction becomes a claim on a field.

## Solution overview

**Palimpsest** is first aid for paper. It is a browser-native computer-vision bench that:

- deskews a page by projection-profile energy
- divides out the lamp (homomorphic illumination)
- isolates ink as Beer–Lambert optical density (unsupervised)
- thresholds locally with Sauvola, not with a global guess
- classifies lacunae (stain, wash, mold, tear) and inpaints *paper fibre only*
- rakes the leaf with a live Lambertian lamp (RTI-lite) so folds stand up
- unmixes two hands: paper-relative cool residual (older iron-gall) vs warm / red-biased later ink. Faded undertext is mid-tone — we do not wait for darkness
- refuses isotropic stains as letters (structure-tensor sentinel, unsupervised, no glyphs proposed)
- collates a second photograph; only agreeing ink is trusted
- reads optionally with Tesseract.js
- speaks through an archivist who is forbidden from inventing ink

Six **teaching leaves** — Kerala 2018, a 1948 letter, a Gulu clinic carbon, a Beira certificate after Cyclone Idai, a stained recipe, and a **scraped psalter reused as a 2018 relief register** — are generated at runtime and labeled as instruments, not recovered archives. The namesake leaf has two hands. The instrument unmixes chemistry. It does not write a psalm.

A photograph you bring is a first-class **field leaf**. Click the leaf for a **spectrometer probe**. The **forge** tab shows what a completing model would invent, stamped FORGERY — NOT EVIDENCE, and never files it as the page. Students can open the **Lessons** studio (eleven leaves) and learn why each algorithm exists. Optional Featherless (hackathon sponsor) gives the archivist an open-weight voice. The bench never needs a key, and the document never needs a server.

## Key features

- Light table with brass compare rule (witness vs. any working layer)
- Raking lamp — drag the brass sun; elevation slider; folds stand up
- Undertext (UV-style fluorescence) and Later hand — two chemistries, one leaf
- Spectrometer probe — click the leaf; iron / carbon / later at that point
- Sentinel — structure tensors refuse stains that are not letters
- Dual-witness collation — second photograph; disagreement is a hole, not a vote
- Visible pipeline: witness, lamp-out, density, Sauvola, holes, restored, raking, undertext, later hand, sentinel
- In-browser OCR (Tesseract.js) with word-level confidence; low-confidence words become holes
- Entities extracted only from spoken ink
- Forger vs diplomat split view (labeled, never evidence)
- First-aid / chain-of-custody packet (seen vs inferred, spectral mass, next human action)
- Evidence-bound archivist; optional Featherless Llama 3.1
- Eleven-lesson computational paleography studio
- Field photograph, processed on-device and treated as first-class

## Technologies used

React 19, TypeScript, Vite, custom CV engine (deskew, homomorphic illumination, Beer–Lambert deconvolution, Sauvola + integral images, lacuna classifier, paper-relative spectral unmixing, RTI-lite raking, structure-tensor sentinel, translation collation), Tesseract.js, optional Featherless.ai Chat Completions API.

## Target users

- Families and community archives holding the only copy of a life
- Rural clinics and land registries whose memory is still paper
- Digital humanists and computer-vision students
- Disaster-recovery volunteers who need first aid for documents, not a cloud

## Social impact statement

When identity is paper, a flood is a deletion event. Palimpsest treats recovery as an ethical act: enhance what remains, mark what does not, never counterfeit a name or a boundary. It runs in the browser so a clinic carbon or a deed does not have to be uploaded to be saved. The same instrument teaches the algorithms it uses, so the next student can improve the bench instead of wrapping another chatbot.

## Built with

`react` · `typescript` · `vite` · `tesseract.js` · `computer-vision` · `sauvola` · `beer-lambert` · `rti` · `structure-tensor` · `featherless` · `on-device-ml` · `digital-humanities` · `climate-resilience` · `document-identity`

## Try it

Live demo (no install): https://moscraciunxxx.github.io/palimpsest/

```
npm install
npm run dev
```

Enter the scriptorium → the namesake leaf is already on the table → drag the brass rule across **Undertext** → open **Raking** and move the lamp → click the leaf for the probe → **Forge** (the oxblood column is not the page) → **Lessons** IX–XI.
