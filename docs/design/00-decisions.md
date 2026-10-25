# 00 · Decision Log (ADRs)

**Status:** living document · **Owner:** Lead · **Last updated:** 2026-10-24

Decisions that change the plan. Each ADR records the choice, the reasoning, and the
consequences so future work doesn't re-litigate them. Superseded ADRs stay in place.

---

## ADR-001 — Project purpose: personal, educational, hobby; not commercial

**Date:** 2026-10-24 · **Status:** accepted

**Context.** The feasibility study (`10`) identified IP as the only true blocker to public
release. The owner has chosen the lowest-risk, highest-freedom framing.

**Decision.** This is a **personal educational hobby project**. Goals, in order:
1. finish a playable v1 (First Conquest) and learn from it;
2. keep it free of legal exposure;
3. have a public, shareable artifact only if it can be done safely.

**Consequences.**
- No commercial model, storefront, marketing, or monetisation work. Budget is hobby-scale.
- The project is **not** "ship a product"; the roadmap's gates are about learning and
  finishability, not market success (`14` §6 adapted).
- Still keep clean-room discipline: hobby status reduces enforcement risk, it does not
  remove copyright/trademark exposure. No official art, logo, rulebook text or names in
  any build, even private demos.
- Success metric: a playable, rule-correct First Conquest that the owner is proud of.

---

## ADR-002 — IP strategy: clean-room re-theme (option D from `06`)

**Date:** 2026-10-24 · **Status:** accepted

**Context.** `06` set out four options: (A) personal prototype of Mage Knight, (B) free fan
release, (C) licensed product, (D) clean-room re-theme. With ADR-001, (C) is out. (A) is
legal for private use but cannot be shown publicly. (B) is fragile. (D) is the only option
that lets the work be shared freely.

**Decision.** Build a **clean-room re-theme**: same *mechanics* (not copyrightable), entirely
original **name, world, terminology, card text, art and visual identity**.

**Consequences.**
- New public name (codename "Miniknight" stays internal — `06` §7 shows it is not safe).
  Candidates and a naming screen: `15-retheme-bible.md` §3.
- Every visible string, card name, enemy name, site name and rule explanation must be
  authored fresh. No verbatim rulebook text, no official card names, no official art or
  frames. The re-theme bible is the source of truth for naming (`15`).
- **Content pack architecture is now core, not a hedge**: display strings, names and art
  references live in data, keyed by neutral internal IDs; no IP-bearing string in code,
  file names or UI components. (`12` D4 and `11` §8 already require this — it is now a
  hard requirement.)
- **Data provenance**: `game-data/` currently contains values cross-checked/derived from an
  unlicensed upstream project (clearly marked). This is acceptable scaffolding for a private
  hobby build, but **before any public build** the affected values must be re-derived from
  primary sources and the re-theme names applied. Track this as a release gate (`06` §9).
- Re-theme work is design, not engineering: `15-retheme-bible.md` is a first-class
  deliverable, and art (ADR-004) depends on it.

---

## ADR-003 — Targets: web first; desktop later — **accepted: web-native stack**

**Date:** 2026-10-24 · **Status:** **accepted (2026-10-24)** — see the decision at the end of this ADR and `17-platform-analysis.md`

**Context.** Owner wants: web first, and a possible later desktop build "converted to
Godot". That combination has a hidden trap: **it implies building the game twice** — once in
web technology, then again in Godot. For a solo hobby project, the second build is where
most projects die. Meanwhile `12-architecture.md` recommended a TypeScript/React/PixiJS web
stack for v1 on the assumption of web-only delivery.

**The real choice is one of three, not "web then port":**

