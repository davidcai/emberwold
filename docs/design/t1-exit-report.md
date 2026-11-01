# T1 First Conquest — exit report (engineering)

**Status:** v1.0 (2026-10-31) · **Owner:** Lead · **Companions:**
[`11-mvp-scope.md`](./11-mvp-scope.md), [`14-roadmap.md`](./14-roadmap.md),
[`spike-report.md`](./spike-report.md), [`00-decisions.md`](./00-decisions.md)

This report is the T1 counterpart to the T0 spike report: what shipped, the evidence that it
works, what is still deliberately reduced, and whether the T1 exit gates are met. It does not
replace the honest owner-facing gates (fun pass, external playtest, legal review); those are
listed in §8.

## 1. Verdict

- **Roadmap M3 (core solo loop, headless) — exit met.** A complete seeded First Conquest game
  runs end-to-end headless: setup, tactics, round/day-night clock, map reveal, movement,
  sites, offers, combat, wounds/heal/rest, leveling/skills, units, city assault, victory and
  round-limit defeat, scoring. Seven determinism-checked golden traces cover the loop,
  including a full winning game (`050-victory.json`).
- **Roadmap M4 (playable client) — engineering exit met.** The T1-e UI increment landed the
  round/day-night/tactic/site/offer/skill/unit surfaces, game-over debrief and tutorial
  prompts; Playwright replays the whole 78-action winning scenario through the real UI and
  asserts the debrief. The only open M4 exit item is the 60 fps measurement on the baseline
  laptop; the app ships ~95 KB gzipped. §7 records the checks.
- **11 §9 (v1.0 definition of done) — partially met.** The game loop, scoring, save/undo and
  golden-trace requirements are met; content breadth (2nd hero, 4 artifacts, the rest of the
  MVP Advanced Actions/Spells), tutorial validation, measured performance and the legal
  review remain M5/v1.0 work. This is expected: §9 defines the *ship candidate*, not the T1
  engineering exit.
- **No P0 bug known at exit; all known deviations and simplifications are listed in §6.**
  Fun/playtest claims are owner actions and are not made here.

## 2. What landed (commit trail on `main`)

| Commit | Increment |
|---|---|
| `f49c7f1` | T1-a2 real round clock: tactics selection, simplified solo dummy (16 cards, 3 flips/turn, announces End of Round), round-prep pipeline (day/night flip, Source reroll, deck+discard+hand shuffle including Wounds, hand-limit draw, dummy refill, tactic pool refresh), deck-empty announcement. |
| `2134de2` | T1-b1 sites and offers: Advanced Action and Spell definitions, AA/spell offers with decks and top-up, monastery AA purchase (6 Influence), mage tower spell purchase (7 Influence + matching mana), magical glade Wound discard, crystal-mine income, interaction reputation modifier, village/monastery healing. |
| `14eb9d0` | T1-c leveling and skills: 10-level fame/stat table (armor, hand limit, command slots), level-up at end of turn, even-level skill token, level-up Advanced Action, skill activation with per-turn/per-round limits; content hash now digests the emitted bundle. |
| `3adc60a` | T1-b2 units: 6 MVP unit definitions, unit offer/deck refresh, recruiting (entered inhabited site, Influence, free command slot), activation with mapped abilities and mana costs, round-start readying. |
| `0ec033a` | End-of-turn draw to the modified hand limit (02 §15.1) and `discardCard`; the missing draw deadlocked the 3-round game once the hand filled with unplayable cards. |
| `8a7ee5c` | Site visibility fix (`map.sites` seeded only for revealed tiles and added on reveal), `expectedResult` golden-trace assertions, `050-victory.json` winning line. |
| `61a83e1` | CI fuzz raised to 10,000 actions per push. |
| (2nd-hero increment) | Second hero selectable: two heroes compiled with per-hero decks/crystals/skill decks, `GameConfig.heroId`, client hero selector, hero e2e test. |
| (unit-wounds increment) | Unit damage assignment (armor absorption, Poison/Paralyze/Assassination), unit healing at sites, wounded units cannot activate; schemaVersion 2. |
| `deb2f84` | Terrain-cost skill modifiers: `TerrainCostModifier` in the content contract, turn-scoped movement modifiers (Flight makes terrain cost 0/1), compiler collects nested modifier ops; bundle digest unchanged. |
| (T1-e UI commit) | Full First Conquest client: status/tactics/choice/combat/hand/turn/site/retinue panels, state-driven board, game-over debrief, tutorial turns 1–3, legend + event log; `e2e/victory.spec.ts` replays `050-victory.json` through the UI. |

