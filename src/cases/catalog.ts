import type { ForgerySpan } from "../engine/types";

export type CaseId = "kerala" | "amina" | "clinic" | "idai" | "recipe" | "scraped" | "field";
export type LeafOrigin = "teaching" | "field";
export type Workflow = "tenure" | "care" | "memory" | "credential" | "inheritance" | "heritage";

export interface CaseFile {
  id: CaseId;
  origin: LeafOrigin;
  workflow: Workflow;
  shelf: string;
  title: string;
  year: string;
  place: string;
  damage: string;
  story: string;
  impact: string;
  groundTruth: string;
  font: "deed" | "hand" | "carbon" | "diploma" | "recipe" | "psalter";
  forgeries: ForgerySpan[];
}

export const WORKFLOW_NEXT: Record<Workflow, string> = {
  tenure:
    "A registrar must compare this packet to a second registered copy. Palimpsest is first aid, not a title.",
  care: "A clinician must confirm the series from a parent-held card or the register book. Do not vaccinate from a guess.",
  memory: "A living witness who knew the hand is the second reader. The hole is not a biography.",
  credential:
    "The issuing school or ministry must reissue. This packet is a draft of what remains on the paper.",
  inheritance: "Taste is not a legal fact. The hole stays a hole.",
  heritage:
    "A paleographer or the holding archive must confirm the undertext. Palimpsest only separates chemistry, it does not name the scraped hand.",
};

export function fieldLeaf(name: string): CaseFile {
  return {
    id: "field",
    origin: "field",
    workflow: "tenure",
    shelf: "00 — Field",
    title: name.replace(/\.[^.]+$/, "") || "Untitled leaf",
    year: new Date().toISOString().slice(0, 10),
    place: "Your table",
    damage: "Unknown — the instrument will only hypothesise from light",
    story:
      "This leaf entered the scriptorium from your camera, not from the teaching press. Palimpsest will lift what ink remains and refuse the rest. It will not invent a survey number, a dose, or a name.",
    impact:
      "A field leaf is first-class. The six staged cases exist only to teach the ethic. Your photograph is the work. Nothing left this machine.",
    groundTruth: "",
    font: "deed",
    forgeries: [],
  };
}