| | **A. Godot 4 from day one** (GDScript) | **B. Web-native: TS + React + PixiJS** (+ Tauri if a desktop app is wanted) | **C. Web first, port to Godot later** |
|---|---|---|---|
| Codebases | **1** | **1** | **2** |
| Web delivery | Godot web export (WASM) | Native web app | Web app, then a second app |
| Desktop | Native export (Win/Mac/Linux) — a re-export | Tauri/Electron wrapper around the web build | Godot app |
| First-load size | ~20–40 MB (engine + assets) | ~1–5 MB | n/a |
| UI-heavy card/table work | Good, more fiddly (Control nodes, themes) | **Best** (DOM/CSS for dense text, tooltips, layout) | Wasteful |
| Animation/audio/input/save | Built in | Must compose libraries | Built in (second time) |
| Automated test story | GUT/headless GDScript — workable, weaker ecosystem | **Excellent** (Vitest, pure reducers, golden traces) | Two stories |
| Learning value | Game-dev skills | Web/game-UI skills | Both, twice |
| Finish risk | **Low-medium** | **Low** | **High — discouraged** |
| Effort to v1 | ≈ same order (9–14 ew; web export/polish adds a little) | ≈9–13 ew (`12` §12) | ≈1.6–2× (both builds) |

**Recommendation.**

1. **Do not choose C.** "Web first, then convert to Godot" is a two-project plan disguised
   as one. Treat it as a red flag, not a roadmap.
2. **If the Godot desktop build is a genuine goal** (you want the native app and want to
   learn Godot), then **choose A now**: Godot 4 with GDScript, web export as the v1 delivery,
   native export later. One codebase, both targets, no conversion. This is the option that
   most closely matches the owner's stated intent, and I recommend it **if** "desktop in
   Godot" is a real near-term goal rather than a someday-maybe.
3. **If the desktop app is only "play offline without a browser"**, skip Godot: **choose B**,
   ship the web build, wrap it in **Tauri** for desktop (a few MB, native window, no
   rewrite). This gives the best v1 quality for a UI/text-dense card game and the fastest
   iteration loop — which matters most for finishing a hobby project.
4. **If you are unsure**, default to **B** for v1, because v1 is web; revisit Godot only if
   you *actually* commit to building the desktop game as a separate project later (i.e.
   explicitly accept it's a second build).

**What changes if A (Godot) is chosen:**
- `12-architecture.md` needs a revision: pure-logic layer in GDScript with headless tests,
  JSON content loader that consumes `game-data/`, scene/UI structure, export presets, and a
  web-export constraints section (single-threaded export to keep static hosting simple, avoid
  SharedArrayBuffer/COOP-COEP requirements, asset compression and first-load budget).
- Deterministic engine still works: seeded RNG, pure state transitions, golden-trace files.
  Use `godot --headless` for CI-style logic tests.
- Effort changes only slightly (≈+0–2 ew for web export polish and a weaker test harness).
- `14-roadmap.md` T0 tasks change to "Godot project scaffold + headless test runner" but the
  milestone structure stays.
- `13-ai-opponents.md` is unaffected (no opponent AI either way).

**What changes if B (web-native) is chosen:** `12` stands, with the board layer changed from
"PixiJS-first" to "SVG/DOM-first with a renderer interface; PixiJS as the upgrade path". Add a
short Tauri packaging appendix when desktop is scheduled; declare Godot out of scope.

### Decision taken (2026-10-24): **B — web-native**

After proper analysis (`17-platform-analysis.md`), the owner's goals (web first, desktop
later, mobile optional) are best served by a single TypeScript/React web app with an SVG/DOM
board, packaged for desktop with **Tauri v2**. Weighted score: **4.90/5**, ahead of
TS+Pixi/Phaser (4.65), Defold (3.85) and Godot (3.75). Key evidence: Tauri uses the system
webview and advertises sub-600 KB minimal apps; Godot's own web-export guidance shows the
trade-offs (COOP/COEP headers for threaded builds, single-threaded path with historical audio
caveats, ~40 MB uncompressed / ~5 MB Brotli wasm before assets). Godot remains a good choice
if a native-engine build becomes a goal in itself; it is **out of scope for v1**.

**Consequences:** Vite + React + TypeScript monorepo (`12` §3 adjusted); Tauri added only at
the desktop-packaging milestone; mobile stays a PWA/Capacitor question for later; no engine
import pipeline for AI-generated art.

---