T1-a1/T1-d (round/combat rules increment, client autosave/continue + undo) shipped earlier as
PR #2 (`606975c`).

## 3. Evidence (reproducible)

Run from the repo root:

```bash
pnpm verify              # typecheck + lint + 78 tests + dependency boundaries + 7 golden traces
pnpm test:e2e            # Playwright: save/continue, undo, site-heal replay, victory replay
pnpm fuzz --turns=10000 --seed=1   # 127 games, 0 invariant/termination failures (also in CI)
pnpm content:check       # generated bundle is current
pnpm build               # client production build (≈95 KB gzipped initial load)
pnpm exec tsx tools/golden-traces/src/verify.ts   # explicit trace report
```

At the time of writing: **81 tests**, contentHash
`15c81fb0202e97c7c6b403d5f4e39f8fb909e0be3335ef38d37bf723db5d0bdd`, data validator
`checks: 9662 errors: 0 warnings: 0`, CI fuzz 10,000 actions green.

Golden traces (`tools/golden-traces/`, recorded against the contentHash above; `traces:check`
replays every action and compares state hashes *and* the expected outcome/score where present):

| Trace | Actions | What it proves |
|---|---|---|
| `000-smoke.json` | 103 | Random-legal loop reaches the round-limit defeat without soft-locking. |
| `010-move-reveal.json` | 5 | Day terrain movement, explore, tile reveal, enemy spawn. |
| `015-rest.json` | 3 | Standard rest, dummy flip, end-of-turn draw. |
| `020-combat.json` | 19 | Combat phases, damage assignment, Wound gain, choice resolution, reward fame. |
| `030-site-heal.json` | 30 | Village entry, Influence generation/spending, healing. |
| `040-one-round.json` | 31 | A complete scripted turn/round boundary with all events. |
| `050-victory.json` | 78 | Full game: seed 1, round 3, fame 7, score 17, city conquered (victory). |

## 4. Content coverage vs `11` §3

| Category | v1.0 target | Shipped in T1 bundle | Status |
|---|---|---|---|
| Heroes | 1 at M1, 2 at v1.0 | 2 selectable heroes (`hero:goldyx`, `hero:arythea`) with their own decks, crystals and skill decks | done (child-playstyle differentiation is tuning work) |
| Basic Actions | 1 full 16-instance deck per hero | 16 basic definitions across the two heroes (12 goldyx + 4 arythea-only, 16-instance decks) | done for both heroes |
| Skills | ≈6 reachable per hero | 20 definitions (10 per hero), 10 in the hero's skill deck, fixed order | activation done; choice/shuffle deferred |
| Advanced Actions | 12 | 5 (only those whose full effect tree is implemented) | remainder = T1 debt |
| Spells | 6 | 2 | remainder = T1 debt |
| Artifacts | 4 | 0 | T1 debt (`gain_fame` / endless-mana ops) |
| Units | 6 | 6 | done, basic abilities only |
| Enemies | 10 regular + 2 city | 12 (10 regular pools + 2 garrison) | done |
| Sites | 6 types (+city) | 6 types + city + portal (8 records) | keep/portal interactions reduced |
| Map tiles | 4 fixed | 4 (start + 2 countryside + city), rotation supported | authored wedge, no random placement |
| Scenarios | 1 + Classic preset | 1 (First Conquest, 3 rounds Day/Night/Day, city level 4) | Classic preset deferred |
| Tactics | 12 | 12 | definitions only, effects deferred |
| Levels | 10 | 10 (official fame thresholds, stat bands) | done |
| Keywords/abilities | ~20 | implemented subset used by the 12 enemies + units (fortify, poison, etc. as data) | unchanged from spike scope |

