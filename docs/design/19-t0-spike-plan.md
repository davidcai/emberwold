# 19 · T0 Spike Plan — two weeks to a playable round

**Status:** approved (ADR-009) · execution started 2026-10-31 · S1–S3 done · branch `t0-spike`
**Companions:** [`10-feasibility-analysis.md`](./10-feasibility-analysis.md) §6/§9 (G1),
[`11-mvp-scope.md`](./11-mvp-scope.md) §2–§5/§10 (scope/content),
[`12-architecture.md`](./12-architecture.md) §3.3/§5/§6/§10/§12.4/§12.6 (engine, pipeline,
tests, T0 slice), [`14-roadmap.md`](./14-roadmap.md) §0.1/§1/§5/§6 (tiers, M1–M2),
[`15-retheme-bible.md`](./15-retheme-bible.md) §9/§10 (data & code policy),
[`17-platform-analysis.md`](./17-platform-analysis.md) §5 (stack), and the ADRs in
[`00-decisions.md`](./00-decisions.md).

> **Gate status: APPROVED 2026-10-31 (ADR-009 in [`00-decisions.md`](./00-decisions.md)).**
> The owner approved this plan and its proposed defaults. Execution is on branch `t0-spike`:
> **S1–S3 are done** (evidence in each step); S4–S10 are not started. No T1/T2 work is
> authorized by this plan.
>
> **Review record.** Two fresh-context reviewers checked this plan against the docs. Their
> verified blockers — wrong op count/def count, the G1 card count, explore-as-side-effect,
> the partial-block rule (PvP only), and the missing presentation boundary — are fixed here;
> what remains is owner decisions (§12). Details in §13.

## 1. Goal

Build the **T0 vertical slice** — one hero, two tiles, one Day round, one assault, one site —
headless first and then with a minimal browser UI, so that **G1** can be judged on evidence:
movement → reveal → assault → reward → end turn works, the run replays deterministically from a
trace, a human plays it without a crash, and the spike report records what was learned.

Acceptance ([`10`](./10-feasibility-analysis.md) §9 G1; "T0 done" in
[`12`](./12-architecture.md) §12.6):

| # | Check | Evidence |
|---|---|---|
| G1.1 | One round playable start-to-finish on 2 tiles with the hero's **16-card deck (12 unique defs)** — G1 says "20 cards"; the deck is rules-fixed at 16 (owner decision Q10) | recorded trace + CLI transcript |
| G1.2 | Movement, tile reveal, assault (4-phase combat), site interaction all resolve | one trace each + unit tests |
| G1.3 | Deterministic replay: same seed + action log → same state hashes | `trace:verify` exit 0, all hashes match |
| G1.4 | No crashes; no illegal action offered by the UI | 1,000-turn random-legal fuzz (termination asserted), invariant failures 0; Playwright + human checklist |
| G1.5 | "Fun enough to continue" verdict | two fixed playtest questions (owner + one unfamiliar player), pass rule in S9.3 |

## 2. Scope: what T0 is, and what it deliberately is not

T0 exists to test the **rules/UI seam and the pace of work**, not to ship a game
([`10`](./10-feasibility-analysis.md) §6; [`14`](./14-roadmap.md) §0.1). The cut lines below
are the plan's scope decision and need owner sign-off.

### 2.1 In scope

| Area | T0 slice |
|---|---|
| Hero | 1 hero; propose `hero:goldyx` (existing data id; 12 unique card defs) |
| Deck | the hero's 16-card starting deck, **all 16 instances playable** (basic + powered + sideways); 2 of the 12 defs are placeholder confidence (B4) |
| Map | 2 tiles: `tile:starting_a` + `tile:countryside_1`, one authored placement, one `explore` reveal |
| Enemies | 3 definitions: `enemy:prowlers`, `enemy:diggers`, `enemy:wolf_riders` (plain, fortified, swift); 2 tokens spawned for the assault |
| Site | `site:village` — influence → healing purchase (3 influence per point, from site data) |
| Round | Day rounds only (no night), new round after round end, until a spike **10-round cap** so a human can take 10 turns; source dice rerolled each round |
| Turn | movement → action → end of turn, plus **standard Rest and slow recovery** (needed to cycle the deck and to avoid a wound-only-hand deadlock) |
| Wounds | real Wound cards in hand/discard (rules-defined; no data def yet, B7), round-end recycle into deck |
| Engine | pure reducer, seeded RNG, event log, legal actions, state hash, invariants; mana payment for powered cards |
| Content | `game-data/` → typed bundle via a thin compiler; Python validator is the single validation gate |
| Presentation | client renders **display strings from the content bundle only**; no proper noun literal in code/UI; T0 uses data names as scaffolding (re-theme is a release gate, §13) |
| CLI | `play-cli` (interactive + random-legal bot), trace record/verify, fuzz harness |
| UI | minimal browser shell: SVG hex board, DOM hand, legal-action menus, combat overlay (optional for G1 — see Q14) |
| Art | procedural placeholders only ([ADR-005/006](./00-decisions.md)); agent never generates images |

### 2.2 Out of scope (deferred to T1/M3+, not dropped)

* Tactics selection and the **dummy player** — T0 rounds are player-turns-only
  ([`12`](./12-architecture.md) §8.1 puts the dummy in the T1 core loop).
* Night rounds/day-night mana variation (Day costs only; see B3 for the night data conflict),
  forced withdrawal, end-of-turn space benefits (glade/mine), combat-reward claiming,
  level-up, the optional pre-draw discard, and full map rules: rotation/corner-symbol matching
  and the ≥2-tile placement restriction are **waived for the single authored reveal** because
  only one tile exists at that point (recorded as a spike deviation).
