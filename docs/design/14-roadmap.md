# 14 · Roadmap — from this research repo to a playable Miniknight

**Status:** v1 (Lead) · **Companions:** `10-feasibility-analysis.md`, `11-mvp-scope.md`,
`12-architecture.md`, `13-ai-opponents.md`

This roadmap sequences the work **after** the research phase. It is tiered so that every
tier ends in something playable — the single most important property for a project whose
main failure mode (see `10` §4.1) is getting deep without ever shipping.

## 0. Decisions and operating constraints

Fixed by the owner on 2026-10-24 (see `00-decisions.md`): personal/educational hobby project;
**clean-room re-theme** (original name, world, text, art); **web first** (desktop later —
stack choice pending ADR-003); **First Conquest = v1**; art commissioned early but
**placeholders never block**. These constrain the roadmap below; tier scope is unchanged.

## 0.1 Tiers at a glance

| Tier | Name | What ships | Content scope | Effort (1 dev + AI) | Gate to pass |
|---|---|---|---|---|---|
| **T0** | Spike | A throwaway-but-real vertical slice: 1 hero, 2 tiles, ~20 cards, 1 round, 1 assault, 1 site, no art, CLI or ugly UI | ~5% | **2 weeks** | G1: rules/UI seam works and is fun enough to continue |
| **T1** | **First Conquest = v1.0** | The shippable Miniknight: solo, 3 rounds, fixed 4-tile map, 1 city (level 4), ~40 card defs, 1–2 heroes, 20–30 min session, tutorial, save/undo | ~15% of MKUE | **≈9–13 ew** (~2.5–4 months calendar with AI, 1 dev) | G2/G3: external playtest, zero known rule deviations |
| **T2** | Classic | Solo Conquest shape as data: 6 rounds, 11 tiles, cities 5/8, ~90–110 card defs, 2–4 heroes, hotseat | ~35% | ≈+8–12 ew (total 25 ew; see `12` §12) | G4: veteran players accept fidelity; 45–75 min balance |
| **T3** | Fidelity & breadth | Remaining base content, co-op, expansions, scenario variants, optional bot, packaging (Tauri/Steam/mobile) | → 100% | open-ended | Market/legal decision (`06`) |

Effort numbers are estimates with explicit assumptions — see `10` §6 and `12` §12. Do not
plan against them without reading those assumptions.

## 1. Milestones

### M0 — Research done (this repo) ✅

**Deliverables:** `docs/research/01`–`08`, `docs/design/10`–`14`, `game-data/` seed,
tooling. **Exit:** the team can answer "what do we build, in what order, and why" without
re-reading the rulebook.

### M1 — Foundations (T0, week 1)

| # | Task | Owner | Output |
|---|---|---|---|
| 1 | Monorepo scaffold (`pnpm` + packages: engine, content, client, tools), strict TS, CI | eng | Building skeleton, `pnpm test` green |
| 2 | Authoritative state types + reducer skeleton + seeded RNG + hash | eng | `reduce(state, action) → {state, events}` |
| 3 | Content compiler from `game-data/` → typed bundle + validation | eng | Content load fails on bad data |
| 4 | Golden-trace runner + `play-cli` random-legal bot | eng | 1,000-turn invariant/fuzz run green |
| 5 | Spike content: 1 hero starting deck (~20 cards), 2 tiles, 1 site, 3 enemies | content | `game-data` spike subset marked `mvp: true` |

**Exit (G1):** headless game plays a full round; movement → reveal → assault → reward →
end turn; deterministic replay of the trace; one human can play it via CLI without a crash.

### M2 — Spike vertical slice (T0, week 2)

| # | Task | Output |
|---|---|---|
| 1 | Full 4-phase combat + damage assignment | Combat trace matches rulebook worked example |
| 2 | Minimal UI shell: hex map (Pixi), hand, action picker driven by legal actions | Human plays with mouse |
| 3 | Site interaction (one village or keep) + reward | Reward loop closes |
| 4 | Spike report: what was hard, revised estimate, go/no-go | `docs/design/spike-report.md` |

**Exit (G1):** a stranger can take 10 turns unaided and wants another turn. **If not: stop,
re-scope to T0.5 (smaller) or abandon — this is the cheapest place to quit.**

### M3 — Core solo loop (T1, weeks 3–7)

Round/day-night loop, turn phases, movement/explore, core sites (6 types), combat, wounds/
rest/heal, level-up + skills, dummy player, mana economy, scenario end + scoring, ~16 basic
+ ~12 advanced actions. Headless end-to-end game from a seed; ≥5 golden traces including a
city assault. *(Maps to `12` Phases 1–2, reduced content.)*

**Exit:** a complete winnable/losable game exists headless. No UI required.

### M4 — Playable client (T1, weeks 8–12)

Board/cards/HUD, offers, level-up UI, combat overlay with phase rail and previews, site
panels, save/load, undo, settings, basic tutorial for the first three rounds.

**Exit (G2):** browser game start→finish with placeholder art; Playwright covers a full
scenario; 60 fps on the baseline laptop.

### M5 — First Conquest ship candidate (T1, weeks 13–16)

Scenario tuning (3 rounds, city level 4, enemy seeding), 2nd hero, tutorial completion,
score/debrief screen, accessibility pass, audio hooks, bug-fix tail. External playtest (5
board-game players) and iterate.

**Exit (G3):** ≥3/5 playtesters say "again"; median session 20–30 min; golden suite green;
no P0/P1 bugs. **This is the first publicly showable build.**