## ADR-004 — Scope: "First Conquest" (T1) is v1

**Date:** 2026-10-24 · **Status:** accepted

**Decision.** v1 = T1 First Conquest exactly as specified in `11-mvp-scope.md`: solo, 3
rounds (Day/Night/Day), fixed 4-tile map, one city level 4, ~40 card definitions, 1–2
heroes, 20–30 minutes, tutorial, save/undo. T2 "Classic" is explicitly a later milestone.

**Consequences.**
- Content growth is frozen until v1 ships (`11` §3 "content rule"). New cards are a v1.1
  decision, not an in-flight one.
- All estimates in `12`/`14` are read at the T1 line, not the T2 line.

---

## ADR-005 — Art: commission early, placeholders must never block *(partly superseded by ADR-006)*

**Date:** 2026-10-24 · **Status:** accepted

**Decision.** Budget for an illustrator early; start with a small paid **pilot batch** to
lock style, then commission the First Conquest set in one or two batches. If cost/time
overruns, **placeholders are the fallback and never a blocker**: the build must be fully
playable with programmatic/gray-box art.

**Consequences.**
- Art brief with style guide, specs, asset manifest, placeholder rules and contract terms:
  `16-art-brief.md`.
- Engineering must not depend on final art: one art slot per asset, named by neutral ID,
  with a placeholder renderer; swapping finals is a data-only change.
- Budget cap is the owner's call. The brief proposes tiers and a "start with a pilot"
  default so no single commitment is large.

---

## ADR-006 — Art generation: 100% AI-generated (supersedes ADR-005's commissioning plan)

**Date:** 2026-10-24 · **Status:** accepted

**Decision.** All art is generated with AI image tools instead of commissioning an illustrator.
Budget for art becomes tool subscription/compute only. Placeholder-first still applies: the
build is fully playable with programmatic placeholders and art drops in by `art_ref`.

**Tooling (owner, 2026-10-24).** No local models or GPU: images are generated externally in
**OpenAI image generation** (ChatGPT image tools / image API — note Codex itself is a coding
agent, not an image renderer) or **Grok Imagine**. The copy-paste sheet is
[`art/PROMPTS.md`](../../art/PROMPTS.md); both routes lack a true negative-prompt field, so the
avoid-list is inlined per slot. Hobby/private use only for now (ADR-001); re-verify tool terms
and model licences before any public use.

**Consequences.**
- Workflow, per-slot prompts, consistency method, post-processing and acceptance checks:
  [`18-ai-art-prompts.md`](./18-ai-art-prompts.md) and [`art/prompts.json`](../../art/prompts.json).
- `16-art-brief.md` remains the spec (style, sizes, palette, acceptance); its commissioning and
  budget sections become a fallback if AI quality proves insufficient for a given asset.
- Tool licences/terms must be checked per generator before any public release (some models are
  non-commercial; terms change). Mark AI use in the project notes.
- The logo/wordmark is **not** AI-generated: use typography/vector work instead.
- Legal rules from ADR-002 still apply: no Mage Knight references in prompts, no official art as
  image input, no living-artist style names.

---

## ADR-007 — Public naming: keep the codename internal until v1

**Date:** 2026-10-24 · **Status:** accepted

**Decision.** "Miniknight" (and "Emberwold") stay internal working names until v1 is playable.
No public name screening/domain/social reservation work now.

**Consequences.** No public strings, store pages or shared builds under a name; `15` §11's
screening checklist is a pre-public-release task, not a v1 task. Files/IDs use neutral names.

---

## Pending decisions

| # | Decision | Needed by | Default if no answer |
|---|---|---|---|
| P1 | ~~Stack: Godot vs web-native~~ | — | **Decided: web-native (ADR-003)** |
| P2 | ~~Art budget cap~~ | — | **Decided: AI-generated art (ADR-006)** |
| P3 | Public name (screen candidates in `15` §3) | before any public build | keep internal codename until v1 (ADR-007) |
| P4 | Whether the game will ever be shared publicly | before release | private/portfolio only until screened |
