# 10 · Feasibility Analysis — building Emberwold

**Status:** v1 draft (Lead) · **Depends on:** `02`–`07`, `11`–`14` · **Date:** 2026-10-24

> **Verdict up front: FEASIBLE — with a hard scope cut and a legal decision before any
> public release.** The game is fully specified by official rules, its hardest systems have
> already been implemented by open-source projects, and a *deliberately reduced* version is
> a realistic solo-developer project (≈30–50 engineer-weeks baseline; ≈3–5 months calendar
> with heavy AI assistance). The two things that actually kill projects here are **content
> long-tail** (every card/ability is a mini-program) and **IP** (the name/art/text are
> WizKids'). Neither is a technical unknown.

## 1. What "feasible" needs to cover

A digital adaptation can fail on any of five axes. This analysis treats them separately,
because they have very different risk profiles:

| Axis | Question | Verdict |
|---|---|---|
| **Rules** | Are the rules complete and unambiguous enough to implement? | ✅ Yes, with an ambiguity register (`04`) |
| **Engineering** | Can a small team build the engine + UI? | ✅ Proven by prior art; effort is content-bound |
| **Content** | Can we cover enough cards/enemies/sites to feel like the game? | ⚠️ Yes only with a curated subset (`11`) |
| **Product** | Is there an audience and a reason to exist? | ✅ Strong niche demand; quality bar is high |
| **Legal** | Can we ship it? | ❌ Not without a decision (`06`) |

## 2. Evidence base

What this assessment is built on (all traceable via `08-sources.md`):

1. **Complete official rules** — MKUE core rulebook (24 pp.), expansions rulebook (16 pp.),
   full walkthrough (20 pp.), master site reference (2 pp.), and the 2012 base rulebook
   containing the **full Scenario Book** including *Solo Conquest*.
2. **A mature open-source implementation** — `mage-knight-digital/MageKnight` (Rust engine,
   TypeScript client): ~1,255 commits, created 2025-12-31, still active 2026-10-24, README
   reports ~2,100 Rust tests, 6-crate workspace, data modules for every card/enemy/unit/skill/
   tile/scenario, plus an RL training harness.
3. **Smaller prior art** — a completed static-web remake (`kyle-ip/mage-knight`), Haskell and
   Python models, TTS/Vassal mods.
4. **Market/reception facts** — BGG 2024 People's Choice #2 solo game (third year at #2);
   sold out within a month of 2011 release; Origins Hall of Fame 2019.

This is an unusually strong evidence base for a feasibility study: we are not guessing
whether the rules engine can be built, we can read one.

## 3. Rules feasibility

### 3.1 What the rules are made of

MK is a **deterministic, perfect-information, card-driven optimisation game** with:

* a 2-phase (Day/Night) round loop and per-player turns with an explicit action budget;
* a hex map revealed tile-by-tile, with movement costs by terrain and site-specific rules;
* dual-use cards (printed effect / sideways value), mana of 6 colours + gold/black, and
  boostable effects;
* a multi-phase combat pipeline (ranged/siege → block → attack → damage/assign) with
  resistances, fortification, and enemy abilities;
* progression (fame → levels → skills → advanced actions/spells/artifacts → units) and
  reputation;
* scenario rules, a dummy player (solo), and PvP combat.

None of these is exotic for a video game. The difficulty is **breadth and exactness**, not
conceptual novelty.

### 3.2 Is it unambiguous enough?

Mostly. The rulebook is unusually precise, but a rules engine needs decisions the rulebook
leaves to convention. Examples that will bite:

* timing windows and simultaneous effects (e.g. multiple "at the start of turn" effects);
* provocation/rampaging enemies and movement interruption;
* fortified + ranged/siege interaction, and when an assault becomes a block;
* card-effect ordering and optional triggers ("may") — the engine needs a priority system;
* hidden information (decks/offers) and what the UI may reveal;
* undo legality (what is reversible without leaking information).

`04-faq-clarifications.md` turns these into a prioritised decision register with recommended
resolutions. **This is the single most valuable rules artifact for implementation** — it is
where a faithful engine is won or lost.

### 3.3 Rules verdict

**Feasible.** Risk is concentrated in *long-tail card interactions*, not in the core loop.
Mitigation: an effect DSL + data-driven cards + golden-trace tests (see `12`), and a content
cut for v1 (`11`).

## 4. Engineering feasibility (what prior art proves)

### 4.1 The upstream project

| Metric | Value | What it tells us |
|---|---|---|
| Created → last commit | 2025-12-31 → 2026-10-24 (~10 months) | A deep engine + client is achievable in under a year by a very small team |
| Commits | ~1,255 (peak month 625) | Sustained, high-frequency iteration |
| Contributors | **1 human** (+ bot accounts incl. `mage-knight-claude-automation[bot]`, `claude`) | Owner + AI automation did the bulk — this is an AI-assisted build |
| **Written twice** | TS engine ~7 weeks / 1,062 commits, then rewritten in Rust over ~8 months / 193 commits | Architecture churn is real, but golden traces made a rewrite affordable (`05` §1.2) |
| Code size | Rust **120,880 lines / 132 files** (plus TS client, Python RL SDK) | Big: tens of thousands of lines of engine + UI |
| Tests | ~2,100 Rust tests in the README at the time we first reviewed it; a later review of the same repo saw 8 crates / ~2,459 tests — active development, numbers drift | The domain rewards (and demands) heavy testing |
| Releases | **none** | Deep engine ≠ shippable game; polish/UX/AI remained unfinished |
| Open issues | **147** | Long tail is real |
| Licence | **none declared** (all rights reserved) | Cannot reuse code; study only, clean-room |

**Interpretation:** this is simultaneously the *strongest proof of technical feasibility* and
the *clearest warning about scope*. A lone developer plus AI produced an is-this-real engine
in ~10 months and still had not shipped. Emberwold's entire reason to exist is to be the
version that ships: fewer cards, one scenario, handcrafted maps, no RL.

### 4.2 Recommended shape (detail in `12-architecture.md`)

* **Authoritative rules engine as a pure, deterministic reducer** — `(state, action) → state`,
  seeded RNG, event log for replay/debug/tests.
* **Data-driven content** — cards/enemies/sites/tiles as data + small effect primitives,
  consumed from `game-data/`.
* **UI reads projected state + enumerated legal actions** — never re-implements rules.
* **Web-first (TypeScript/React + PixiJS or Godot web export)** for iteration speed and
  demoability. Web is the lowest-friction path to playtesters.
* **No AI in v1** (solo game); heuristic bot only if PvP/co-op vs AI is a v2 goal (`13`).

### 4.3 Engineering verdict

**Feasible for a small team.** Effort is dominated by content encoding and UI, not by novel
algorithms. Avoid the two classic traps: (a) writing rules twice (engine + UI), (b) building
a general "AI" before the rules are complete.

## 5. Scope options

Three credible shapes. All preserve the six pillars in `01-game-overview.md` §3.

| | **A. Faithful MKUE** | **B. Emberwold (recommended)** | **C. Inspired roguelike** |
|---|---|---|---|
| Heroes | 7 (UE; 8 incl. 2026 expansion) | 2 | 1–2 |
| Map | full deck + cities, random | fixed 3–4 tile map, authored | single handcrafted map |
| Cards | full pools (~250+ unique effects) | curated ~90–120 unique effects | ~40 simple effects |
| Enemies | all tokens | ~12 + 1 city garrison | ~8 |
| Scenarios | all | Solo Conquest-derived | original run-based |
| Rounds | 3–6 | 3 (Day/Night/Day), 30–45 min | 1–2, 20–30 min |
| PvP | yes | no | no |
| Effort (baseline) | 90–140 ew | **30–50 ew** | 12–20 ew |
| Risk | Very high (years, IP) | **Medium** | Low-medium |
| "Is it Mage Knight?" | exactly | recognisably yes | no — different game |

**Recommendation: B.** A is a multi-year commitment that the upstream project shows is hard
to finish; C loses the identity that makes the project interesting and is a different product
(if the goal is only "a hex roguelike", use original IP and skip `06`). B is the version a
small team can actually ship, and it leaves hooks to grow toward A (`11` §7).

## 6. Effort model (bottom-up)

Assumptions: solo/small team; experienced developer; **heavy AI assistance** (as this repo
already demonstrates); placeholder art until playable; scope = option B.

| Workstream | Baseline (ew) | Notes |
|---|---|---|
| Rules engine core: rounds/turns, movement, mana, combat, sites, leveling, dummy player, deck economy | 6–9 | The core loop is well understood; tests do the heavy lifting |
| Card/effect system + content for ~90–120 unique cards | 6–10 | ~1–1.5 days per non-trivial card incl. tests; DSL amortises |
| Map/tiles, scenario authoring, setup/end/scoring | 1–2 | Fixed map removes procedural/generation risk |
| Data pipeline + validation + golden traces | 1–2 | Reuses `game-data/` and `tools/` |
| UI: hex map, camera, tiles, sites, cards, combat, offers, level-up, tooltips | 6–10 | Highest uncertainty; art-independent layout work |
| Tutorial/onboarding + rules reference UI | 2–4 | Needed for a small game to land; can ship "learn by doing" first |
| Save/resume, undo, settings, accessibility | 1–2 | Undo semantics must not leak information |
| Audio/VFX/polish | 2–3 | Can be deferred past first playable |
| QA, balance, bug-fix tail | 3–5 | Content long tail shows up here |
| **Total** | **≈28–47 ew** | ~7–12 months solo without AI; **≈3–5 months calendar with heavy AI assistance**; 2 people ≈ 4–6 months |

**Cross-check vs prior art:** upstream implemented roughly 2–3× this content surface plus an
RL stack and an automated UI in ~10 months with one developer + AI. Our estimate is
consistent with that, and the delta is exactly the content/polish we deliberately cut.

**Validation gate:** a 2-week spike should build one full round + one assault + one site on
two tiles with ~20 cards and no art. If the rule/UI seam works there, the rest is volume. If
it doesn't, stop and re-scope (see §9).

## 7. Risk register

| # | Risk | L×I | Why | Mitigation |
|---|---|---|---|---|
| R1 | **Content long tail** — 150 small effect bugs | H×H | Every card is a spec + test | Effect DSL, data-driven cards, golden traces; cut card pool in v1 |
| R2 | **Rules ambiguity/timing** | M×H | Rulebook leaves conventions open | `04` register; encode decisions as tests; log player-visible explanations |
| R3 | **UI complexity/legibility** | H×H | MK is information-dense; bad UI kills it | Prototype UI early with placeholder art; playtest with a board-game player |
| R4 | **Scope creep back to "full MKUE"** | H×H | The full game is seductive | Hard MVP gate (`11`), content manifest, "no new cards" rule until v1 ships |
| R5 | **IP/trademark takedown** | M×H | Name/art/text are WizKids' | Decide path before public release (`06`); own art; **architect content as a swappable skin so a clean-room re-theme is a data change**; original public name |
| R6 | **AI opponent expectation** | M×M | Players may expect a PvP bot | Scope solo explicitly (`13`); don't promise AI |
| R7 | **Solo-developer burnout / unfinished** | M×H | Prior art pattern | Milestone-driven, playable-at-every-milestone (`14`) |
| R8 | **Accidental code copying from upstream** | L×H | Repo has no licence | Clean-room rules; no copy-paste; if studying code, document and re-derive |
| R9 | **Performance on large maps** | L×M | Hex rendering + many tokens | 2D, modest maps in v1; profile early |
| R10 | **Trademark/naming search for "Emberwold"** | M×M | Close to "Mage Knight" | Screen before naming publicly; keep working title internal (`06`) |

## 8. Product assessment (summary; detail in `05`/`06`)

* **Audience:** a dedicated solo/co-op board-game audience. MK is ranked #2 solo game; its
  players already play digitally via TTS/Vassal because the physical setup is heavy.
* **Why a digital version:** removes bookkeeping, saves a 3-hour session, teaches the rules,
  enables short sessions. These are the top community complaints.
* **Demand evidence (stronger than expected):** Tabletop Simulator's Steam Workshop has
  **21 Mage-Knight-specific mods totalling ≈276k lifetime subscriptions**; the top scripted
  mod alone has **161,894**. The audience already plays an unlicensed, rules-ungoverned
  version at scale (`05` §3). The flagship open-source engine, by contrast, has 5 GitHub
  stars — discoverability and legitimacy are the bottlenecks, not demand.
* **Rights were licensed once and went nowhere:** in Jan 2019 **Dire Wolf Digital** announced
  a WizKids deal with *Mage Knight* as its first title; it never shipped and is absent from
  Dire Wolf's catalogue as of 2026-10-24 (`06` §5.3–5.4; `05` §3). So the licence is
  licensable and has been optioned before — a warning about commercial economics under a
  licence, not about technical feasibility.
* **Competition:** no publicly released official digital adaptation of the *board game*
  (the 2006 PC/DS titles adapt the miniatures game; ⚠️ not exhaustive). The real competition
  is TTS/Vassal, plus an unreleased open-source engine.
* **Quality bar:** the audience knows the rules cold. An engine that is 95% right reads as
  "wrong"; trust is the product. This is a reason to under-promise and be exact.
* **Positioning options:** (1) personal/portfolio project (no release), (2) free
  non-commercial fan release (own art, no trademarks, DMCA exposure), (3) licensed product
  (pitch WizKids — they have licensed before, but have no board-game digital line), (4)
  original-IP "inspired by" game (highest long-term freedom, different audience promise).

## 9. Go / no-go criteria and gates

| Gate | Criterion | If failed |
|---|---|---|
| G0 (legal) | Chosen release path is compatible with assets/name being used | Stay private/local only |
| G1 (spike, end wk 2) | One full round + assault + site, 20 cards, no crashes, fun | Re-scope to option C or stop |
| G2 (vertical slice, ~wk 6–8) | Solo Conquest playable end-to-end with 2 heroes, placeholder art | Cut content further; reduce scenario to 2 rounds |
| G3 (playtest, ~wk 10–14) | 5 external board-game players complete a game; ≥3 say "again" | Fix UX or abandon |
| G4 (release candidate) | Tutorial, save/resume, settings, no rule deviations in golden suite | Delay release; no "beta" with known rule bugs |

**Recommendation: GO**, scoped to option B, with G0 decided before any public artifact.

**Decision recorded (2026-10-24):** GO, as a **personal educational hobby project** with a
**clean-room re-theme** (ADR-001/002 in [`00-decisions.md`](./00-decisions.md)). That resolves
G0 for private development; the public-release gates in `06` §9 still apply before anything
is shown publicly. Stack choice remains open (ADR-003); art approach in `16-art-brief.md`. The
project is worth doing because the gap is real and the technical risk is already retired;
the discipline required is entirely about *not* building the full game.

## 10. Decisions needed from you

1. **Purpose** — personal/portfolio, free fan release, or commercial? (Determines whether we
   design around licensing at all.)
2. **Platform** — web-first (fastest to playable) vs. Steam/desktop vs. mobile-first?
3. **Scope** — confirm option B (2 heroes, fixed map, Solo-Conquest-derived, 30–45 min) or
   push closer to A?
4. **Art** — placeholder/programmer-art v1, or budget for an illustrator early?
5. **Name** — keep "Emberwold" as internal working title, or screen a distinct public name?
6. **AI** — accept "solo only, no opponent AI" for v1?

## 11. What this research already de-risked

* Rules are downloadable, complete, and extractable → no dependency on expensive out-of-print
  boxes or fuzzy memory.
* The scenario gap is closed (Solo Conquest rules recovered from the 2012 base rulebook).
* The **official FAQ was recovered from the Wayback Machine**, and the one genuinely
  engine-blocking data conflict — the Fame track thresholds — was **verified against the
  official board artwork** (3/8/15/24/35/48/63/80/99; the community engine's values are wrong
  from level 4).
* A reference implementation exists to check legal-actions/state-modelling questions.
* Effort has an evidence-based sanity check, not a guess.
* The legal question is now explicit and optioned instead of assumed.

## Sources

See `08-sources.md`. Key claims: WizKids official rulebooks (P1–P5); Wikipedia
*Mage Knight Board Game*; GitHub `mage-knight-digital/MageKnight` (README + API metadata,
retrieved 2026-10-24); prior-art repos listed in `05-digital-precedents.md`.
