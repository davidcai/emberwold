# 17 · Platform / Framework Analysis — what to build Emberwold on

**Status:** v1 · **Owner:** Lead · **Date:** 2026-10-24 · **Supersedes:** the premature
"Godot" assumption in ADR-003; this document is the basis for the accepted stack.

> **Bottom line: build it as a web-native TypeScript app (React + SVG/DOM board, no game
> engine), and get the desktop build by wrapping the same app with Tauri.** Mobile, if it ever
> happens, comes from the same codebase via PWA/Capacitor. Godot/Defold/Unity are not
> recommended for this game; they trade away the web-first goal and the text-heavy UI that
> this game is mostly made of.

---

## 1. Requirements (from the owner's decisions)

| # | Requirement | Source / weight |
|---|---|---|
| R1 | **Web first** — playable in a desktop browser, cheap to host, fast to iterate | ADR-003 · highest |
| R2 | **Desktop later** — Windows/macOS/Linux build without rewriting the game | ADR-003 · high |
| R3 | Mobile optional, not a must | owner, 2026-10-24 · low |
| R4 | **Dense text UI** — cards, tooltips, offers, combat log, rules compendium, tutorial | game design (`11`) · high |
| R5 | **Deterministic rules engine** with heavy automated tests (golden traces) | `12` · high |
| R6 | Data-driven content from `game-data/` (JSON) + AI-generated art assets | ADR-002/005/006 · high |
| R7 | Solo hobbyist, AI-assisted development, limited time; must be finishable | ADR-001 · high |
| R8 | Free/open tooling, no royalties, no subscription dependency | hobby budget · medium |
| R9 | Turn-based 2D hex map, ~4 tiles in v1, ~10–40 tokens on screen; no physics/3D | `11` · medium |

## 2. Evaluation criteria and weights

| Criterion | Why it matters here | Weight |
|---|---|---:|
| Web-first fit (load size, browser support, hosting/distribution) | R1 — the product is a web game | 25% |
| Desktop path with no rewrite | R2 — Tauri-class packaging counts | 20% |
| Text/UI-heavy fit | R4 — most of the game is text and panels | 20% |
| Solo-dev velocity + AI-assisted ecosystem | R7 — finishability beats theoretical elegance | 15% |
| Deterministic engine testability | R5 — rule correctness is the product | 10% |
| Mobile-readiness (optional) | R3 | 5% |
| Cost/licensing/simplicity | R8 | 5% |

## 3. Shortlist and scoring

Scores 1–5 (5 best), weighted. "Build twice" is scored against R2.

| Candidate | Web 25% | Desktop 20% | UI 20% | Velocity 15% | Test 10% | Mobile 5% | Cost 5% | **Weighted** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **A. TS + React + SVG/DOM board** (+ Tauri desktop) | 5 | 5 | 5 | 5 | 5 | 4 | 5 | **4.90** |
| **B. TS + React + PixiJS/Phaser board** (+ Tauri) | 5 | 5 | 4 | 4 | 5 | 4 | 5 | **4.65** |
| C. Godot 4 (web export + native) | 3 | 5 | 3 | 4 | 3 | 5 | 5 | **3.75** |
| D. Defold (HTML5 + native) | 4 | 5 | 3 | 3 | 3 | 5 | 5 | **3.85** |
| E. Unity (WebGL + native) | 1 | 5 | 3 | 3 | 3 | 4 | 2 | **2.90** |
| F. Construct 3 / GDevelop (no/low-code, web-first) | 4 | 3 | 3 | 2 | 1 | 4 | 3 | **2.95** |

Excluded without scoring: **GameMaker** (HTML5 export exists but web quality/pricing and
text-heavy UI are poor fits), **Cocos Creator** (web/mobile focus, desktop weak, docs less
friendly for a hobbyist), **RPG Maker** (wrong genre/system), **custom Rust/WASM** (months of
renderer/UI work before the first card is playable), **"web now, port to Godot later"**
(scores as two builds; see §6).

## 4. Candidate deep dives

### A. Web-native: TypeScript + React + SVG/DOM board — **recommended**

**What it is.** A single-page web app: the rules engine is pure TypeScript; React renders the
UI (hand, offers, combat, panels); the hex map is an SVG scene (one `<polygon>` per hex, one
`<g>` per token) with CSS transitions; state lives in a small store; content comes from JSON.

**Why it wins here.**
- **Text/UI is the game.** Card text, tooltips, level-up, offers and a rules compendium are
  DOM/CSS problems that the browser solves natively (text wrapping, zoom, accessibility,
  i18n). In an engine you rebuild half of that with Control nodes.
- **Web-first is trivial.** No WASM/engine payload: initial JS+CSS can be a few hundred KB
  gzipped plus art on demand. Static hosting (GitHub Pages/Netlify) or itch.io HTML5 zip.
- **Desktop later is packaging, not porting.** Wrap the same build with **Tauri v2**
  (system webview; the Tauri team advertises minimal apps under ~600 KB, with the game's
  assets being the real size). If Rust tooling is a hassle, Electron is the heavier fallback.
