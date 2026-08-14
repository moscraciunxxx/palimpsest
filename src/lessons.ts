export interface Lesson {
  id: string;
  numeral: string;
  title: string;
  lede: string;
  body: string[];
  formula?: string;
}

export const LESSONS: Lesson[] = [
  {
    id: "paper",
    numeral: "I",
    title: "Why paper dies",
    lede: "Cellulose remembers water. Ink remembers oxygen.",
    body: [
      "A deed in a steel box is not a cloud backup. When the river enters the box, sizing dissolves, fibres swell, and iron-gall ink migrates. The information is often still there — just no longer in the contrast your eye was trained on.",
      "Palimpsest is first aid, not a vault. It makes the remaining optical density legible and refuses to counterfeit what the flood took. That refusal is the product.",
    ],
  },
  {
    id: "illumination",
    numeral: "II",
    title: "Dividing out the lamp",
    lede: "Phone photos of documents are mostly lighting.",
    body: [
      "A global contrast stretch treats a shadow as meaning. We estimate the paper — the slow field — with a large-kernel blur, then divide the page by that field. What remains is reflectance, not irradiance.",
      "This is the same idea as homomorphic filtering: illumination is multiplicative and low-frequency. Ink is not.",
    ],
    formula: "R(x) = I(x) / (Gσ * I)(x)",
  },
  {
    id: "beer",
    numeral: "III",
    title: "Beer–Lambert ink",
    lede: "Ink is an optical density, not a grey value.",
    body: [
      "Transmission through a stain follows I = I0 e^{-εcl}. Taking −log turns a brown wash and a black stroke into comparable quantities. We weight the blue-green channels because iron-gall and cheap ballpoint live there.",
      "The brass layer you see is that density, stretched. It is unsupervised machine perception: no labelled letters, only physics.",
    ],
    formula: "D = −log(I + ε) · s_ink",
  },
  {
    id: "sauvola",
    numeral: "IV",
    title: "Sauvola’s local decision",
    lede: "A carbon copy and a flood stain need different thresholds on the same page.",
    body: [
      "J. Sauvola’s adaptive threshold asks whether a pixel is dark relative to its neighbourhood, scaled by local variance. High-variance neighbourhoods (real text) get a stricter test. Flat stains do not become alphabets.",
      "We compute this in linear time with integral images — a 1990s systems trick that still earns its keep in the browser.",
    ],
    formula: "T = m (1 + k (s/R − 1))",
  },
  {
    id: "lacuna",
    numeral: "V",
    title: "The ethics of the hole",
    lede: "A language model completing a survey number is a polite forger.",
    body: [
      "Lacunae are classified as stain, wash, mold, or tear. The restored layer fills them with paper fibre, never with guessed glyphs. Scholarly editions have used 〈angle brackets〉 and [sic] for centuries. We inherit that grammar.",
      "This is the opposite of most ‘AI document’ products. Completing a recipe is charming. Completing a deed is a civil risk.",
    ],
  },
  {
    id: "identity",
    numeral: "VI",
    title: "Proof after the water",
    lede: "The second disaster is administrative.",
    body: [
      "The World Bank’s ID4D programme estimates that about 850 million people still lack official proof of identity, and far more hold that proof only as paper. Climate disasters — Kerala 2018, Idai 2019, Pakistan 2022 — turn filing cabinets into compost.",
      "Palimpsest runs entirely in your browser so a clinic carbon or a land deed never has to visit a stranger’s server. Optional Featherless speech is a scholar in the room, not a vault in the cloud.",
    ],
  },
  {
    id: "forger",
    numeral: "VII",
    title: "The forger in the room",
    lede: "Show the completing model. Never file it.",
    body: [
      "Most ‘AI document recovery’ products do one extra step: they write letters into the stain. Palimpsest keeps that step, but only as a labeled warning. The forge tab is a forger’s table — Survey No. 218/1, a raised mark, a dose that may never have happened.",
      "The diplomatic edition and the first-aid packet never absorb those words. If a judge cannot tell the two columns apart, the product has failed.",
    ],
  },
  {
    id: "leaves",
    numeral: "VIII",
    title: "Teaching leaf vs field leaf",
    lede: "The five cases are instruments. Your photograph is the work.",
    body: [
      "Kerala, Amina, Gulu, Beira, and Nana’s cake are generated in this browser so you can see the ethic before you risk a real page. They are not recovered archives. A banner says so.",
      "A field leaf — a phone photo you bring — is first-class. A second photograph is a dual witness: only agreeing ink is trusted. Disagreement is a hole, not a vote.",
    ],
  },
];