The bundle contains 21 card definitions (12 basic + Wound + 5 Advanced Actions + 2 spells),
12 enemies, 8 sites, 6 units, 20 skills, 10 levels, 12 tactics and 4 tiles.

## 5. Rules coverage highlights

- **Round/turn:** SETUP → round prepare → tactics (lowest fame first; solo human always first
  then dummy random) → hero turn → end-of-turn pipeline (play area cleanup, end-of-turn draw)
  → dummy turn/flips → End of Round → next round; deck-empty announcement; round-limit defeat.
- **Map:** 4 authored tiles with 60° rotation, day/night terrain costs, explored-tile
  restriction, site seeding only on revealed hexes, one combat per space per turn.
- **Mana/economy:** Source roll with day/night special-die depletion (gold unusable at night,
  black by day), crystals, mana tokens, Influence, reputation modifier, tile-reveal cost 2.
- **Combat:** block/attack/damage phases, armored/fortified enemies, wounds, choice resolution,
  unit abilities, unit damage assignment (armor absorption; Poison/Paralyze/Assassination) and
  unit healing, city garrison assault.
- **Progression:** fame/levels, armor + hand limit + command slots from the level table,
  skills, level-up Advanced Action, Advanced Action/Spell purchases, healing, rest.
- **Scenario:** city conquest grants `fame + 10`, victory/debrief result object; round-limit
  defeat scores fame; all end states are terminal (no soft-lock path found by 10k-action fuzz).
- **Client:** every legal action is exposed through a grouped panel (the grouping is total:
  anything without a dedicated panel falls back to a generic list), the board is rendered from
  engine state, autosave/continue + undo are kept, and the game-over debrief shows
  outcome/score/fame/round/city/reason. A full winning trace is replayed in Playwright.

## 6. Deviations, waivers and T1 debt

Restored from the T0 deviation list (spike report §6):

1. Wounds: round-end recycling of hand/discard/deck (including Wounds) is back; healing and
   rest interact with it.
2. Dummy player and tactics exist (simplified, see below); rounds are no longer Day-only.
3. Map rules: 4 authored tiles, rotation and adjacency are simulated; explore is a separate
   2-Move action. Random tile placement/corner matching is still not implemented (authored
   layout only).
4. The 16-instance starting deck and the emitted content bundle remain as built.

Remaining known waivers/simplifications (explicit T1 debt, tracked for the exit and M5):

- **Combat fidelity waiver (M2-1):** no official worked-example replay; arithmetic is
  unit-tested against rulebook numbers (unchanged from the spike, documented).
- **Tactic effects deferred:** 12 tactic records are data placeholders; only selection/order
  is implemented (no tactic effect has been invented).
- **Dummy is count-only:** 16 cards, 3 flips per dummy turn, End-of-Round announcement; it has
  no crystals, Advanced Action absorption, blocking figure or combat yet.
- **Skills:** level-up grants the next skill in fixed data order (no choose-from-two/shuffle);
  only skills whose effect ops are implemented are activatable. Terrain-cost modifiers
  (Flight) are now applied for the turn; other modifier payloads/rule overrides remain
  no-ops except `extra_source_die`.
- **Units:** wounds/damage assignment and site healing are implemented; unit resistance,
  unit-targeting heal effects from skills/abilities and unit banners are not (abilities are the
  mapped subset only).
- **Sites:** keep/portal interactions, city purchase options, and fame→reputation events
  (assault −1 / orc defeat +1) are deferred; healing and the six MVP site benefits are in.