- **Deterministic engine is easy to test.** Pure reducer + Vitest; golden traces; no engine
  runtime needed in CI. This is the single most important quality lever for a rules game.
- **AI art fits naturally**: PNG/WebP/AVIF assets loaded at runtime, no import pipeline.
- **Iteration speed** (hot reload, devtools) is the difference between finishing and not.

**The real risk.** SVG/DOM is not a game renderer: hundreds of animated nodes, particles, or
shader-like effects would eventually hurt. For v1's scale (~50 hexes, ~40 cards, a dozen
tokens, CSS transitions) it is comfortably fast. Mitigation: keep board rendering behind a
`BoardRenderer` interface; if profiling shows a problem, drop in PixiJS/Phaser for the board
canvas while keeping React for UI — that's candidate B, an afternoon-scale swap, not a
rewrite.

**What you learn:** TypeScript, React, state design, deterministic simulation, testing, web
deployment — excellent educational value.

### B. Web-native with a canvas engine: React + PixiJS (or Phaser 4)

**What it is.** Same as A, but the board is drawn on a canvas by PixiJS (low-level rendering)
or Phaser (full 2D game framework; v4 shipped in 2026, active development).

**When it's right.** If you want juice — lots of particles, camera zooms, shader effects,
smooth 60fps animations of dozens of sprites — or if you later want to reuse board code in a
more "game-like" direction. Phaser adds scenes/input/audio/tilemaps; Pixi is just rendering.

**Why it's second.** For a card-board game the UI is the hard part, and you'd still build it
in React. The canvas layer adds API surface and an asset/animation pipeline before the first
playable turn exists. Start with A; the renderer interface keeps B available.

### C. Godot 4 (what I wrongly assumed earlier)

**What it is.** A free open-source game engine; one project exports HTML5/WASM, Windows,
macOS, Linux (and mobile/consoles).

**Honest pros.** Real desktop builds from day one; excellent 2D tools; built-in
animation/audio/input/save; one codebase for all targets; fun to learn if game-dev is part of
the goal.

**Why not here (for *this* project).**
- **Web export is the compromised target.** Godot's own documentation/blog is candid: threaded
  web builds need cross-origin isolation (COOP/COEP headers) — awkward on static hosts and
  itch.io; single-threaded builds (available since 4.3) avoid that but historically had audio
  caveats and are the less-travelled path. The engine payload is large: the Godot 4.3 blog
  cites a ~40 MB uncompressed `.wasm`, ~5 MB Brotli-compressed, *before* your assets. Acceptable
  on desktop browsers, but it is a real first-load cost that a web-native build does not pay.
- **Text-heavy UI is slower to build** than HTML/CSS and harder to make accessible.
- **Testing a deterministic rules engine** is workable (headless mode, GUT) but weaker than
  Vitest/Playwright and less familiar to AI-assisted workflows.
- **The desktop requirement doesn't justify an engine.** R2 is "run it outside a browser",
  which Tauri solves without changing the stack.

**Choose Godot instead if:** a native engine build is itself a learning goal, you plan
console/mobile-native releases, or you expect heavy animation/particle work.

### D. Defold

**What it is.** Free, very small, production-proven 2D/3D engine (Lua) exporting HTML5, desktop,
mobile and consoles; its site advertises tiny loads (a showcased web game's initial download:
~3 MB) and one codebase across platforms.

**Verdict.** The strongest *game-engine* alternative if you want web+desktop+mobile from one
project with small builds. Weaker fit than A because UI/text tooling and the Lua ecosystem are
smaller, and it still adds an engine layer the game doesn't need. Runner-up if you later decide
you want a "real engine" workflow with tiny web builds.

### E. Unity (WebGL)

**Verdict.** No. WebGL builds are heavy and slow to first play, mobile web is fragile, editor
and licensing add complexity, and nothing in this turn-based 2D game needs Unity. Use only if
console distribution becomes a hard requirement.

### F. Construct 3 / GDevelop

**Verdict.** Great for small action games; the rules engine here (hundreds of interacting
effects, deterministic replay, data-driven cards) wants real code and tests. No.

## 5. Recommended stack (concrete)

| Layer | Choice | Notes |
|---|---|---|
| Language | **TypeScript** (strict) | one language for engine, UI, tools, content validation |
| Build | **Vite** | fast dev server, simple static output |
| UI | **React** (function components) + CSS Modules or vanilla-extract | text-heavy screens are the product |
| Board | **SVG** + CSS transforms/transitions | `BoardRenderer` interface for a later Pixi swap |
| UI state | Zustand (or plain context) | engine state stays the source of truth; UI state separate |
| Rules engine | pure TS package: `reduce(state, action) → {state, events}`, seeded RNG, state hash | Vitest unit + golden-trace tests; no DOM/engine deps |
| Content | JSON from `game-data/` validated with Zod at build time; neutral IDs + content pack strings | ADR-002; `tools/validate_data.py` stays the data gate |
| Animation | CSS transitions + Framer Motion (optional) | v1 needs card play, damage numbers, token movement |
| Audio | Howler.js or Web Audio (small) | 3 loops + ~30 SFX |
| Persistence | IndexedDB/localStorage behind a `Storage` interface | desktop uses Tauri filesystem plugin |
| Desktop | **Tauri v2** (Rust toolchain at build time only) | system webview; fallback Electron |
| Mobile (optional) | PWA first; Capacitor if app stores are ever wanted | no work needed in v1 |
| Testing | Vitest (engine/content), Playwright (UI flows), golden traces in CI | `12` §10 |
| Hosting | GitHub Pages / Netlify / itch.io HTML5 | static, no server |