export const CASES: CaseFile[] = [
  {
    id: "kerala",
    origin: "teaching",
    workflow: "tenure",
    shelf: "01 — Tenure",
    title: "Settlement Deed, Alappuzha",
    year: "2009 / recovered 2018",
    place: "Kuttanad, Kerala",
    damage: "Flood bloom, iron-gall bleed, 3.2° skew",
    story:
      "After the 2018 Kerala floods, metal deed boxes sat in brown water for days. Land is still proved on paper here. Without a readable deed, a family cannot rebuild, borrow, or resist a false claim.",
    impact:
      "UNDRR and the World Bank both treat lost civil documentation as a second disaster: the water recedes, the proof of life does not return.",
    groundTruth: `GOVERNMENT OF KERALA
OFFICE OF THE SUB-REGISTRAR, ALAPPUZHA

SETTLEMENT DEED  No.  4187 / 2009

This deed of settlement is made on the 14th day of August, 2009
between RAMAN PILLAI, son of Krishnan Pillai, residing at
Ward VII, Kainakary, Kuttanad (hereinafter the SETTLOR)
and ANJALI PILLAI, daughter of Raman Pillai (the BENEFICIARY).

The Settlor hereby transfers all that parcel of paddy land
measuring 42 cents in Survey No. 216/3, lying on the south
of the Pamba bund road, together with the thatched dwelling
and the coconut garden appurtenant thereto.

Consideration: natural love and affection; no money paid.
Boundaries: North — canal; East — property of Thomas Joseph;
South — bund; West — property of the Settlor retained.

Witnesses:
1. S. Mathew, Village Assistant
2. Fatima Beevi, neighbour

Registered this day under the Registration Act, 1908.`,
    font: "deed",
    forgeries: [
      {
        invented: "Survey No. 218/1",
        hole: "survey parcel",
        risk: "Wrong parcel — a forged boundary.",
      },
      {
        invented: "48 cents",
        hole: "area",
        risk: "An inflated holding sold as recovered ink.",
      },
      {
        invented: "ANJALI MENON",
        hole: "beneficiary",
        risk: "A substituted heir.",
      },
    ],
  },
  {
    id: "amina",
    origin: "teaching",
    workflow: "memory",
    shelf: "02 — Memory",
    title: "Letter from Amina",
    year: "October 1948",
    place: "Haifa → family, unread for decades",
    damage: "Faded iron ink, fold fractures, foxing",
    story:
      "Family letters are the unofficial archive of displacement. Ink oxidizes. Folds become knives. A granddaughter finds a packet in a biscuit tin and cannot read the hand that raised her father.",
    impact:
      "UNESCO calls documentary heritage a human right. Most of it is not in libraries. It is in drawers, and it is dying on schedule.",
    groundTruth: `My dearest sister,

I write from the upstairs room. The sea is the same colour
it was when we were girls, but the street under the window
is not the street I memorised.

They say we may leave with one suitcase. I have put
Mother's bracelet in the lining and the photograph of
the courtyard lemon tree. If this letter reaches you
before I do, keep the blue key. The one for the chest.

I am well enough. The children ask for the taste of
your bread. Tell Father I kept the names.

Yours, in the old house still,
Amina
12 October 1948`,
    font: "hand",
    forgeries: [
      {
        invented: "the blue key under the third stair",
        hole: "instruction",
        risk: "A completed memory that was never written.",
      },
      {
        invented: "we leave on Thursday",
        hole: "date of flight",
        risk: "A schedule invented from a stain.",
      },
    ],
  },
  {
    id: "clinic",
    origin: "teaching",
    workflow: "care",
    shelf: "03 — Care",
    title: "Rural clinic carbon copy",
    year: "2023",
    place: "Gulu District, Uganda",
    damage: "Low-contrast triplicate, purple bleed, glare",
    story:
      "The only record of a child's immunization is a carbon that lived in a sunlit ledger. The family copy faded in a pocket. The clinic copy is the last witness.",
    impact:
      "WHO still depends on paper routine-immunization registers across large parts of the world. A pale carbon is the difference between a complete series and a guess.",
    groundTruth: `GULU DISTRICT HEALTH OFFICE
OUTREACH CLINIC  —  PATIKO

CHILD HEALTH CARD  (clinic carbon)

Name: OKELLO DANIEL
Sex: M     Date of birth: 03 / 02 / 2022
Mother: AKELLO GRACE     Village: PAICHO

Immunization
BCG            11/02/2022   left deltoid   scar +
OPV 0          11/02/2022
Penta 1 / OPV 1 / PCV 1    15/03/2022
Penta 2 / OPV 2 / PCV 2    19/04/2022
Penta 3 / OPV 3 / PCV 3    17/05/2022
Measles        08/02/2023   right arm

Weight at last visit: 9.4 kg
Next appointment: 12 / 08 / 2023
Notes: no adverse event. advise ORS + zinc if diarrhoea.`,
    font: "carbon",
    forgeries: [
      {
        invented: "Penta 3 17/06/2022",
        hole: "third dose",
        risk: "A dose that may never have happened.",
      },
      {
        invented: "OKELLO DAVID",
        hole: "child name",
        risk: "Wrong child, same village.",
      },
    ],
  },
  {
    id: "idai",
    origin: "teaching",
    workflow: "credential",
    shelf: "04 — Credential",
    title: "School certificate, Beira",
    year: "2016 / cyclone 2019",
    place: "Beira, Mozambique",
    damage: "Mold bloom, torn corner, tide line",
    story:
      "Cyclone Idai took the roof off a secondary school and the filing cabinet with it. A damp certificate is often the only proof that a young person finished Form 4 — required for nursing school, a visa, a first job.",
    impact:
      "After climate disasters, replacement credentials can take years. Meanwhile a generation waits outside the formal economy.",
    groundTruth: `REPÚBLICA DE MOÇAMBIQUE
MINISTÉRIO DA EDUCAÇÃO

CERTIFICADO DE CONCLUSÃO
ENSINO SECUNDÁRIO  —  2.º CICLO

This is to certify that
MARTA INÊS CHISSANO
born 22 May 1998 at Dondo
has completed Form 4 at
Escola Secundária Samora Machel, Beira
in the academic year 2016

Final classification: 14 / 20  (Bom)
Subjects: Portuguese, English, Mathematics,
Biology, History, Geography.

Issued at Beira, 18 December 2016
Headmaster: Joaquim T. Nhampossa
No. 2016 / ESM / 0841`,
    font: "diploma",
    forgeries: [
      {
        invented: "16 / 20  (Muito Bom)",
        hole: "classification",
        risk: "A raised mark that a ministry never issued.",
      },
      {
        invented: "No. 2016 / ESM / 0912",
        hole: "certificate number",
        risk: "A serial that belongs to no ledger.",
      },
    ],
  },
  {
    id: "recipe",
    origin: "teaching",
    workflow: "inheritance",
    shelf: "05 — Inheritance",
    title: "Nana's cardamom cake",
    year: "c. 1974",
    place: "Kitchen drawer, anywhere",
    damage: "Ghee ghost, sugar grit, water ring",
    story:
      "Not every recovered document is a deed. Some are the last copy of a taste. Oil and time are as efficient as floodwater. The recipe is a small archive of a person.",
    impact:
      "Domestic manuscripts are the largest uncatalogued collection on earth. They expire without accession numbers.",
    groundTruth: `Nana's cardamom cake
(do not give this to Mrs. Rao)

2 cups flour, sifted twice
1 cup sugar  —  the fine one
3 eggs, room warm
1/2 cup ghee, melted and cooled
3/4 cup thick yoghurt
1 tsp baking powder
8 pods cardamom, seeds crushed
pinch salt
zest of one lemon if we have it

Beat sugar and ghee until pale.
Add eggs one by one. Fold flour.
The batter should fall in a ribbon.
Tin greased with the paper from the butter.
180° until the knife comes clean —
about 40 minutes, listen to the house.

When Father was alive we used the
blue bowl. Same bowl. Same order.`,
    font: "recipe",
    forgeries: [
      {
        invented: "1 tsp baking soda",
        hole: "leavener",
        risk: "A substitution that ruins the cake and the memory.",
      },
      {
        invented: "Mrs. Rao may have a copy",
        hole: "aside",
        risk: "Gossip written into a stain.",
      },
    ],
  },
  {
    id: "scraped",
    origin: "teaching",
    workflow: "heritage",
    shelf: "06 — Palimpsest",
    title: "Scraped psalter, reused",
    year: "c. 1180 / overwritten 2018",
    place: "A leaf that survived by becoming a register",
    damage: "Two inks. One scrape. The later hand is a flood register.",
    story:
      "The namesake. A psalter leaf was scraped and reused as a 2018 Kerala relief register. The older iron-gall is still in the paper. Palimpsest does not complete the psalm. It only asks which chemistry is which.",
    impact:
      "Palimpsest the word means a scraped book. Most 'AI recovery' would mash both hands into one fluent paragraph. That is two forgeries at once.",
    groundTruth: `RELIEF REGISTER
Ward VII, Kainakary
19 August 2018

Name                    Rice kg
RAMAN PILLAI                 12
ANJALI PILLAI                 8
FATIMA BEEVI                 10
S. MATHEW                     6
THOMAS JOSEPH                14
LEELA KUMARI                  9
JOSEPH CHACKO                 7
MARYKUTTY                    11

Counted at the panchayat hall.
Wet ink. No second issue today.
Boats still at the bund.
Rice from the school godown.`,
    font: "psalter",
    forgeries: [
      {
        invented: "Beatus vir qui non abiit in consilio",
        hole: "undertext",
        risk: "Completing a psalm from a stain.",
      },
      {
        invented: "RR-2018-4401",
        hole: "ration serial",
        risk: "A serial no ledger issued.",
      },
    ],
  },
];

export function caseById(id: string): CaseFile | undefined {
  return CASES.find((c) => c.id === id);
}