* Skills, Advanced Actions, Spells, Artifacts, Units, achievements, scoring, city,
  dungeon/tomb, save/undo (engine or UI), audio, animation.
* Multiplayer/hotseat, AI opponent, desktop packaging, public branding.
* **Combat fidelity waiver:** [`14`](./14-roadmap.md) M2-1 asks for "a trace that matches the
  rulebook worked example". The walkthrough's example enemies do not exist in `game-data` with
  matching stats (B4), so T0 verifies the combat **arithmetic** against the rulebook numbers in
  unit tests and uses a hand-computed trace for spike enemies; the waiver is listed here for
  owner sign-off (Q2 bundle).

> SPIKE-SIMPLIFICATION LIST (owner approval requested): the bullets above are what T0
> knowingly does not implement. The spike report must restate them as the deviation list, and
> each must reappear in the T1 plan. Nothing here may be silently "kept simplified" after T0.

## 3. Settled constraints (do not re-litigate)

1. **Stack ([ADR-003](./00-decisions.md), [`17`](./17-platform-analysis.md) §5):** TypeScript
   strict, pnpm workspaces, Vite + React, **SVG/DOM board first** (PixiJS only behind a
   `BoardRenderer` interface if profiling demands it), Vitest, Playwright. No Godot/Unity, no
   Rust core.
2. **Clean room ([ADR-002](./00-decisions.md), [`15`](./15-retheme-bible.md) §9):** neutral
   internal IDs, display strings from the content pack, no proper nouns in code/UI/test
   literals, no publisher rulebook text committed. T0 code/UI may render the data's current
   names as local scaffolding; the re-theme of the data itself is a release gate (15 §10).
3. **Public repo:** no secrets, no third-party assets, no personal data in the repo (playtest
   notes are anonymous). Generated content is proposed to be committed — owner decision Q12.
4. **Game-data ownership:** engine/content work consumes `game-data/` read-only; data defects
   are reported, not silently fixed ([`12`](./12-architecture.md) §6.4,
   [`AGENTS.md`](../../AGENTS.md) §4). The spike selection lives in `spike.config.json`, not in
   `game-data` — a deviation from [`14`](./14-roadmap.md) M1-5 (Q13).
5. **Art:** placeholders only in T0 ([ADR-005/006](./00-decisions.md)).

## 4. Baseline verified before planning (2026-10-31)

Planning baseline was HEAD `49eea2f` (clean, synced; validator green). The plan and index
edits are committed in `ba912e5`/`c3e2d7e`; a current `git status -sb` must be clean before S1.

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
| Validator deps | imports in `tools/validate_data.py` | standard library only: CI can run `python3`, local runs use `.venv/bin/python` |
| Rulebook fixtures | `reference/extracted/` | MKUE rulebook + walkthrough + master sheet present locally |
| RNG algorithm | independent Python and Node implementations | identical vectors (§Appendix A) |
| SHA-256 vectors | Python `hashlib` vs Node `crypto` | identical (§Appendix A) |

## 5. Environment notes that shape the commands

* Harness bundled toolchain: node `24.21.0` + pnpm `11.28.5`; host PATH: node `24.22.1` +
  pnpm `12.15.0`. Pin pnpm in `package.json → packageManager` (**`pnpm@12.15.0`**), add
  `.nvmrc` with **22** for CI parity with [`12`](./12-architecture.md) §3.3, and set
  `engines.node >=22`; local node 24 must still pass (record actual version in the report).
* Commands run from the repo root (`~/dev/emberwold`). Local validator commands use
  `.venv/bin/python tools/validate_data.py`; CI uses `python3 tools/validate_data.py`
  (stdlib-only, verified).
* `game-data` numbers are data, not code: terrain costs, site healing, enemy stats and rules
  constants load from the content bundle.

## 6. Plan steps

Ten steps, each a small commit series; every step has a check a command or a direct
observation can confirm. Estimates are dev-days for one engineer; total ≈ 9.25 plus a 0.75-day
integration buffer = the 2-week T0 box ([`14`](./14-roadmap.md) §0.1). Step S9 (browser UI) is
**not required by G1** — Q14 lets the owner drop it for a ~7-step CLI-only spike.

| # | Step | Est | Depends on | Acceptance check (short) |
|---|---|---:|---|---|
| S1 | Approval bookkeeping, monorepo scaffold, CI | 0.5 | — | ADR-009/P5 recorded first; `pnpm verify` green; CI runs the same gate |
| S2 | `shared`: IDs, RNG, canonical hash | 0.75 | S1 | RNG/hash golden vectors pass; stream independence |
| S3 | `engine`: state, reducer, legal actions, invariants | 1.25 | S2 | totality / no-illegals / determinism / serialization tests green |
| S4 | Content compiler (thin) + spike bundle | 1.0 | S3 | Python validator gate, counts assert, tampered input fails, rebuild diff clean |
| S5 | Trace harness, `play-cli`, fuzz bot | 0.75 | S3, S4 | trace verify exit 0; 1,000-turn fuzz, 0 invariant failures, termination asserted |
| S6 | Round loop, movement, terrain, explore, rest, end turn | 1.0 | S5 | movement/explore/rest traces replay; costs loaded from data |
| S7 | 4-phase combat + damage assignment | 1.5 | S5, S6 | combat table tests + goldens; trace matches hand-computed example |
| S8 | Village interaction, heal, end-to-end round trace | 0.5 | S6, S7 | site trace + full-round trace replay |
| S9 | Minimal SVG/DOM UI (G1-optional) | 1.75 | S6–S8 | Playwright one-round flow green; human 10-turn checklist clean |
| S10 | Spike report, cleanup, G1 go/no-go with owner | 0.25 | S1–S9 | report committed, links resolve, decision recorded with the owner |