**Package layout** (matches `12-architecture.md` §4.3, adjusted):

```
packages/
  engine/        # pure TS rules engine + content loader (no DOM)
  content/       # game-data -> typed content bundle (Zod)
  ui/            # React app: screens, cards, SVG board, HUD
  desktop/       # Tauri shell (added when desktop is scheduled)
  tools/         # CLI: golden traces, balance sims, art manifest checks
```

## 6. Why not "web now, convert to Godot later"

That plan is two builds. The web version would be a throwaway prototype or a rewrite donor;
for a hobby project with limited time, the second build is where motivation dies. The correct
framing is: **choose the delivery surface(s) you need, then pick the smallest stack that
covers them.** Web + later desktop = web-native + Tauri. Web + later desktop + future native
engine releases = Godot/Defold from day one. You told me the first; this document implements it.

If you later genuinely want a native engine project, treat that as a **new project** (or a
deliberate second edition), not a conversion of this one.

## 7. Escape hatches (pre-agreed, cheap to exercise)

| Trigger | Switch | Cost |
|---|---|---|
| SVG board drops below 50 fps on target hardware, or >300 animated nodes | Replace board layer with PixiJS/Phaser behind `BoardRenderer` | ~1–2 weeks |
| Tauri build friction (Rust toolchain, signing) | Electron packaging | ~2–3 days |
| Mobile app stores become a real goal | Add Capacitor to the same web build | ~1 week + store overhead |
| You decide a native engine build matters more than web | Start a deliberate Godot port as a second project | weeks–months; plan it as such |

## 8. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Scope creep in UI polish delays rules correctness | Medium | Ship the golden-trace engine + ugly UI first; art/UI pass after M2 |
| SVG/DOM performance | Low (v1 scale) | Renderer interface + profiling budget in `12`; Pixi fallback |
| Tauri/Rust toolchain friction at packaging time | Medium | Desktop is deferred; Electron fallback; nothing in app code depends on Tauri |
| Browser quirks (Safari text scaling, IndexedDB limits) | Medium | Test Chrome/Firefox/Safari in CI smoke runs; storage interface |
| AI art inconsistency/quality | Medium | `18-ai-art-prompts.md` workflow: style refs, seeds, iterative passes, acceptance checklist |
| Stack churn (React/Vite majors) | Low | Pin versions; small dependency surface; no game engine to migrate |

## 9. What this changes in the repo

- **ADR-003 is accepted** as "web-native (A) + Tauri for desktop; Godot out of scope".
- `12-architecture.md`: the stack table and §9 presentation split are updated from
  "PixiJS board" to "SVG/DOM board with a renderer interface; Pixi optional". Everything else
  (reducer, content pipeline, legal actions, testing) stands.
- `14-roadmap.md`: T0 task 1 becomes "Vite + React + TS monorepo scaffold"; Tauri is a
  post-v1 packaging task.
- Art: `16-art-brief.md` commissioning sections become a fallback; the AI workflow is
  `18-ai-art-prompts.md`.

## Sources

- Tauri v2 overview (desktop+mobile, system webview, small binaries, any frontend):
  <https://v2.tauri.app/start/> (retrieved 2026-10-24)
- Godot "Web Export in 4.3" (single-threaded exports, COOP/COEP requirements for threads,
  Apple/Safari issues, ~40 MB wasm uncompressed / ~5 MB Brotli):
  <https://godotengine.org/article/progress-report-web-export-in-4-3/> (May 2024; article warns
  contents may be outdated — verify current engine behaviour before relying on numbers)
- Godot web export docs: <https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html>
- Defold homepage (HTML5 + desktop + mobile + consoles, small engine footprint, free):
  <https://defold.com/> (retrieved 2026-10-24)
- Phaser v4 release-candidate news (web-first HTML5 framework; v4 shipped 2026):
  <https://phaser.io/news/2025/05/phaser-v4-release-candidate-4>
- Unity/WebGL, Construct/GDevelop and GameMaker judgements are based on general platform
  characteristics (build size/load, UI tooling, licensing) — ⚠️ not re-verified per-release for
  this document; they are not recommended regardless of version.
- Our own constraints and plans: `00-decisions.md`, `11-mvp-scope.md`, `12-architecture.md`,
  `16-art-brief.md`.