### M6 — Classic preset (T2, weeks 17–24)

Expand data to ~90–110 card defs, 2–4 heroes, 11-tile Solo Conquest, cities 5/8, full
progression + achievements scoring, hotseat co-op, replay scrubber. Reuses T1 engine/UI.

**Exit (G4):** veterans accept fidelity; 45–75 min balance; save-compat across versions.

### M7 — Fidelity & breadth (T3, ongoing)

Dungeons/tombs/ruins, remaining cards/units, expansions, scenario variants, co-op rules,
optional heuristic bot (`13`), packaging (Tauri/Steam/mobile), localisation, analytics if
allowed by the release path.

## 2. Calendar scenarios

Assumes the work starts with a clean run after M0, and that AI assistance stays at the
current level (it compresses implementation, not playtesting or art).

| Staffing | T0 | T1 (First Conquest) | T2 (Classic) | Notes |
|---|---|---|---|---|
| **1 dev + AI (recommended start)** | 2 wk | 10–16 wk calendar | +10–14 wk | Highest variance; protect against burnout with milestone demos |
| 1 dev, no AI | 3–4 wk | 7–10 months | +6–9 months | Not recommended; prior art shows the trap |
| 2 devs + designer/artist (part-time) | 2 wk | 8–11 wk calendar | +8–10 wk | Engine/client split from `12` §12.3 |
| 3 devs | 2 wk | 6–8 wk | +6–8 wk | Only worth it if art/production is staffed too |

## 3. Tracks running in parallel

| Track | When | Deliverable | Owner |
|---|---|---|---|
| **Legal/name decision** | before M5 (T1 public build) | Chosen release path + public name + asset-rights checklist (`06`) | Lead/owner |
| **Re-theme** | M0–M1 (before first public string) | Apply `15-retheme-bible.md`: names/terminology/content-pack strings; remove forbidden terms; screen public name | Lead/designer |
| **Art** | pilot after M3; production art from M5 | Slot-based deliverables per `16-art-brief.md` + `art/manifest.json`; placeholders never block | Artist/designer |
| **Audio** | M5+ | 3–5 ambient loops, ~30 SFX, UI sounds | Contract composer |
| **Playtest cohort** | from M4 | 5–8 board-game players, weekly build, structured feedback | Lead |
| **Community/legal scanning** | continuous | Watch upstream project, WizKids announcements, fan expectations | Lead |
| **AI/bot (optional)** | after M3 | Heuristic bot + arena (`13`) | eng (third person) |

## 4. Cost sketch (non-engineering)

Rough budget ranges, to be refined only when the release path is chosen (`06`/`07`):

| Item | Range | Notes |
|---|---|---|
| Art (MVP, ~60–80 assets) | $2k–$8k commissioned; $0 if placeholder/CC0 | Style consistency is the risk, not volume |
| Art (Classic, ~150–250 assets) | $8k–$25k | Card frames + hero/enemy portraits dominate |
| Audio | $300–$2k | Royalty-free acceptable for v1 |
| Fonts | $0 (SIL OFL) | Do not ship commercial fonts unlicensed |
| Playtest incentives | $0–$500 | Friends/community |
| Legal review | $500–$3k one-off | Name/trademark screen + release-path advice |

## 5. First two weeks — concrete task list

1. Scaffold repo (packages, strict TS, CI, lint, test, format) and commit.
2. Implement `GameState`, `Action`, `Event`, `reduce`, seeded RNG + state hash.
3. Content compiler for `game-data/` with schema validation and a `mvp` filter.
4. Golden-trace harness + a trivial scripted trace.
5. Encode the spike content subset: 1 hero deck (16 basic actions), 2 tiles, 3 enemies, 1 site.
6. Implement movement + terrain + tile reveal + end-turn.
7. Implement 4-phase combat + damage assignment for 3 enemies.
8. Minimal Pixi board + DOM hand + legal-action menus.
9. Write `docs/design/spike-report.md` (what was easy/hard, revised T1 estimate, decision).
10. **Decide go/no-go** with the user.

## 6. Kill criteria (pre-committed)

Stop or re-scope if any of these happen:

* **G1 fails** — after the spike, a stranger cannot play 10 turns without confusion and
  the engine needs a rewrite to support the real rules. (Re-scope to a smaller, non-MK game
  or stop.)
* **Content velocity is < 3 card definitions/day sustained** after tooling is mature — the
  long tail will not close; cut the card pool again (T0.5) or stop.
* **Rule deviations cannot be closed** — external players find repeatable rules bugs in the
  golden suite's blind spots at a rate that doesn't converge. Freeze features, fix engine.
* **Legal path is blocked** — if the project's goal requires public distribution and no
  viable path exists (`06`), pivot to original IP rather than shipping at risk.

## 7. Definition of "done" for the research phase

The research phase ends when:

- [ ] Rules are specified well enough to implement without further reading (`02`–`04`)
- [ ] Content data + schema + validator exist for the MVP subset (`game-data/`)
- [ ] Architecture and AI strategy are decided (`12`, `13`)
- [ ] Scope is explicit and subtractive (`11`)
- [ ] Legal/asset risks are documented with options (`06`, `07`)
- [ ] A plan with gates and kill criteria exists (this file)

After that, the next commit should be code, not more research.

## Sources

- `10-feasibility-analysis.md` §6 (effort model), `11-mvp-scope.md` (content manifest),
  `12-architecture.md` §12 (bottom-up phase estimates), `13-ai-opponents.md` (AI scope).
