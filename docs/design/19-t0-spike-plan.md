# 19 · T0 Spike Plan — two weeks to a playable round

**Status:** draft for owner approval (P5) · **Date:** 2026-10-31 · **Owner:** Lead
**Companions:** [`10-feasibility-analysis.md`](./10-feasibility-analysis.md) §6/§9 (G1),
[`11-mvp-scope.md`](./11-mvp-scope.md) §2–§5/§10 (scope/content),
[`12-architecture.md`](./12-architecture.md) §3.3/§5/§6/§10/§12.4/§12.6 (engine, pipeline,
tests, T0 slice), [`14-roadmap.md`](./14-roadmap.md) §0.1/§1/§5/§6 (tiers, M1–M2),
[`17-platform-analysis.md`](./17-platform-analysis.md) §5 (stack), and the ADRs in
[`00-decisions.md`](./00-decisions.md).

> **Execution gate.** No app scaffold or game code may start until the owner lifts the
> pre-implementation hold ([`AGENTS.md`](../../AGENTS.md) §2; pending decision **P5** in
> [`00-decisions.md`](./00-decisions.md)). This document is the plan only — **no step below
> has been executed**. Approving the plan approves the scope and simplifications in §2 and
> §10, not just the file.

## 1. Goal

Build the **T0 vertical slice** — one hero, two tiles, one Day round, one assault, one site —
headless first and then with a minimal browser UI, so that **G1** can be judged on evidence:
movement → reveal → assault → reward → end turn works, the run replays deterministically from a
trace, a human plays it without a crash, and the spike report records what was learned.

Acceptance ([`10`](./10-feasibility-analysis.md) §9 G1; "T0 done" in
[`12`](./12-architecture.md) §12.6):

| # | Check | Evidence |
|---|---|---|
| G1.1 | One round playable start-to-finish on 2 tiles with a 16-card deck | recorded trace + CLI transcript |
| G1.2 | Movement, tile reveal, assault (4-phase combat), site interaction all resolve | one trace each + unit tests |
| G1.3 | Deterministic replay: same seed + action log → same state hashes | `trace:verify` exit 0, all hashes match |
| G1.4 | No crashes; no illegal action offered by the UI | 1,000-turn random-legal fuzz run, invariant failures 0; Playwright + human checklist |
| G1.5 | "Fun enough to continue" verdict | playtest notes (owner + one unfamiliar player) + spike-report recommendation |

## 2. Scope: what T0 is, and what it deliberately is not

T0 exists to test the **rules/UI seam and the pace of work**, not to ship a game
([`10`](./10-feasibility-analysis.md) §6; [`14`](./14-roadmap.md) §0.1). The cut lines below
are the plan's scope decision and need owner sign-off.

### 2.1 In scope

| Area | T0 slice |
|---|---|
| Hero | 1 hero (proposed: `hero:goldyx`, the fewest unique card defs of the MVP pair) |
| Deck | that hero's 16-card starting deck, **all 16 playable** (basic + powered + sideways) |
| Map | 2 tiles: `tile:starting_a` + `tile:countryside_1`, one authored placement, one explore reveal |
| Enemies | 3 definitions: `enemy:prowlers`, `enemy:diggers`, `enemy:wolf_riders` (plain, fortified, swift); 2 tokens spawned for the assault |
| Site | `site:village` — influence → healing purchase (3 influence per point, from site data) |
| Round | 1 Day round: setup (source dice) → player turns → end turn / round end |
| Engine | pure reducer, seeded RNG, event log, legal actions, state hash, invariants; mana payment for powered cards |
| Content | `game-data/` → typed bundle via a compiler; no hand-edited generated content |
| CLI | `play-cli` (interactive + random-legal bot), trace record/verify, fuzz harness |
| UI | minimal browser shell: SVG hex board, DOM hand, legal-action menus, combat overlay |
| Art | procedural placeholders only ([`ADR-005/006`](./00-decisions.md); placeholders never block) |

### 2.2 Out of scope (deferred to T1/M3+, not dropped)

* Tactics selection and the **dummy player** — T0 rounds are player-turns-only, marked as a
  simplification in the spike report ([`12`](./12-architecture.md) §8.1 puts the dummy in the
  T1 core loop).
* Skills, levels/level-up, Advanced Actions, Spells, Artifacts, Units, reputation effects,
  achievements, scoring, city, dungeon/tomb, night turns, save/undo (engine or UI), audio,
  animation.
