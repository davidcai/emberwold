# T0 Spike Report — playable round, deterministic traces, G1 evidence

**Date:** 2026-10-31 (execution started after ADR-009; report closes S10 of
[`19-t0-spike-plan.md`](./19-t0-spike-plan.md))
**Branch:** `t0-spike` (15 commits from `main` baseline; CI green)
**Verdict:** **GO for T1 engineering**, with two owner confirmations outstanding: the S9
10-turn fun pass (G1.5) and sign-off on the spike deviations listed in §6. Those are owner
actions, not engineering blockers; ADR-010 records the provisional decision.

## 1. Result at a glance

The T0 vertical slice is built and verified: a single Day round of the rules core is playable
headlessly and in a browser — movement, tile reveal, 4-phase assault, combat arithmetic,
village influence → healing, rest, and the end-turn/round loop — on one hero, two tiles, three
enemies and one site. Every action sequence replays bit-for-bit from a trace, and the browser
client offers only engine-provided legal actions.

| Gate | Result |
|---|---|
| G1.1 one full round on 2 tiles with the 16-card deck | ✅ trace `040-one-round.json` + CLI (`pnpm play`) |
| G1.2 movement, reveal, assault, site interaction resolve | ✅ traces `010`/`020`/`030` + 31 engine unit tests |
| G1.3 deterministic replay (seed + action log → hashes) | ✅ `pnpm traces:check`, 6/6 traces |
| G1.4 no crashes, no illegal action offered | ✅ 1,000-action fuzz (0 failures), Playwright UI spec, invariants |
| G1.5 "fun enough to continue" | ⏳ owner + one unfamiliar player (S9 acceptance 3), notes anonymous |

## 2. What was built

| Area | Deliverable | Where |
|---|---|---|
| Shared primitives | Branded IDs, 6-stream salted Mulberry32, dependency-free SHA-256, canonical JSON + state hash | [`packages/shared`](../../packages/shared) |
| Engine | Pure reducer with epoch guard, 17-op effect interpreter, mana payment, movement/explore, 4-phase combat, sites, wounds/rest, round loop, invariants | [`packages/engine`](../../packages/engine/src/engine.ts) |
| Content pipeline | `game-data/` → typed bundle; Python validator is the single gate; manifest-prefix check; compiler config enters `contentHash` | [`tools/content-compiler`](../../tools/content-compiler/src/main.ts), bundle `contentHash cfcf9db2…f122` |
| Traces / CLI / fuzz | record + batch verify, `play-cli`, random-legal bot | [`tools/golden-traces`](../../tools/golden-traces), [`tools/play-cli`](../../tools/play-cli) |
| Minimal UI | Vite + React + SVG board, DOM hand, legal-action menus from `getLegalActions`, combat rail, event log, seed/new run | [`packages/client`](../../packages/client/src/App.tsx) |
| E2E | Playwright spec drives the real UI through reveal → assault → village heal → end turn, never clicking outside the legal set | [`e2e/ui.spec.ts`](../../e2e/ui.spec.ts) |
| Clean room | Single forbidden-term list + source scan | [`packages/content/src/forbidden-terms.json`](../../packages/content/src/forbidden-terms.json) |
| CI | `pnpm verify` (typecheck, lint, 58 tests, boundaries, 6 traces) + 1,000-action fuzz + validator | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |

Spike content: 16 deck instances / 12 card defs + synthetic Wound / 2 tiles / 3 enemies /
2 sites (village, portal), selected by [`tools/content-compiler/spike.config.json`](../../tools/content-compiler/spike.config.json)
without editing `game-data/`.

## 3. Evidence (commands and links)

