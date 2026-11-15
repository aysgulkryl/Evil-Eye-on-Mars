# Evil Eye on Mars

*Earth's evil eye, watching over Martian life.*

Evil Eye on Mars is an interactive 3D decision-support tool for choosing where to land on Mars. It weighs **landing safety** against **life potential** for 16 candidate sites, and measures how closely each site resembles **Lake Meke** (Konya, Türkiye), a salty volcanic maar lake nicknamed "the evil eye of the world".

Built for the **NASA Space Apps Challenge 2026** (Ankara), challenge: *Interplanetary Survival Guide: Martian Map*.

- **Live app:** <https://evil-eye-on-mars.vercel.app>
- **Full reference list (119 sources):** [REFERENCES.md](REFERENCES.md)

## What it does

- A real 3D Mars globe (NASA/USGS Viking MDIM 2.1) with 16 candidate sites, past landers and named features.
- Two independent sliders: landing safety and life potential. The ranking, pins and charts update live.
- Engineering No-Go filter, a decision map (which site wins at which preference) and the Pareto front.
- A Lake Meke match for every site, shown as a range so that missing data is never guessed.
- Site reports, side-by-side comparison, presentation mode, English and Turkish.

## How the scores work

| Score | What it measures | Data |
|---|---|---|
| **Terra** (safety) | Slope, rock abundance, elevation | NASA MGS MOLA 16 ppd. No-Go if the steepest 10% of regional slopes exceeds **20°**, the MSL (Curiosity) limit at 2–10 km scale (JPL, 2007). |
| **Vita** (life potential) | 5 criteria scored 0–3: rock age, liquid-water duration, biosignature-preserving minerals, sedimentary rock and rapid burial, radiation shielding and access | Scored **independently** by our geologist and our biologist from cited papers; Vita is their average. Rank agreement between the two: Spearman ρ = 0.86. |
| **Meke match** (Earth analog) | 6 features visible from orbit: chloride (25), crater lake (20), paleolake (20), sulfate (15), volcanic context (10), water chemistry / pH (10) | Present = full weight, uncertain = half, absent = 0, **unknown = not counted**. Shown as a range: lower bound if unknowns are absent, upper bound if present. Under 50% data coverage: "insufficient data". |

Composite score = (S × wS + A × wA) / (wS + wA), where S is safety, A is life potential, and wS and wA are the slider weights.

## Results (balanced 50/50, constraints off)

| # | Site | Score | Lake Meke match |
|---|---|---|---|
| 1 | Oxia Planum | 86.5 | 20–70% |
| 2 | Jezero Crater | 74.0 | 75–100% |
| 3 | Meridiani Planum | 73.5 | 47.5–57.5% |
| 4 | Eberswalde Crater | 65.5 | 50–100% |

Gale Crater has the strongest Meke match (90–100%) and passes every engineering check (slope 16.2° < 20°, rocks < 8%). Oxia ranks first whether or not reachable targets outside the landing ellipse are counted.

## Honest limits

- A decision aid, not an official site selection.
- MOLA slopes are regional (about 3.7 km per pixel); metre-scale landing slopes need HiRISE.
- The 10% rock limit is a prototype value without a source; the app labels it in yellow.
- The Meke match compares features seen from orbit; it measures similarity to Meke, not the probability of life.

## Data

**NASA data:** MGS MOLA elevation (MEGDR, 16 pixels per degree), Viking MDIM 2.1 colour mosaic (NASA/USGS, public domain), Landsat 5 imagery of Lake Meke (NASA/USGS).

**Other sources:** 119 published sources on Lake Meke, halophiles and Mars landing sites, each cited by ID in the code and data table ([REFERENCES.md](REFERENCES.md)).

## How it was built

- The user-interface prototype was prepared before the hackathon with AI assistance; our mentor approved using it as a prototype.
- During the hackathon the team added the Lake Meke analog model, sourced data, the Vita rubric with two independent raters, the MOLA slope rule, the range method and the redesigned interface.
- **AI disclosure:** AI assistants helped with code, data extraction and text. All data, weights and scores come from the team and the cited sources.

## Run it

```bash
npm install
npm run dev       # opens the app
npm run dogrula   # runs the calculation tests
npm run build     # type check and production build
```

## Team

| Name | Role |
|---|---|
| Ayşegül Karayel | Team lead, data catalogue, code |
| Asude Öztürk | Software, deployment |
| Oğuz Haydar Güler | Geology, Vita scoring |
| Hasan Öztürk | Biology, Vita scoring, Meke analog |
| Kayra İpek | Literature and references |
| Umut Güllü | Imagery and human-mission data |

## License

- **This repository** (code, team data tables, Vita scores, Lake Meke analog weights and documentation) is released under the **MIT License** (OSI-approved), see [LICENSE](LICENSE).
- **Third-party data** keeps its own terms and is freely available: NASA MGS MOLA, Viking MDIM 2.1 and Landsat imagery (NASA/USGS, public domain).
- **Published papers** are cited by ID in [REFERENCES.md](REFERENCES.md); their content is not reproduced.