* Rules-faithful full map: First Conquest's 4-tile authored layout is `layout_status: "todo"`
  in [`game-data/scenarios.json`](../../game-data/scenarios.json); T0 uses its own 2-tile
  spike placement (§6 S4).
* Multiplayer/hotseat, AI opponent, desktop packaging, public branding.

> SPIKE-SIMPLIFICATION LIST (owner approval requested): the bullets above are what T0
> knowingly does not implement. The spike report must restate them as the deviation list, and
> each must reappear in the T1 plan. Nothing here may be silently "kept simplified" after T0.

## 3. Settled constraints (do not re-litigate)

1. **Stack ([ADR-003](./00-decisions.md), [`17`](./17-platform-analysis.md) §5):** TypeScript
   strict, pnpm workspaces, Vite + React, **SVG/DOM board first** (PixiJS only behind a
   `BoardRenderer` interface if profiling demands it), Vitest, Playwright. No Godot/Unity, no
   Rust core.
2. **Clean room ([ADR-002](./00-decisions.md)):** neutral internal IDs, display names from
   content data, no Mage Knight names/terms/text in code, filenames, UI strings or fixtures.
   Publisher rulebook text is never committed; local `reference/` stays gitignored.
3. **Public repo:** no secrets, no third-party assets, generated content committed and
   reproducible (CI fails if regeneration leaves a diff).
4. **Game-data ownership:** engine/content work consumes `game-data/` read-only; data defects
   are reported, not silently fixed ([`12`](./12-architecture.md) §6.4,
   [`AGENTS.md`](../../AGENTS.md) §4).
5. **Art:** placeholders only in T0 ([ADR-005/006](./00-decisions.md)); the agent never
   generates images.

## 4. Baseline verified before planning (2026-10-31, HEAD `49eea2f`)

| Check | Command | Result |
|---|---|---|
| Repo state | `git status -sb` | `## main...origin/main`, clean |
| Data validator | `.venv/bin/python tools/validate_data.py` | `checks: 9662 errors: 0 warnings: 0` |
| No code yet | `git ls-files \| grep -E 'package.json\|pnpm-workspace\|tsconfig'` | no matches |
| Node / pnpm (harness) | bundled node/pnpm | node `24.21.0`, pnpm `11.28.5` |
| Node / pnpm (host PATH) | `node -v`, `pnpm --version` | node `24.22.1`, pnpm `12.15.0` |
| npm registry | `curl -sI https://registry.npmjs.org/pnpm` | HTTP 200; probe install of `typescript@5` succeeded (1.2 s) |
| GitHub auth | `gh auth status` | logged in, keyring, https |
| CI | `ls .github` | absent — workflow created in S1 |
| Validator deps | `grep '^import\|^from' tools/validate_data.py` | standard library only, so CI can run it with `actions/setup-python` |
| Rulebook fixtures | `reference/extracted/` | MKUE rulebook + walkthrough + master sheet present locally |
| RNG algorithm | independent Python and Node implementations | identical vectors (§Appendix A) |
| SHA-256 vectors | Python `hashlib` vs Node `crypto` | identical (§Appendix A) |

## 5. Environment notes that shape the commands

* The harness's bundled toolchain is `node 24.21.0` + `pnpm 11.28.5`; the host PATH has
  `node 24.22.1` + `pnpm 12.15.0`. Pin one pnpm in `package.json → packageManager`
  (**`pnpm@12.15.0`**, the host version); `engines.node` is `>=22`. CI installs the pinned
  pnpm, so the lockfile is always generated by the same version.
* [`12`](./12-architecture.md) §3.3 says "Node 22 LTS"; Node 24 is current here and satisfies
  `>=22`. Record the actual version in the spike report; do not downgrade.
* The repo root is the current working directory (`~/dev/emberwold`); all commands below run
  from there. In this harness `pnpm` resolves on PATH; the fallback is the bundled `pnpm.mjs`
  reported by the harness's dependency loader (Appendix C).
* `game-data` numbers are data, not code: terrain costs, site healing, enemy stats and rules
  constants load from the content bundle.

## 6. Plan steps

Ten steps, each one diff-sized and each with a check a command or a direct observation can
confirm. Estimates are dev-days for one engineer; total ≈ 9.5 plus a 0.5-day integration
buffer = the 2-week T0 box ([`14`](./14-roadmap.md) §0.1).