---

### S1 — Approval bookkeeping, monorepo scaffold, CI · **done 2026-10-31**

**Do.** **First action before any install:** append **ADR-009** ("T0 implementation approved"),
mark **P5** decided, update [`AGENTS.md`](../../AGENTS.md) §2 (phase: implementation in
progress), and the [`README.md`](../../README.md) status line. Then root `package.json`
(private, `packageManager: pnpm@12.15.0`, `engines.node >=22`), `.nvmrc` (`22`),
`pnpm-workspace.yaml` (`packages/*`, `tools/*`), `tsconfig.base.json` (strict,
`noUncheckedIndexedAccess`, ES2022, no DOM types in engine), ESLint flat config + Prettier,
Vitest config, `.github/workflows/ci.yml` (push/PR: setup Node 22 from `.nvmrc`,
`pnpm/action-setup` pinned, `pnpm install --frozen-lockfile`, `pnpm verify`,
`actions/setup-python` + `python3 tools/validate_data.py`). Package skeletons:
`packages/shared`, `packages/engine`, `packages/content`, `packages/client`; tools:
`tools/content-compiler`, `tools/golden-traces`, `tools/play-cli`. Add `.gitignore` entries:
`*.tsbuildinfo`, `coverage/`, `playwright-report/`, `test-results/`.

**Acceptance.**
1. ADR-009 + P5 + `AGENTS.md`/README status changes are in the first commit of the branch.
2. `pnpm install` exits 0 and `pnpm-lock.yaml` is committed.
3. `pnpm verify` exits 0 (typecheck + lint + tests; one trivial test per package).
4. `pnpm install --frozen-lockfile` also exits 0 (CI will use it).
5. `.github/workflows/ci.yml` exists and runs the same `pnpm verify` gate plus `python3
   tools/validate_data.py` on a clean checkout.
6. Dependency boundaries enforced: `engine` has no React/DOM/Node imports (dependency-cruiser
   or ESLint `no-restricted-imports`, with a failing fixture test).
7. **Pre-push secret scan** performed on the diff (`git diff --cached` grep for keys/tokens/
   personal data) before the first push ([`AGENTS.md`](../../AGENTS.md) §1/§7).

**Evidence (2026-10-31, branch `t0-spike`, commit `453f1d6`):**
* `pnpm verify` → typecheck ok, lint ok, `Test Files 7 passed (7)` / `Tests 7 passed (7)`,
  `no dependency violations found (15 modules, 8 dependencies cruised)`.
* `pnpm install --frozen-lockfile` → `Lockfile is up to date`, exit 0.
* `python3 tools/validate_data.py` → `RESULT: OK` (nothing under `game-data/` changed).
* Boundary rule proven to fail on purpose: a temporary `node:fs` import under
  `packages/engine` produced `error engine-must-not-use-node-core` (probe deleted afterwards).
* Prettier check green; diff scan for secrets/personal data clean.
* CI run: https://github.com/davidcai/emberwold/actions/runs/41265608826 — all steps green
  (annotation only: GitHub notes the action majors target Node 20 while runners force Node 24;
  upgrade the action versions in a later step).

---

### S2 — `packages/shared`: branded IDs, seeded RNG, canonical state hash · **done 2026-10-31**

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
4. ESLint `@typescript-eslint/no-explicit-any` reports zero violations in `shared`.

**Evidence (2026-10-31, branch `t0-spike`, commit `db25ee6`):**
* `pnpm --filter @emberwold/shared test` → `Test Files 4 passed (4)` / `Tests 22 passed (22)`:
  Mulberry32 vectors for seeds 0/1/12345 match Appendix A exactly; SHA-256 vectors including
  `emberwold`; canonical ordering/hash; stream independence; state immutability.
* `pnpm verify` → typecheck ok, lint ok (`no-explicit-any` clean), full suite
  `Tests 29 passed (29)`, `0 dependency violations (22 modules, 17 dependencies cruised)`.
* Prettier clean; new state objects are JSON-round-trippable.

---

### S3 — `packages/engine`: state, reducer, legal actions, invariants · **done 2026-10-31**

**Do.** Spike subset of the [`12`](./12-architecture.md) §5.2/§5.4 model: `GameState`
(schema version, content hash, seed, scenario, phase/round/time-of-day/turn, one player, map,
source, combat, pending, `actionEpoch`, `rng`), `Action` families used by T0 (`playCard` with
mana payment, `playCardSideways`, `moveTo`, `explore`, `enterSite`, `challengeRampaging`,
`buyHealing`, and the combat families `declareBlock`/`assignBlock`/`declareAttack`/
`assignAttack`/`assignDamage`/`endCombatPhase`, plus `resolveChoice`, `rest` with kinds
`standard`/`slowRecovery`, `endTurn`), `GameEvent` subset, `createGame`, `applyAction` with
typed `ApplyError` (`staleEpoch`, `notLegal`, `invalidState`), `getLegalActions`, `hashState`,
invariant module. Dev builds `deepFreeze` states. No `Math.random`/`Date.now` in `engine`.