- **Content breadth:** 4 artifacts, 7 of 12 MVP Advanced Actions, 4 of 6 MVP spells and the
  Classic preset are not in the bundle yet (artifacts additionally need an authored acquisition
  path that does not invent rules).
- **Scoring:** base fame + city bonus (10) is implemented; the tuned row/goal table in
  `game-data/scenarios.json` is still marked todo.
- **Hidden-information save:** solo has no hidden information in the client surface; the save
  stores the full state (and is validated by contentHash), so deck order is preserved.

## 7. Exit checks

**M3 (headless complete game): met.**
- Complete winnable/losable seeded game: yes (`050-victory.json` = win; `000-smoke.json` =
  round-limit defeat).
- ≥5 golden traces including a city assault: 7 traces including a city-conquering full game.
- Tests/fuzz: 77 tests, dependency boundaries, CI fuzz 10,000 actions.

**M4 (playable client): engineering met.** Start→finish browser game with placeholder art,
save/continue + undo, the full T1 surface, game-over debrief, and Playwright covering both a
scripted trace replay and the complete winning scenario (`e2e/victory.spec.ts`, 78 actions,
debrief assertions, no console errors). Production build: 315.37 kB JS (93.43 kB gzip) + 7.59
kB CSS (2.08 kB gzip) ≈ 95 kB gzipped initial load, under the 5 MB budget. The 60 fps target
still needs a manual measurement on the 2019-laptop baseline; the renderer is SVG/DOM with a
4-tile board.

**11 §9 (v1.0 definition of done) at a glance:**

| DoD item | Status |
|---|---|
| Both scenarios playable end-to-end, 2nd hero selectable | First Conquest + 2 heroes yes; Classic preset deferred to M5 |
| Every manifest item implemented/tested/marked implemented | no — content breadth debt (§4) |
| ≥1 full game per scenario replayed deterministically | yes for First Conquest (`050-victory`) |
| Save/resume + undo verified | yes (client + e2e; full-state save) |
| No P0/P1 bugs; no rule deviations in tests | no P0 known; deviations documented in §6 |
| Tutorial playthrough by ≥3 unfamiliar people | owner action, not done |
| Build < 5 MB gzipped; 60 fps on baseline laptop | build measured at ~95 KB gzipped (pass); 60 fps not measured yet |
| Legal review of names/art/text complete | not done (owner/legal gate) |

## 8. Remaining work and owner actions

Owner-only (cannot be done by the agent):

1. **G1.5 fun pass:** 10-turn human session, two fixed questions (T0 acceptance; still open).
2. **T0 deviation sign-off** and the T1 exit sign-off.
3. **G2/G3 external playtest** (5–8 board-game players; ≥3/5 "again", 20–30 min median).
4. Legal review of shipped names/art/text before any public build; branding stays gated
   (ADR-007/008).

Engineering follow-ups (allowed after T1 / as capacity allows):

- 60 fps measurement on the baseline laptop; optional UI polish/accessibility pass.
- T1 exit bookkeeping: record the exit decision (ADR) and update `11` DoD status as items close.
- T1-d2 content debt: artifacts (acquisition path), remaining Advanced Actions/Spells,
  keep/portal/city interactions, reputation events, dummy fidelity, tactic effects.
- Scenario tuning pass (win rate ~50%, score weights) once the fun pass gives feedback.

## 9. Reproduce the evidence

```bash
pnpm install
pnpm verify
pnpm test:e2e
pnpm fuzz --turns=10000 --seed=1
.venv/bin/python tools/validate_data.py   # local; CI uses python3 with stdlib only
git log --oneline -8
```

## Sources

- [`11-mvp-scope.md`](./11-mvp-scope.md) §3–§4, §9 (targets, scenario shape, DoD).
- [`14-roadmap.md`](./14-roadmap.md) M3–M5 (gates).
- [`spike-report.md`](./spike-report.md) §6 (deviations that T1 was required to restore).
- [`00-decisions.md`](./00-decisions.md) ADR-002 (clean-room), ADR-004 (scope), ADR-009/T0/T1.