| # | Step | Est | Depends on | Acceptance check (short) |
|---|---|---:|---|---|
| S1 | Monorepo scaffold + CI | 0.5 | — | `pnpm verify` green; CI runs the same gate |
| S2 | `shared`: IDs, RNG, canonical hash | 0.75 | S1 | RNG/hash golden vectors pass; stream independence |
| S3 | `engine`: reducer + legal actions + invariants | 1.5 | S2 | totality / no-illegals / determinism / serialization tests green |
| S4 | Content compiler + spike bundle | 1.0 | S3 | bundle builds, counts assert, tampered input fails, rebuild diff clean |
| S5 | Trace harness, `play-cli`, fuzz bot | 0.75 | S3, S4 | trace verify exit 0; 1,000-turn fuzz, 0 invariant failures |
| S6 | Round setup, movement, terrain, reveal, end turn | 0.75 | S5 | movement/reveal trace replays; costs match data |
| S7 | 4-phase combat + damage assignment | 1.75 | S5, S6 | combat table tests + goldens; trace matches hand-computed example |
| S8 | Village interaction + heal + end-to-end round | 0.5 | S6 | site trace and full-round trace replay |
| S9 | Minimal SVG/DOM UI | 1.75 | S6–S8 | Playwright one-round flow green; human 10-turn checklist clean |
| S10 | Spike report + G1 go/no-go | 0.25 | S1–S9 | report committed, links resolve, decision recorded as an ADR |

---

### S1 — Monorepo scaffold + CI