**Acceptance.**
1. `pnpm --filter @emberwold/engine test` green.
2. Required tests exist and pass: totality (every legal action applies), no-illegals (mutated
   actions → typed error, no throw, no state change), determinism (same seed/actions twice →
   byte-identical state + events), serialization round-trip, `actionEpoch` stale-action guard.
3. A boundary check fails if `engine` imports `react`/`node:*`/DOM types.
4. `rest` legality is exactly MKUE p.6 §7: standard needs ≥1 non-Wound card in hand (discard
   one non-Wound + any Wounds to discard), slow recovery only when the hand is all Wounds
   (discard one Wound); both are tested, so a wound-only hand always has a legal turn.

**Evidence (2026-10-31, branch `t0-spike`, commit `1716ec2`):**
* `pnpm --filter @emberwold/engine test` → `Tests 13 passed (13)`: setup, totality (every
  legal action applies), no-illegals + stale epoch without mutation, basic play, powered play
  paying a crystal, choice resolution, discard-cost resolution, standard/slow rest legality,
  determinism (two replays → equal hashes), JSON round-trip, round cap / game end, invariants.
* `pnpm verify` → typecheck ok, lint ok, `Tests 40 passed (40)` across 10 files, 0 dependency
  violations (27 modules, 22 dependencies).
* `combatMath.ts` holds the single block/resistance/wound implementation used by the reducer.

---

### S4 — Content compiler (thin) + spike bundle

**Do.** One thin `tools/content-compiler`: read `game-data/*.json` **read-only**, invoke the
**Python validator as the single validation gate** (per [`12`](./12-architecture.md) §6.1 —
no duplicated rule-checking in Zod; at most Zod for the generated bundle envelope), build
`packages/content` (bundle JSON + generated `.ts` types) for the spike selection (Appendix B),
compute `contentHash = SHA-256(schemaVersion + sorted(full file hashes))` (the manifest
`sha256` fields are 16-hex prefixes: verify each prefix, then hash full file bytes; B8), emit
stats (counts, ops used, ids), and check every used `dataOp` maps to a registered engine
handler. The spike selection lives in `tools/content-compiler/spike.config.json` (ids, tile
placement, spawns, round cap, Wound-card def), **not** in `game-data/` (owner decision Q13).
Commit-vs-build-artifact of the generated bundle is owner decision Q12 (default: commit, per
[`12`](./12-architecture.md) §4.3).

**Acceptance.**
1. `pnpm content:build` exits 0 and `pnpm content:check` (rebuild → `git diff --exit-code`)
   proves the generated bundle is deterministic (or, if Q12 chooses artifact-only, the
   rebuild hash is byte-identical).
2. Asserted counts: 1 hero, **12 card definitions / 16 deck instances**, 2 tiles, 3 enemies,
   1 site, 1 synthetic Wound card; every id resolves.
3. Tampering a temp copy of one JSON file (outside the repo, deleted afterwards) fails the
   build naming the file and id; an unmapped op in the spike selection fails the build.
4. `.venv/bin/python tools/validate_data.py` still ends `RESULT: OK` (no data edits were made).
5. `contentHash` is stable across two builds and changes when one byte of input changes.
6. A mutation test proves the engine reads rules numbers from the bundle: a test fixture with
   a modified terrain cost makes the movement-cost test fail with the modified value (no
   hard-coded copy).

**Evidence:** build log with counts + hash; tamper-failure output; mutation-test result.

---

### S5 — Trace harness, `play-cli`, random-legal bot

**Do.** Trace format `{traceVersion, contentHash, engineVersion, rulesetId, seed, config,
actions[], expectedHashes[], expectedOutcome}` committed under `tools/golden-traces/*.json`
(per [`12`](./12-architecture.md) §7.4); `trace:verify` replays and compares hashes;
`trace:record` writes from a CLI/bot session. `play-cli` prints the current view/legal actions,
applies actions by index, supports `--random` (uniform over legal actions, bias toward
move/combat/site families) and `--seed`. Fuzz loop restarts finished games until the turn
budget is exhausted; asserts termination and prints an invariant summary.

**Acceptance.**
1. `pnpm trace:verify tools/golden-traces/000-smoke.json` exits 0 and prints the action count.
2. A truncated/tampered trace fails with a clear message (non-zero exit).
3. `pnpm fuzz --turns 1000 --seed 1` exits 0 with `invariantFailures: 0`, a game count, and
   `terminationViolations: 0` (every game ended within the round/turn cap).
4. `pnpm play --seed 1 --random` completes a run headlessly and writes a replayable trace.

**Evidence:** commands + summary lines; trace file added.

---

### S6 — Round loop, movement, terrain, explore, rest, end turn

**Do.** Round setup: source dice rolled from the `sourceDice` stream, initial hand, Day marker;
round end → next round setup (dice reroll, round++, Day again — no night) until the spike
round cap (default 10) or game end. Axial hex geometry and neighbours; movement cost from
`content.rulesConstants.terrainMoveCost` (Day values; `lake`/`mountain` null = impassable);
`moveTo` legal-action enumeration with reachability by movement points; **`explore` is its own
action** costing `tileRevealCost` (2) Move points from the hero's current space when adjacent
to the authored legal position; the direction is announced before the reveal; `moveTo` never
reveals. Tile placement/rotation come from the authored spike config (padding the corner-symbol
and ≥2-tile rules, §2.2). Turn phases (`turnStart → movement → action → endOfTurn`);
`endTurn` implements the T0 subset of the fixed end-of-turn pipeline **in order**: return/
expire mana → clear the play area (played cards to discard) → draw to hand limit; then round
end or turn advance. Turn-submission legality enforces [`02`](../research/02-rules-core.md)
§15.1 step 8 (at least one card played/discarded unless the hand was empty but the deck was
not; a Rest turn counts). Round end shuffles Wounds in hand back into the deed deck.