| Check | Command | Observed |
|---|---|---|
| Full local gate | `pnpm verify` | exit 0; 58/58 tests, 0 lint/boundary errors, 6/6 traces verified |
| Golden traces | `pnpm traces:check` | `000-smoke` (44 actions, round 10, game over), `010-move-reveal` (4), `015-rest` (2), `020-combat` (19, 2 wounds, 1 defeat, +2 fame), `030-site-heal` (32), `040-one-round` (34, heal then end turn) |
| Fuzz | `pnpm fuzz --turns=1000 --seed=1` | 23 games, 1,000 actions, 0 invariant failures, 0 termination violations |
| Data validator | `.venv/bin/python tools/validate_data.py` | 9,662 checks, 0 errors, 0 warnings (`game-data/` untouched) |
| Content reproducibility | `pnpm content:check` | build + `git diff --exit-code` clean |
| UI | `pnpm test:e2e` | 1/1 passed; events `heroMoved → tileRevealed → combatStarted → siteEntered → healGained → turnEnded`; zero console errors |
| Production build | `pnpm build` / `pnpm preview` | 258 kB JS (80.5 kB gzip); preview HTTP 200 and serves the built assets |
| CI | GitHub Actions | green runs as of `44f46ba` ([run 41271820582](https://github.com/davidcai/emberwold/actions/runs/41271820582)); fuzz + trace steps added for this report |

Traces are self-describing (`contentHash`, `engineVersion`, `rulesetId`, per-action state
hashes, expected outcome). A changed compiler config or bundle invalidates every trace by
design — verified in S6 when the authored map moved to `origin 2,1`.

## 4. Test-suite status vs the plan's gate

The plan's §9 target was **≥ 80 unit tests** plus 5 property tests × ≥ 100 cases. Delivered:
**58 unit tests** (shared 11, engine 31, content 3, compiler 1, plus UI/e2e coverage) and a
1,000-action fuzz + trace-hash determinism instead of a separate property-test harness. Every
effect op used by the 16-card deck has handler coverage and every combat formula has table
tests; the shortfall is width (more card/edge cases), not a known correctness gap. Recorded as
T1 test-debt, not a G1 blocker.

## 5. What was easy, what was hard

**Easy (reusable foundation):** scaffold + CI (`453f1d6`), shared primitives with fixed vectors,
trace record/verify, content compiler. The rules research paid off: the effect-op vocabulary and
combat arithmetic tables mapped almost directly to code, and the Python validator being the only
data gate kept the pipeline small.

**Hard / where the schedule actually went:**

1. **Content bundle ↔ traces coupling.** Hashing the compiler config was the right call: the
   first authored map placed `countryside` at `(2,0)`, overlapping the start tile, which made
   explore legal from turn one. The bug surfaced as a trace failure, not in play — deterministic
   traces were the cheapest debugger in the project.
2. **Wounds across the round boundary (deviation).** The rules recycle wounds at round end; T0
   keeps them so a multi-turn "wound → travel → heal" sequence is testable. T1 must restore the
   rule and re-record the heal traces (`02` §15.2).
3. **Test policy vs game policy.** The Playwright failure that cost the most time was the
   scripted policy re-challenging an enemy it could not kill; the engine was correct. Lesson:
   compute a goal state (wounded → walk to village) rather than encode local rules in the test.
4. **Tooling friction, not game friction:** pnpm 12 blocks esbuild's postinstall without
   `allowBuilds`; Prettier reflowing the generated bundle broke `content:check`; both fixed in
   small follow-up commits.

## 6. Deviations and waivers (must reappear in the T1 plan)

These were approved in the plan's §2.2/§12 bundle; restated here for the record:

1. **Wound persistence** across turn/round boundaries (T1 restores round-end recycling).
2. **Combat fidelity waiver (M2-1):** the rulebook worked example's enemies do not exist in
   `game-data` with matching stats (B4), so combat *arithmetic* is verified against rulebook
   numbers in unit tests and the assault trace uses hand-computed spike values. The trace does
   not claim to reproduce the rulebook example.
3. **Map rules waived for the single authored reveal:** rotation/corner matching and the
   ≥2-tile placement restriction (only one tile exists at reveal time); explore remains a
   separate 2-Move action.
4. **No dummy player / no tactics / Day-only** rounds; round counter advances once per turn.
5. **Wound card synthesised** in the spike bundle (no `game-data` definition, B7).
6. **Spike selection lives in `spike.config.json`**, not `game-data` `mvp: true` (Q13).
7. **16 cards, not "20"** in the G1 prose: the starting deck is rules-fixed at 16 instances
   from 12 definitions (Q10); docs to be reconciled in a T1 pass.
8. **Committed generated bundle** (Q12) so CI and traces are reproducible without running the
   compiler first.

## 7. Data findings for T1 (no `game-data/` edits in T0)

B1 `deck_composition.standard_deck` ids are double-prefixed and unvalidated → add a validator
check + fix. B2 tile `rampaging` values reference names with no `enemy:` definition → author the
enemy pool for T1 tiles. B3 night terrain costs conflict between `02` §5.1 and
`keywords.json`/`rules_constants` → reconcile when night rounds land (T1). B4 tiles/enemies are
`upstream-only` placeholder data and two starter-card defs are placeholders → re-derive from
primary sources before any public build. B5 `scenario:first-conquest` has no authored layout →
T1 authors the 4-tile layout. B6 first CI workflow created in T0 (done). B7 no Wound card in
`game-data` → add a card domain + validator coverage. B8 `manifest.json` uses 16-hex SHA-256
prefixes → keep prefix verification, consider full digests when the data pass runs. B9 stale
doc drift (Pixi mentions, G1 "20 cards") → T1 doc pass.

## 8. Estimates

T0 was planned at ~2 engineer-weeks ([`12-architecture.md`](./12-architecture.md) §12.5). It
was executed end-to-end in one autonomous agent session, so the useful signal is not the
calendar delta but the **risk movement**: the deterministic engine seam, content pipeline, trace
harness and legal-action UI are now proven, which retires the biggest engineering unknowns
(canonical state, effect interpreter, combat arithmetic, pipeline reproducibility).

The T1 increment is still best estimated at **9–13 engineer-weeks** for First Conquest v1
([`12`](./12-architecture.md) §12.5), with the risk now concentrated in content breadth (≈40 card
defs, city, skills/level-up), save/undo and UI legibility — not in the engine seam. The T0 spike
contained ~2 ew of engine+tooling that T1 reuses.

## 9. Cleanup and branch state

* `git status --porcelain` clean after this report's commit; no untracked test artifacts
  (`playwright-report/`, `test-results/`, `dist/` are gitignored).
* Temp dirs used during the spike (`/tmp/e2e*`, `/tmp/handoff-verify`) are outside the repo and
  disposable; no test fixtures were added to git.
* Branch `t0-spike` is pushed and CI-green; it contains only T0 code, docs and generated
  content. Keep it (recommended) and merge after the owner's fun pass; `main` remains the
  research/docs baseline until then.
* Pre-push secret scan: diff contains no credentials, personal data or third-party content
  (pure code, docs, generated JSON).

## 10. Recommendation and owner actions

**Recommendation: GO to T1 (First Conquest core loop).** Evidence supports the rules/UI seam,
determinism and pipeline; no stop/re-scope trigger fired at C2. The M2 kill criterion is not
testable by the agent, so:

1. **Owner, ~15 minutes:** play 10 turns (browser or CLI) and answer the two fixed S9
   questions ("what was confusing?", "would you play 10 more turns?"). If either of you cannot
   finish 10 turns unaided, invoke the roadmap's stop/re-scope rule (`14` §1 M2, §6).
2. **Owner, sign-off:** confirm the deviations in §6 (especially wound persistence and the
   M2-1 combat waiver) and merge `t0-spike` (or ask for changes).
3. **Then T1 starts** with the First Conquest milestone list (`14` §1 M3–M4), beginning with
   day/night + dummy-player round loop and save/undo (highest-risk T1 items).

## 11. Links

* Plan and evidence log: [`19-t0-spike-plan.md`](./19-t0-spike-plan.md)
* Decision record: [`00-decisions.md`](./00-decisions.md) ADR-010
* Roadmap and T1 scope: [`14-roadmap.md`](./14-roadmap.md), [`11-mvp-scope.md`](./11-mvp-scope.md)
* Architecture and determinism contract: [`12-architecture.md`](./12-architecture.md) §5/§10
* Rules deviations: [`02-rules-core.md`](../research/02-rules-core.md) §7.3/§15.2
* Data findings: [`19`](./19-t0-spike-plan.md) §11 (B1–B9)