**Do.** Root `package.json` (private, `packageManager: pnpm@12.15.0`, `engines.node >=22`,
scripts `typecheck`/`lint`/`test`/`verify`), `pnpm-workspace.yaml` (`packages/*`, `tools/*`),
`tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, ES2022, no DOM types in engine),
ESLint flat config + Prettier, Vitest config, `.github/workflows/ci.yml` (push/PR: setup Node
22, `pnpm/action-setup` pinned to the `packageManager` version, `pnpm install
--frozen-lockfile`, `pnpm verify`, `actions/setup-python` + `python3 tools/validate_data.py`).
Package skeletons: `packages/shared`, `packages/engine`, `packages/content`,
`packages/client`; tools: `tools/content-compiler`, `tools/golden-traces`, `tools/play-cli`.
Add `.gitignore` entries: `*.tsbuildinfo`, `coverage/`, `playwright-report/`, `test-results/`.
Because execution starts only after approval, this step also records the decision: append
**ADR-009** ("T0 implementation approved"), mark **P5** decided, update `AGENTS.md` §2 and the
status line in [`README.md`](../../README.md).

**Acceptance.**
1. `pnpm install` exits 0 and `pnpm-lock.yaml` is committed.
2. `pnpm verify` exits 0 (typecheck + lint + tests; one trivial test per package).
3. `pnpm install --frozen-lockfile` also exits 0 (CI will use it).
4. `.github/workflows/ci.yml` exists and runs the same `pnpm verify` gate, plus the Python
   validator on a clean checkout.
5. Dependency boundaries enforced: `engine` has no React/DOM/Node imports, checked by
   dependency-cruiser or an ESLint `no-restricted-imports` rule with one failing fixture test.
6. `README.md` status no longer says "no game code yet"; ADR-009 + P5 are recorded.

**Evidence (fill when executed):** commands + output; first CI run URL.

---

### S2 — `packages/shared`: branded IDs, seeded RNG, canonical state hash

**Do.** Branded ID types (`PlayerId`, `CardInstanceId`, `EnemyInstanceId`, `TileId`, `Hex`…),
`RngState` with named streams (`shuffle`, `sourceDice`, `enemyDraw`, `tileDraw`,
`effectRandom`, `scenario`), Mulberry32 `nextU32(rng, stream)`, canonical JSON serializer
(sorted keys, integers only, RFC-8785-style) and a **dependency-free synchronous SHA-256** so
`hashState` is sync in Node, browser and tests. Commit the golden vectors from Appendix A.

**Acceptance.**
1. `pnpm --filter @emberwold/shared test` green.
2. RNG matches the committed vector table exactly (Appendix A) and consuming one stream does
   not change another stream's sequence.
3. `hashState` of the committed fixture object equals the committed hex value; key order and
   whitespace permutations hash identically.
4. `pnpm typecheck` shows no `any` in `shared` (`grep -Rn "\bany\b" packages/shared/src` empty).

**Evidence:** test counts; vector check output.

---

### S3 — `packages/engine`: reducer skeleton, legal actions, invariants, effect registry

**Do.** Spike subset of the [`12`](./12-architecture.md) §5.2/§5.4 model: `GameState`
(schema version, content hash, seed, scenario, phase/round/time-of-day/turn, one player, map,
source, combat, pending, `actionEpoch`, `rng`), `Action` families used by T0 (`playCard` with
mana payment, `playCardSideways`, `moveTo`, `explore`, `enterSite`, `challengeRampaging`,
`declareBlock`/`assignBlock`/`declareAttack`/`assignAttack`/`assignDamage`/`endCombatPhase`,
`resolveChoice`, `endTurn`), `GameEvent` subset, `createGame`, `applyAction` with typed
`ApplyError` (`staleEpoch`, `notLegal`, `invalidState`), `getLegalActions`, `hashState`, and
the invariant module. Include the **effect registry** for the ops the 16-card deck uses:
`choice`, `compound`, `gain_move`, `gain_attack`, `gain_block`, `gain_heal`,
`gain_influence`, `draw_cards`, `gain_mana`, `gain_crystal`, `convert_mana_to_crystal`,
`mana_draw_powered`, `apply_modifier`, `rule_override`, `card_boost`, `discard_cost`,
`change_reputation` — one handler per op, legality + resolution co-located, plus the
`pending`/continuation queue needed by `choice`/`compound`/`discard_cost`. Dev builds
`deepFreeze` states. No `Math.random`/`Date.now` anywhere in `engine`.

**Acceptance.**
1. `pnpm --filter @emberwold/engine test` green.
2. Required tests exist and pass: totality (√a ∈ legal: apply ok), no-illegals (mutated
   actions → typed error, no throw, no state change), determinism (same seed/actions twice →
   byte-identical state + events), serialization round-trip, `actionEpoch` stale-action guard.
3. Every one of the 17 deck ops has a handler and a test; a powered card without a legal mana
   payment is not offered and is rejected with `notLegal`.
4. A boundary check fails if `engine` imports `react`/`node:*`/DOM types.

**Evidence:** test counts; `pnpm verify` output.

---

### S4 — Content compiler: `game-data/` → frozen typed bundle

**Do.** `tools/content-compiler`: read `game-data/*.json` **read-only**, validate with Zod
schemas (envelope, enums from `keywords.json`, referential integrity), build
`packages/content` (`bundle.generated.ts` + plain JSON) for the spike selection (Appendix B),
compute `contentHash = SHA-256(schemaVersion + sorted(manifest file hashes))`, emit stats
(counts, ops used, ids), and run the Python validator as a subprocess gate. Maintain the
explicit `dataOp → engineHandler` map; unmapped ops used by the spike fail the build. The spike
selection lives in `tools/content-compiler/spike.config.json` (ids + tile placement + spawns),
**not** in `game-data/`. The bundle also exposes `rules_constants` (terrain costs, hand/deck
sizes, hero armor) so no rules number is hard-coded in the engine.

**Acceptance.**
1. `pnpm content:build` exits 0 and `pnpm content:check` (rebuild → `git diff --exit-code`)
   proves the generated bundle is deterministic and committed.
2. Asserted counts: 1 hero, 16 card definitions, 2 tiles, 3 enemies, 1 site; every id resolves.
3. Tampering a temp copy of one JSON file fails the build naming the file and id; an unmapped
   op in the spike selection fails the build.
4. `.venv/bin/python tools/validate_data.py` still ends `RESULT: OK` (no data edits were made).
5. `contentHash` is stable across two builds and changes when one byte of input changes.

**Evidence:** build log with counts + hash; tamper-failure output.

---

### S5 — Trace harness, `play-cli`, random-legal bot

**Do.** Trace format `{traceVersion, contentHash, seed, config, actions[], expectedHashes[],
expectedOutcome}` committed under `tools/golden-traces/*.json`; `trace:verify` replays and
compares hashes; `trace:record` writes from a CLI/bot session. `play-cli` prints the current
view/legal actions, applies actions by index, supports `--random` (uniform over legal actions,
bias toward move/combat/site families) and `--seed`. Fuzz loop restarts finished games until
the turn budget is exhausted; prints an invariant summary.

**Acceptance.**
1. `pnpm trace:verify tools/golden-traces/000-smoke.json` exits 0 and prints the action count.
2. A truncated/tampered trace fails with a clear message (non-zero exit).
3. `pnpm fuzz --turns 1000 --seed 1` exits 0 with `invariantFailures: 0` and a game count.
4. `pnpm play --seed 1 --random` completes a run headlessly and writes a replayable trace.

**Evidence:** commands + summary lines; trace file added.

---

### S6 — Round setup, movement, terrain, tile reveal, end turn

**Do.** Round setup: source dice rolled from the `sourceDice` stream, initial hand, Day marker.
Axial hex geometry and neighbours; movement cost from
`content.rulesConstants.terrainMoveCost` (Day values; `lake`/`mountain` null = impassable);
`moveTo` legal-action enumeration with reachability by movement points; tile reveal when a move
enters the frontier of an unrevealed tile (`tileRevealCost` from data); `explore` event + undo
barrier; turn phases (`turnStart → movement → action → endOfTurn`), `endTurn` pipeline (mana
token expiry, draw to hand limit, turn advance, round end when no turns remain); round/day-night
fields carried in state.

**Acceptance.**
1. `pnpm --filter @emberwold/engine test` includes table-driven movement-cost tests using the
   Day values (plains 2, hills 3, forest 3, wasteland 4, desert 5, swamp 5, lake/mountain
   impassable) and fails if a cost is hard-coded instead of loaded from content.
2. `pnpm trace:verify tools/golden-traces/010-move-reveal.json` exits 0; events include
   `heroMoved` and `tileRevealed`, and the revealed tile's hexes are in map state.
3. Source dice and initial hand are reproducible from the seed (same seed → same values, two
   runs); mana tokens expire at end of turn (unit test).
4. Illegal moves (lake/mountain/too-far) are absent from legal actions and rejected by
   `applyAction` with `notLegal`.
5. `endTurn` with an empty hand is rejected unless the deck/discard is empty (rules: at least
   one card must be played/discarded), covered by a unit test.

**Evidence:** trace summary; event dump at final action.

---

### S7 — 4-phase combat and damage assignment

**Do.** `CombatState` sub-machine (rangedSiege → block → assignDamage → attack), entered by
`challengeRampaging` (attack the spawned rampaging token); enemies revealed, undo barrier
raised. Effect handlers for attack/block (melee/ranged), element efficiency and resistances,
fortify (only siege in ranged phase), swift (block required = 2× attack), block accumulation
with the partial-block rule (1 point per 2 block when not efficient), damage queue, wounds to
hero (armor 2, hand 5) and enemy defeat → fame, end combat. `combatMath.ts` is the single
arithmetic implementation (no duplication in the UI).

**Acceptance.**
1. `pnpm --filter @emberwold/engine test` passes table-driven cases derived from the
   rulebook's own numbers: Fire Ranged 4 vs Ice Block 4 → 2 remaining; Block 7 vs 4 → 3
   (MKUE Rulebook p.12 §4c); damage vs armor with physical resistance: 3 damage to an Armor-3
   resistant target is fully absorbed, 4+ wounds it (MKUE Walkthrough damage-assignment
   example; local `reference/extracted/MKUE_walkthrough.txt`, numbers only, no text copied).
2. `pnpm trace:verify tools/golden-traces/020-combat.json` exits 0 and the expected summary
   (wounds taken, enemies defeated, fame gained) matches the hand-computed values recorded in
   the trace's `expectedOutcome`.
3. Fortify and swift are exercised by `enemy:diggers` and `enemy:wolf_riders` in a test; a
   melee card in the ranged phase is not a legal action.
4. The reducer has one combat-math function per rule; `grep` shows no arithmetic duplicated in
   `packages/client`.

**Evidence:** test list; trace summary + expected vs actual.

> Note on "matches the rulebook worked example" ([`14`](./14-roadmap.md) §1 M2-1): the
> player-visible worked examples use enemies whose `game-data` stats are
> `upstream-only`/`placeholder` and do not match the printed walkthrough (e.g.
> `enemy:golems` Armor 5 vs the walkthrough's Armor 3). T0 therefore verifies the
> **arithmetic** against the rulebook/walkthrough numbers in unit tests, and the golden trace
> against hand-computed values for spike enemies. Full card/enemy fidelity is a T1
> data-verification task (see §11, B4).

---

### S8 — Village interaction, heal reward, end-to-end round trace

**Do.** `enterSite` at the village (no entry combat); interaction state: influence pool from
cards played this turn → `buyHealing` action priced from content
(`site.healing.influence_per_point = 3`); healing runs the wound-removal path; events
`siteEntered`, `influenceSpent`, `healGained`; leaving the site / ending turn resets
interaction state. No reputation modifier in T0 (village healing needs none). Record the
end-to-end query: move → reveal → assault → village heal → end turn in one trace.

**Acceptance.**
1. `pnpm trace:verify tools/golden-traces/030-site-heal.json` exits 0: play influence card →
   enter village → buy 1 healing point with 3 influence → 1 wound removed as expected, hashes
   match.
2. Buying healing with insufficient influence is not legal and is rejected with `notLegal`;
   interacting from a non-site hex is not legal.
3. `pnpm trace:verify tools/golden-traces/040-one-round.json` exits 0: the full G1.1/G1.2
   sequence (move, reveal, assault, heal, end turn) in a single deterministic round, with
   `expectedOutcome` recording the final state (fame, wounds, round/turn).

**Evidence:** trace summaries; test names.

---

### S9 — Minimal SVG/DOM UI

**Do.** `packages/client`: Vite + React app; title/new-run screen (optional seed input);
SVG hex board rendering tiles from state (origin/rotation, terrain fill, site/token markers);
DOM hand (card name, basic/powered/sideways buttons); legal-action menu built **only** from
`getLegalActions` (client contains zero rules); combat overlay (phase rail, enemies, attack/
block pools, assign buttons); event log; end-turn/round indicator. Procedural placeholder art
and the committed palette only; no final art wiring in T0. Add Playwright
(`pnpm exec playwright install chromium`) and one spec to CI.

**Acceptance.**
1. `pnpm dev` serves the app; `pnpm build && pnpm preview` serves the production build.
2. `pnpm test:e2e` drives one full round headlessly: play cards → move → explore → assault →
   village heal → end turn, with zero console errors and no illegal action ever offered
   (assert every control comes from the legal set).
3. Human checklist (10 turns, no crash, combat and site resolved, clear legal actions) is
   recorded in the spike report; failing steps become bugs before G1. "Fun" evidence: the
   owner and one unfamiliar player each answer three fixed questions (what was confusing? would
   you play 10 more turns? what would you fix first?).

**Evidence:** dev URL; Playwright output; checklist.

---

### S10 — Spike report and G1 go/no-go

**Do.** Write `docs/design/spike-report.md`: what was easy/hard, deviations from the rules
(the §2.2 list, restated), data defects found (§11), revised T1 estimate against
[`12`](./12-architecture.md) §12.5, trace links, and a go/no-go recommendation. Record the
decision as a new ADR in [`00-decisions.md`](./00-decisions.md) (append-only), and update
[`14-roadmap.md`](./14-roadmap.md) + `PROGRESS.md` + the doc indexes.

**Acceptance.**
1. Report committed with all internal links resolving to existing files.
2. G1 table (§1) filled with evidence links (traces, test commands, playtest notes) and a
   clear recommendation.
3. Decision recorded as ADR-010 (ADR-009 is the approval); roadmap/PROGRESS updated;
   `pnpm verify` green; `git status` clean.

**Evidence:** report path; ADR number; links check.

## 7. Determinism and trace contract (from [`12`](./12-architecture.md) §5.3/§10.2)

* **RNG:** Mulberry32 with per-stream counters; algorithms and vectors fixed in S2. Only the
  engine consumes game RNG; bots/UI use a separate non-game RNG.
* **State hash:** canonical JSON + SHA-256 after every accepted action; the hash appears in the
  replay log, traces and tests.
* **Trace fixture:** `{traceVersion, contentHash, seed, config, actions[], expectedHashes[],
  expectedOutcome}`; a deliberate rules fix regenerates traces and shows the hash diff in the
  PR (never "regenerate to make CI green").
* **Determinism test:** replay the same action log twice, in two processes, and compare every
  hash from S2 onward; any divergence is a P0.

## 8. Schedule, checkpoints, cut order

| Working day | Deliverable |
|---|---|
| D1 | S1 scaffold green + CI workflow; approval recorded (ADR-009) |
| D2 | S2 shared vectors/hash green |
| D3 | S3 reducer skeleton + effect registry green |
| D4 | S4 bundle + content hash green |
| D5 | S5 traces/CLI/fuzz green — **checkpoint C1: headless round loop replays deterministically** |
| D6 | S6 round setup + movement/reveal trace |
| D7–D8 | S7 combat — **checkpoint C2 (end D8): assault trace green**; S8 site + full-round trace |
| D9–D10 | S9 UI + Playwright; S10 report — **checkpoint C3 (end D10): human plays 10 turns, G1 decision** |

**If behind at a checkpoint, cut in this order** ([`12`](./12-architecture.md) §12.3
principle: never cut determinism or tests): (1) Playwright → manual checklist only; (2)
procedural UI polish; (3) fuzz budget 1,000 → 200 turns; (4) enemy ability keywords beyond
fortified/swift; (5) village recruit (already out of scope). **Do not cut** the state hash,
trace replay, unit tests, or the assault/site/full-round traces.

**Stop/re-scope trigger (pre-committed, [`14`](./14-roadmap.md) §6):** if C2 is still failing
its core trace at end of D8 — combat does not resolve, or traces cannot replay
deterministically — stop feature work, write the report with the blocker, and re-scope T0.5
with the owner rather than pushing on.

## 9. Testing and CI gates (scaled from [`12`](./12-architecture.md) §10)

| Gate | T0 target | Where |
|---|---|---|
| Unit tests | ≥ 80 tests across shared/engine/content; every effect handler in the 16-card deck has happy-path + sideway/powered tests | PR + CI |
| Golden traces | ≥ 4: smoke, move+reveal, combat, site heal; plus the end-to-end one-round trace | PR + CI |
| Property tests | totality, no-illegals, determinism, serialization, undo boundary — 5 properties × ≥ 100 cases | PR + CI |
| Fuzz | ≥ 1,000 turns random-legal, 0 invariant failures (nightly job after T0) | CI job |
| Content validation | Python validator (stdlib only) + bundle rebuild diff | PR + CI |
| E2E | 1 Playwright one-round spec | PR + CI |
| Boundaries | dependency rules (engine import restrictions) | CI |

## 10. Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| K1 | The 16-card deck needs 17 effect ops (`choice`, `compound`, `discard_cost`, `apply_modifier`, `rule_override`, `mana_draw_powered`, `card_boost`…), not just "simple" cards | S3 builds the full registry first, ordered by the first trace; if one op threatens the schedule, record it in the report and cut the *card* only with owner approval — never fake it |
| K2 | UI eats the schedule | SVG/DOM, no animation, no art; Playwright is the first thing cut |
| K3 | Data is `upstream-only` for tiles/enemies, and the walkthrough enemies' stats do not match `game-data` | Traces state provenance; T0 proves the seam, not fidelity; the report flags it |
| K4 | Determinism drift (iteration order, floats, ambient time) | canonical hash from S2, integer-only game values, `no-restricted-imports`, dual-process replay test |
| K5 | Scope creep ("just one more site/card") | §2.2 is the fence; new content needs an owner decision |
| K6 | Public repo/CI exposure | no secrets in any step; CI pushed only after owner confirms the branch strategy (§12 Q6) |
| K7 | Night/terrain data conflict (see §11 B3) | T0 is Day-only; Day values agree across sources; report the night mismatch for T1 |

## 11. Data findings to report (not fixed in T0)

Found while planning; each becomes a line in the spike report and a T1 data task. **No
`game-data/` edits in T0** ([`AGENTS.md`](../../AGENTS.md) §4,
[`12`](./12-architecture.md) §6.4).

| # | Finding | Impact on T0 |
|---|---|---|
| B1 | [`game-data/basic-actions.json`](../../game-data/basic-actions.json) → `deck_composition.standard_deck` uses double-prefixed ids (`basic:basic:rage`) that match no item; the validator does not check this field | None — decks compile from `heroes.json → starting_deck` (valid). Flag for a validator check + data fix |
| B2 | Tile `rampaging` values are upstream token names (e.g. `orc_marauder`); no matching `enemy:` definition exists anywhere in [`game-data/enemies.json`](../../game-data/enemies.json) | None — spike spawns are authored in `spike.config.json`; tile rampaging refs must be resolved in the T1 data pass |
| B3 | Night terrain costs differ: [`02` §5.1](../research/02-rules-core.md) (only forest/desert differ at night) vs `keywords.json → rules_constants` (plains 2/3, hills 3/4, wasteland 4/5) | None — T0 is Day-only and **Day values agree**; T1 must reconcile against the board |
| B4 | `tiles`/`enemies` are `status: placeholder`, `confidence: upstream-only`; walkthrough example enemies do not match data (e.g. golems Armor 5 vs 3) | Combat arithmetic is verified in unit tests; trace expectations are hand-computed, not "official" |
| B5 | `scenario:first-conquest` has `layout_status: "todo"` (no authored placement/site seeding) | T0 uses its own 2-tile placement; T1 authors the real 4-tile layout (Lead decision) |
| B6 | No `.github/` workflows exist; first CI run needs a push (owner controls branch strategy) | S1 creates the workflow; first green run recorded in the report |

## 12. Questions for the owner (approval bundle)

1. **P5: lift the pre-implementation hold** for T0 exactly as scoped here? (If not, nothing in
   §6 starts.)
2. Accept the **spike simplifications** in §2.2 — especially player-turns-only rounds (no
   tactics/dummy), Day-only, no skills/levels/spells/units, no save/undo? They are restored in
   T1.
3. **Hero for the spike:** `hero:goldyx` (proposed: 12 unique card defs, mana-focused) or
   `hero:arythea` (13 defs, direct combat)?
4. Accept the **spike map**: `tile:starting_a` + `tile:countryside_1` with the village at the
   countryside tile's printed village hex and two authored spawns (`prowlers`, `diggers`)?
5. Accept the **enemy trio** (prowlers / diggers / wolf_riders) as the 3 definitions?
6. **Branch strategy for public code:** work on `main` directly, or on a `t0-spike` branch
   with a PR at the end (recommended: branch + PR so CI and review happen before merge)?
7. Demo cadence: short demo at C1 (headless round), C2 (assault), C3 (playable round) — or
   only at C3?
8. The plan boxes 9.5 dev-days inside the 2-week T0; if the first checkpoint (C1) slips by
   more than one day, do you want a re-scope check then rather than at C2?

## Appendix A — Golden vectors (independent derivation, checked 2026-10-31)

Mulberry32 raw `u32` outputs (identical from an independent Python implementation and the
standard JavaScript reference, both run during planning):

| seed | first five values |
|---|---|
| `0` | `1144304738, 1416247, 958946056, 627933444, 2007157716` |
| `1` | `2693262067, 11749833, 2265367787, 4213581821, 4159151403` |
| `12345` | `4207900869, 1317490944, 2079646450, 3513001552, 2187978186` |

SHA-256 of the UTF-8 string `emberwold` (identical from Python `hashlib` and Node `crypto`):
`ee5f116d1dd573dec04e652341751763fc68a8cacd6bc38aee603f0f6a44a9bc`.

These vectors are committed as fixtures in S2 and must be reproduced exactly; they prove the
implementation, not the other way round.

## Appendix B — Proposed spike content selection

| Domain | IDs |
|---|---|
| Hero | `hero:goldyx` (fallback `hero:arythea`) |
| Cards | the hero's 16 starting-deck IDs from `heroes.json → starting_deck` (all resolve) |
| Tiles | `tile:starting_a`, `tile:countryside_1` |
| Enemies | `enemy:prowlers` (no ability), `enemy:diggers` (fortified), `enemy:wolf_riders` (swift) |
| Site | `site:village` (healing 3 influence/point; no entry combat) |
| Rules constants | `game-data/keywords.json → rules_constants`: hand 5, deed deck 16, armor 2, hero hand limit 5, terrain Day costs, tile reveal cost 2 |
| Tiles placement / spawns | authored in `tools/content-compiler/spike.config.json` (design decision, reviewable in one file) |

Every card definition used by the deck resolves in `basic-actions.json` (verified during
planning); the deck includes the hero-specific cards `basic:goldyx_crystal_joy` and
`basic:goldyx_will_focus` for Goldyx.

## Appendix C — Command conventions

```bash
# from the repo root; host PATH toolchain
pnpm install && pnpm verify
pnpm content:build && pnpm content:check
pnpm trace:verify tools/golden-traces/000-smoke.json
pnpm fuzz --turns 1000 --seed 1
pnpm test:e2e

# data validator (unchanged; no state mutated)
.venv/bin/python tools/validate_data.py
```

Fallback when `pnpm` is not on PATH: use the bundled `node` binary and `pnpm.mjs` paths
reported by the harness's dependency loader, e.g.

```bash
NODE=<bundled node binary>
PNPM=<bundled pnpm.mjs>
$NODE $PNPM install && $NODE $PNPM verify
```

## Sources

* [`10-feasibility-analysis.md`](./10-feasibility-analysis.md) §6/§9 — effort model, G1,
  validation gate.
* [`11-mvp-scope.md`](./11-mvp-scope.md) §2–§5, §10 — experience targets, content manifest,
  systems in/out.
* [`12-architecture.md`](./12-architecture.md) §3.3, §5, §6, §10, §12.4, §12.6 — stack,
  engine contract, content pipeline, tests, T0 slice, T0-done.
* [`14-roadmap.md`](./14-roadmap.md) §0.1, §1 (M1–M2), §5, §6 — tiers, milestones, task list,
  kill criteria.
* [`17-platform-analysis.md`](./17-platform-analysis.md) §5 — concrete stack.
* [`game-data/README.md`](../../game-data/README.md) §2, §3.5, §5–§6 — data layout, MVP
  markers, provenance, coverage.
* Local only (gitignored): `reference/extracted/MKUE_rulebook.txt`,
  `reference/extracted/MKUE_walkthrough.txt` — sources for the combat/movement numbers cited
  in S6/S7; no publisher text is committed.