**Acceptance.**
1. `pnpm --filter @emberwold/engine test` includes table-driven movement-cost tests using the
   Day values (plains 2, hills 3, forest 3, wasteland 4, desert 5, swamp 5, lake/mountain
   impassable), loaded from content (S4.6 mutation test).
2. `pnpm trace:verify tools/golden-traces/010-move-reveal.json` exits 0; events include
   `heroMoved` and `tileRevealed`; `explore` consumes 2 Move and a plain `moveTo` reveals
   nothing (negative test).
3. Source dice and initial hand are reproducible from the seed (same seed → same values, two
   runs); mana tokens expire at end of turn (unit test).
4. Illegal moves (lake/mountain/too-far) and illegal explores (not adjacent to a legal
   position) are absent from legal actions and rejected with `notLegal`.
5. Rest and turn-submission legality: standard rest tested with a mixed hand, slow recovery
   with an all-Wound hand, and both end the turn legally; endTurn rejected when nothing was
   played/discarded and the hand was not empty.
6. Round loop: a two-round trace replays; the round cap ends the game; Wounds recycle at round
   end.

**Evidence:** trace summaries; event dump at final action.

---

### S7 — 4-phase combat and damage assignment

**Do.** `CombatState` sub-machine (rangedSiege → block → assignDamage → attack), entered by
`challengeRampaging` (attack the spawned rampaging token); enemies revealed, undo barrier
raised. Effect handlers for attack/block (melee/ranged/siege), element efficiency and
resistances, fortify (siege-only in the ranged phase), damage queue, wounds as Wound cards to
hero (armor 2, hand 5) and enemy defeat → fame, end combat. **Block rules per
[`02`](../research/02-rules-core.md) §7.3:** efficient blocks count at full value; inefficient
blocks are summed, halved (floor), then compared; a blocked enemy is set aside (not killed
until the attack phase); a failed block has no partial effect — the enemy attacks at full
strength; swift enemies require double block. Partial blocking (1 point per 2 block) is a
**PvP-only rule** ([`02`](../research/02-rules-core.md) §18.3) and is out of scope. Damage
assignment and combat math live in `combatMath.ts` as the single implementation.

**Acceptance.**
1. `pnpm --filter @emberwold/engine test` passes table-driven cases from [`02`](../research/02-rules-core.md)
   §7.3/§7.4: physical attack 4 vs efficient Block 4 → blocked; Fire attack 4 vs physical
   Block 5 → inefficient 5÷2=2 < 4 → block fails, 4 damage; swift attack 3 needs Block 6;
   Armor-3 target absorbs 3 damage and is wounded by 4+; resistance halves the relevant attack
   (rulebook integers, no publisher prose copied).
2. `pnpm trace:verify tools/golden-traces/020-combat.json` exits 0; the expected summary
   (wounds, defeated enemies, fame) matches the hand-computed `expectedOutcome`.
3. Fortify and swift are exercised by `enemy:diggers` and `enemy:wolf_riders`; a melee card in
   the ranged phase is not a legal action; the PvP partial-block path does not exist.
4. A dependency test (not a grep) shows the client imports `combatMath`/rules only from
   `engine`, so no rule arithmetic is duplicated in the UI.

**Evidence:** test list; trace summary + expected vs actual.

> This is the M2-1 fidelity waiver listed in §2.2: arithmetic verified against the rulebook
> numbers; the trace uses hand-computed spike-enemy values, because the walkthrough's example
> enemies do not match `game-data` stats (B4). Owner confirms via Q2.

---

### S8 — Village interaction, heal reward, end-to-end round trace

**Do.** `enterSite` at the village (no entry combat); interaction state: influence pool from
cards played this turn → `buyHealing` action priced from content
(`site.healing.influence_per_point = 3`); healing runs the wound-removal path; events
`siteEntered`, `influenceSpent`, `healGained`; leaving the site / ending turn resets
interaction state. Reputation value changes are applied (Threaten powered: −1) but reputation
**interaction modifiers** are out of scope. Record the end-to-end query: move → reveal →
assault → village heal → end turn in one trace.

**Acceptance.**
1. `pnpm trace:verify tools/golden-traces/030-site-heal.json` exits 0: play influence card →
   enter village → buy 1 healing point with 3 influence → the fixture's Wound card leaves hand
   and the expected state hash matches.
2. Buying healing with insufficient influence is not legal and is rejected with `notLegal`;
   interacting from a non-site hex is not legal.
3. `pnpm trace:verify tools/golden-traces/040-one-round.json` exits 0: the full G1.1/G1.2
   sequence (move, reveal, assault, heal, end turn) in one deterministic round, with
   `expectedOutcome` recording the final state (fame, wounds, round/turn).

**Evidence:** trace summaries; test names.

---

### S9 — Minimal SVG/DOM UI (G1-optional)

**Do.** `packages/client`: Vite + React app; title/new-run screen (optional seed input);
SVG hex board rendering tiles from state (authored origin/rotation; no rotate UI), DOM hand
(card **display name** from the content bundle, basic/powered/sideways buttons), legal-action
menu built **only** from `getLegalActions` (client contains zero rules), combat overlay (phase
rail, enemies, attack/block pools, assign buttons), event log, end-turn/round indicator.
Procedural placeholder art and the committed palette only. Add `ip.forbidden_terms` check over
`packages/client/src` + `packages/engine/src` (code/UI literals only; the data's scaffolding
names are exempt until the T1 re-theme, [`15`](./15-retheme-bible.md) §9/§10). Add Playwright
(`pnpm exec playwright install chromium`) and one spec.

**Acceptance.**
1. `pnpm dev` serves the app; `pnpm build && pnpm preview` serves the production build.
2. `pnpm test:e2e` drives one full round headlessly: play cards → move → explore → assault →
   village heal → end turn, with zero console errors and no illegal action ever offered
   (assert every control comes from the legal set).
3. **Fun pass rule:** owner + one unfamiliar player each play one 10-turn session (round loop)
   and answer two fixed questions ("what was confusing?" and "would you play 10 more turns?").
   G1.5 passes if **both** can complete 10 turns unaided and **at least one** answers "yes" to
   continuing; notes are anonymous (no personal data committed).
4. Forbidden-term check over code/UI sources passes (data exempt, documented).

**Evidence:** dev URL; Playwright output; anonymous checklist.

---

### S10 — Spike report, cleanup, G1 go/no-go with the owner

**Do.** Write `docs/design/spike-report.md`: what was easy/hard, the §2.2 deviation list
(restated), data defects (§11), the M2-1 waiver, revised T1 estimate against
[`12`](./12-architecture.md) §12.5, trace links, and a recommendation. Clean up: remove
tamper/test temp dirs and generated Playwright artifacts, decide keep-vs-discard for the spike
code with the owner, leave the branch merged or documented. Record the go/no-go decision as a
new ADR in [`00-decisions.md`](./00-decisions.md) (append-only) and update
[`14-roadmap.md`](./14-roadmap.md), `PROGRESS.md` and the doc indexes.

**Acceptance.**
1. Report committed with all internal links resolving to existing files.
2. G1 table (§1) filled with evidence links (traces, test commands, playtest notes) and a
   clear recommendation; deviations and the M2-1 waiver are listed.
3. **Go/no-go is decided with the owner**, recorded as ADR-010 (ADR-009 is the approval).
4. Cleanup verified: `git status --porcelain` empty, no untracked test artifacts, temp dirs
   gone, branch state documented.
5. Final pre-push scan for secrets/personal data on the whole diff.

**Evidence:** report path; ADR number; clean `git status`.

## 7. Determinism and trace contract (from [`12`](./12-architecture.md) §5.3/§7.4/§10.2)

* **RNG:** Mulberry32 with per-stream counters; algorithms and vectors fixed in S2. Only the
  engine consumes game RNG; bots/UI use a separate non-game RNG.
* **State hash:** canonical JSON + SHA-256 after every accepted action; hash appears in the
  replay log, traces and tests.
* **Trace fixture:** `{traceVersion, contentHash, engineVersion, rulesetId, seed, config,
  actions[], expectedHashes[], expectedOutcome}`; a deliberate rules fix regenerates traces and
  shows the hash diff in the PR (never "regenerate to make CI green").
* **Determinism test:** replay the same action log twice, in two processes, and compare every
  hash from S2 onward; any divergence is a P0.
* **Termination:** fuzz asserts every game ends within `roundCap × maxTurnsPerRound`; a
  non-terminating game is a P0.

## 8. Schedule, checkpoints, cut order

| Working day | Deliverable |
|---|---|
| D1 | S1 approval bookkeeping + scaffold + CI green |
| D2 | S2 shared vectors/hash green |
| D3–D4 | S3 reducer skeleton green; S4 thin bundle + content hash green |
| D5 | S5 traces/CLI/fuzz green — **checkpoint C1: headless round loop replays deterministically** |
| D6 | S6 round loop + movement/explore/rest traces |
| D7–D8 | S7 combat — **checkpoint C2 (end D8): assault trace green**; S8 village + full-round trace |
| D9–D10 | S9 UI + Playwright + human 10-turn sessions; S10 report + go/no-go — **checkpoint C3** |

**If behind at a checkpoint, cut in this order** ([`12`](./12-architecture.md) §12.3
principle: never cut determinism or tests): (1) Playwright → manual checklist only; (2) drop
the browser UI entirely and let G1 pass on the CLI plus the JSON event log (allowed by
[`14`](./14-roadmap.md) M1 exit; Q14); (3) fuzz budget 1,000 → 200 turns; (4) enemy ability
keywords beyond fortified/swift. **Do not cut** the state hash, trace replay, unit tests, or
the assault/site/full-round traces.

**Stop/re-scope trigger (pre-committed, [`14`](./14-roadmap.md) §6):** if C2 is still failing
its core trace at end of D8 — combat does not resolve, or traces cannot replay
deterministically — stop feature work, write the report with the blocker, and re-scope T0.5
with the owner rather than pushing on.

## 9. Testing and CI gates (scaled from [`12`](./12-architecture.md) §10)

| Gate | T0 target | Where |
|---|---|---|
| Unit tests | ≥ 80 tests across shared/engine/content; every effect handler in the 16-card deck has happy-path + sideway/powered tests | PR + CI |
| Golden traces | ≥ 4: smoke, move+reveal+rest, combat, site heal; plus the end-to-end round trace | PR + CI |
| Property tests | totality, no-illegals, determinism, serialization, actionEpoch/stale-action guard — 5 properties × ≥ 100 cases | PR + CI |
| Fuzz | ≥ 1,000 turns random-legal, 0 invariant failures, termination asserted | CI job |
| Content validation | Python validator (subprocess, single gate) + bundle rebuild diff | PR + CI |
| E2E | 1 Playwright one-round spec (droppable — Q14) | PR + CI |
| Boundaries | dependency rules (engine imports; client imports engine math only) | CI |
| Clean room | `ip.forbidden_terms` over code/UI sources (data exempt, documented) | CI |

## 10. Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| K1 | The 16-card deck needs the full **16-op** effect surface (`choice`, `compound`, `discard_cost`, `apply_modifier`, `rule_override`, `mana_draw_powered`…), not just "simple" cards | S3 builds the registry ordered by the first trace; if an op threatens the schedule, record it and cut the *card* only with owner approval — never fake it |
| K2 | UI eats the schedule | SVG/DOM, no animation, no art; UI is G1-optional (Q14) and Playwright is the first cut |
| K3 | Data is `upstream-only` for tiles/enemies and two starter cards are placeholder | T0 proves the seam, not fidelity; report lists provenance limits; traces record it |
| K4 | Determinism drift (iteration order, floats, ambient time) | canonical hash from S2, integer-only game values, `no-restricted-imports`, dual-process replay test |
| K5 | Map/explore rules are simplified for a 2-tile map | waiver listed in §2.2; authored placement in one config file; report restates it |
| K6 | Public repo/CI exposure | no secrets in any step; pre-push scan (S1.7); branch strategy + code licence question Q9 |
| K7 | Data conflicts (night terrain costs, B3) | T0 is Day-only; Day values agree across sources; report lists the night mismatch for T1 |

## 11. Data findings to report (not fixed in T0)

Found while planning; each becomes a line in the spike report and a T1 data task. **No
`game-data/` edits in T0** ([`AGENTS.md`](../../AGENTS.md) §4,
[`12`](./12-architecture.md) §6.4).

| # | Finding | Impact on T0 |
|---|---|---|
| B1 | [`game-data/basic-actions.json`](../../game-data/basic-actions.json) → `deck_composition.standard_deck` uses double-prefixed ids (`basic:basic:rage`) that match no item; the validator does not check this field | None — decks compile from `heroes.json → starting_deck` (valid). Flag for a validator check + data fix |
| B2 | Tile `rampaging` values are upstream token names (e.g. `orc_marauder`); no matching `enemy:` definition exists in [`game-data/enemies.json`](../../game-data/enemies.json) | None — spike spawns are authored in `spike.config.json`; tile rampaging refs need a T1 data pass |
| B3 | Night terrain costs differ: [`02` §5.1](../research/02-rules-core.md) (only forest/desert differ at night) vs `keywords.json → rules_constants` (plains 2/3, hills 3/4, wasteland 4/5) | None — T0 is Day-only and **Day values agree**; T1 must reconcile against the board |
| B4 | `tiles`/`enemies` are `status: placeholder`, `confidence: upstream-only`; 2 of the 12 starter-card defs are `placeholder` (`basic:goldyx_crystal_joy`, `basic:goldyx_will_focus`); walkthrough example enemies do not match data (e.g. golems Armor 5 vs 3) | Combat arithmetic is verified in unit tests; trace expectations are hand-computed, not "official"; M2-1 waiver §2.2 |
| B5 | `scenario:first-conquest` has `layout_status: "todo"` (no authored placement/site seeding) | T0 uses its own 2-tile placement; T1 authors the real 4-tile layout (Lead decision) |
| B6 | No `.github/` workflows exist; first CI run needs a push (owner controls branch strategy) | S1 creates the workflow; first green run recorded in the report |
| B7 | No **Wound card** definition exists in `game-data` (`basic-actions.json` has no Wound item, yet Wounds are a card type required by combat/rest rules) | T0 synthesises the rules-defined Wound card in the spike content (no effect, unplayable, no sideways value; [`02`](../research/02-rules-core.md) §14.1); T1 adds a card domain + validator coverage |
| B8 | `manifest.json` stores 16-hex **prefixes** of file SHA-256, not full digests | S4 verifies prefixes against actual files and hashes full bytes for `contentHash`; no data change |
| B9 | Doc drift: [`12`](./12-architecture.md) §4.1/§4.3 still show a Pixi board while ADR-003/[`17`](./17-platform-analysis.md) §5 say SVG/DOM-first; G1 card count says "20" in [`10`](./10-feasibility-analysis.md) §9/[`12`](./12-architecture.md) §12.6 but "16" in [`11`](./11-mvp-scope.md) §3/[`14`](./14-roadmap.md) §5 | Plan follows ADR-003 and proposes 16 (Q10); docs to reconcile in a T1 doc pass |

## 12. Questions for the owner (approval bundle)

Q1. **P5: lift the pre-implementation hold** for T0 exactly as scoped here? (If not, nothing in
   §6 starts.)
Q2. Accept the **spike simplifications** in §2.2 — especially player-turns-only Day rounds (no
   tactics/dummy), no skills/levels/spells/units/save-undo, the map-placement waiver, and the
   **M2-1 combat-fidelity waiver**? They are restored in T1.
Q3. **Hero for the spike:** `hero:goldyx` (proposed: 12 defs, 16 ops) or `hero:arythea`
   (13 defs, 17 ops)?
Q4. Accept the **spike map**: `tile:starting_a` + `tile:countryside_1`, village at the printed
   village hex, two authored spawns (`prowlers`, `diggers`)?
Q5. Accept the **enemy trio** (prowlers / diggers / wolf_riders) as the 3 definitions?
Q6. **Branch strategy for public code:** work on `main` directly, or on a `t0-spike` branch
   with a PR at the end (recommended: branch + PR so CI and review happen before merge)?
Q7. Demo cadence: short demo at C1 (headless round), C2 (assault), C3 (playable round) — or
   only at C3?
Q8. The plan boxes ~9.25 dev-days inside the 2-week T0; if C1 slips by more than one day, do
   you want a re-scope check then rather than at C2?
Q9. **Publishing code:** T0 would put TypeScript code in the public repo, which currently has
   no `LICENSE` and describes contents as "internal research use" ([`README.md`](../../README.md)
   §Licence). Push a `t0-spike` branch/PR publicly, or keep code local until a licence decision?
Q10. **G1 card count:** G1 says "20 cards"; the rules-fixed starting deck is 16 instances
    (12 unique defs). Accept 16, or widen the spike content to ~20 definitions (more time)?
Q11. **Presentation names:** may the T0 UI render the data's current names as local scaffolding
    (re-theme is a release gate, [`15`](./15-retheme-bible.md) §10), or should T0 show only
    neutral placeholder labels from a presentation map?
Q12. **Generated bundle:** commit `packages/content` output (architecture [`12`](./12-architecture.md)
    §4.3 convention) or emit it as a build artifact only ([`AGENTS.md`](../../AGENTS.md) §6
    bans generated artifacts)?
Q13. **Spike selection location:** `tools/content-compiler/spike.config.json` (proposed, keeps
    `game-data/` untouched) or `game-data` `mvp: true` markers (as [`14`](./14-roadmap.md)
    M1-5 says; requires a data change + validator pass)?
Q14. **Is the browser UI required for G1?** [`14`](./14-roadmap.md) M1 exit accepts a CLI; the
    UI is §M2. Dropping S9 gives a ~7-step spike and more slack.

## 13. Review record

Two independent fresh-context reviewers read a mid-edit revision of this plan. Verified and
fixed: 16-op list (was 17; `gain_healing` not `gain_heal`; `card_boost` unused by Goldyx),
12 defs/16 instances (was "16 definitions"), G1 20-vs-16 card conflict (now Q10), explore as a
separate 2-Move action with placement waiver (was a `moveTo` side effect), block rules per
[`02`](../research/02-rules-core.md) §7.3 with PvP partial-block removed, slow recovery added
(wound-only-hand deadlock), `buyHealing` in the action list, Python-validator-as-single-gate
(no duplicate Zod rules pass), content-hash from full bytes, trace `engineVersion`/`rulesetId`,
fuzz termination, generated-artifact and spike-selection owner questions (Q12/Q13), approval
bookkeeping moved to the first commit, `.nvmrc`, pre-push secret scan, cleanup step, and the
presentation/forbidden-term boundary. Reviewer suggestions **not** adopted: dropping the
browser UI outright (kept as G1-optional with Q14), and merging all steps into ~6 (each step
stays a small commit series; the plan remains 10 steps for reviewability).

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

| Domain | IDs / values |
|---|---|
| Hero | `hero:goldyx` (fallback `hero:arythea`) |
| Cards | the hero's 16 starting-deck instances from `heroes.json → starting_deck` (12 unique defs; all resolve) |
| Tiles | `tile:starting_a`, `tile:countryside_1` |
| Enemies | `enemy:prowlers` (no ability), `enemy:diggers` (fortified), `enemy:wolf_riders` (swift) |
| Site | `site:village` (healing 3 influence/point; no entry combat) |
| Wound card | rules-defined synthetic def (no effect, unplayable, no sideways value; [`02`](../research/02-rules-core.md) §14.1), added to `game-data` in the T1 data pass (B7) |
| Rules constants | `game-data/keywords.json → rules_constants`: hand 5, deed deck 16, armor 2, hero hand limit 5, terrain Day costs, tile reveal cost 2 |
| Round/game cap | spike config: 10 Day rounds, no night (Q2 simplification) |
| Tiles placement / spawns | authored in `tools/content-compiler/spike.config.json` (design decision, reviewable in one file) |

The starting deck includes the two hero-specific cards `basic:goldyx_crystal_joy` and
`basic:goldyx_will_focus` (both `placeholder` confidence — B4).

## Appendix C — Command conventions

```bash
# from the repo root; host PATH toolchain
pnpm install && pnpm verify
pnpm content:build && pnpm content:check
pnpm trace:verify tools/golden-traces/000-smoke.json
pnpm fuzz --turns 1000 --seed 1
pnpm test:e2e

# data validator: local uses the venv; CI uses system python3 (stdlib only)
.venv/bin/python tools/validate_data.py
python3 tools/validate_data.py
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
* [`12-architecture.md`](./12-architecture.md) §3.3, §5, §6, §7, §10, §12.4, §12.6 — stack,
  engine contract, content pipeline, persistence/traces, tests, T0 slice, T0-done.
* [`14-roadmap.md`](./14-roadmap.md) §0.1, §1 (M1–M2), §5, §6 — tiers, milestones, task list,
  kill criteria.
* [`15-retheme-bible.md`](./15-retheme-bible.md) §9/§10 — data & code policy, clean-room
  boundary.
* [`17-platform-analysis.md`](./17-platform-analysis.md) §5 — concrete stack.
* [`game-data/README.md`](../../game-data/README.md) §2, §3.5, §5–§6 — data layout, MVP
  markers, provenance, coverage.
* Local only (gitignored): `reference/extracted/MKUE_rulebook.txt`,
  `reference/extracted/MKUE_walkthrough.txt` — sources for the combat/movement numbers cited
  in S6/S7; no publisher text is committed.
