# PROGRESS — Emberwold handoff

> **Temporary session handoff.** Delete this file once the goal's acceptance check passes.
> Fresh context: read this file and `git log -5`, run the baseline checks in **Done** item 1,
> then do the first item in **Next** (execute plan steps S1–S10 in order, branch `t0-spike`).

## Goal

Deliver the **T0 spike** so gate **G1** passes: one full round playable (movement → reveal →
assault → reward → end turn), a deterministic trace replay, and no crashes; then write the
spike report and decide go/no-go with the owner. Acceptance: G1 in
`docs/design/10-feasibility-analysis.md` §9 and the M2 exit in `docs/design/14-roadmap.md` §1.
**Approved 2026-10-31 (ADR-009, P5 decided)**; execution follows
`docs/design/19-t0-spike-plan.md` on branch `t0-spike`.

## Done (verified 2026-10-31)

1. Pre-production package (research, rules, legal, design, `game-data/`, tooling) is committed
   on `main`. Baseline check: `git status -sb` → clean `## main...origin/main`; `git log --oneline -1`
   shows the commit that added this file. Do not pin a hash here — confirm with git.
2. Data validator green. `.venv/bin/python tools/validate_data.py` →
   `checks: 9662  errors: 0  warnings: 0` / `RESULT: OK`.
3. Art complete: 40 slot WebP + 12 icon WebP = 52 files (4.3 MB). The 12 icons are
   `icon_ref` derivatives, not extra slots;
   `git ls-files 'art/**/*.webp' | wc -l` → 52; `art/manifest.json` has 40 art slots `final`.
4. Wordmark committed with **ADR-008**. `xmllint --noout art/branding/*.svg` → exit 0;
   manifest `logo` → `art/branding/logo.svg`, status `final`; `git show --stat 419bdb5`.
5. Local-only art (181.8 MB: sources + PNG masters + style refs) is backed up at
   `~/dev/backup/emberwold/emberwold-local-art-2026-10-31.tar.gz` (175,796,673 B,
   sha256 `31c21825d9caed2113ffa224927715a14a57ffea6f9099e3e9b1ab69fae5a0fe`); `/tmp` copies deleted.
6. Tree clean and synced: `main` = `origin/main` (confirm with `git status -sb`).
7. Fresh-context verifier reproduced every baseline check (all PASS) and caught the earlier
   stale HEAD claim, now fixed; its only remaining blocker is owner approval for T0.
8. **T0 spike plan approved and reviewed** (`docs/design/19-t0-spike-plan.md`, v4): 10 steps
   with a command/observation acceptance check each, scope fence + spike-simplification list,
   data findings B1–B9, golden RNG/hash vectors. Two fresh-context reviewers checked it; verified
   blockers fixed (§13 review record). Owner approved 2026-10-31 (**ADR-009**, P5 decided).
9. **S1 done — pnpm monorepo + CI** (branch `t0-spike`, commit `453f1d6`): workspace
   `packages/{shared,engine,content,client}` + `tools/{content-compiler,golden-traces,play-cli}`,
   strict TS, ESLint/Prettier, Vitest, dependency-cruiser boundaries, GitHub Actions CI
   (`pnpm verify` + stdlib Python validator). Evidence: `pnpm verify` → 7/7 tests, 0 lint/boundary
   errors; `pnpm install --frozen-lockfile` ok; `python3 tools/validate_data.py` → `RESULT: OK`;
   CI run https://github.com/davidcai/emberwold/actions/runs/41265608826 green. `game-data/`
   untouched; validator still `9662 / 0 / 0`.
10. **S2 done — shared primitives** (commit `db25ee6`): branded IDs + `Hex`/`hexKey`,
    Mulberry32 with six salted streams and pure `nextU32`, dependency-free sync SHA-256,
    canonical sorted-key JSON + `hashState`. Evidence: `pnpm --filter @emberwold/shared test`
    → 22/22 (Appendix A RNG vectors, SHA-256 vectors incl. `emberwold`, stream independence);
    `pnpm verify` → 29/29 tests, 0 lint/boundary errors; Prettier clean.
11. **S3 done — engine core** (commit `1716ec2`): `GameState`/`Action`/`GameEvent` types,
    pure reducer with epoch guard, card effects + mana payment, choice/discard pendings,
    standard + slow Recovery rest, movement/explore hooks, 4-phase combat state machine,
    village healing, round loop and invariant checks; `combatMath.ts` is the single combat
    arithmetic implementation. Evidence: `pnpm --filter @emberwold/engine test` → 13/13;
    `pnpm verify` → 40/40 tests, 0 lint/boundary errors.
12. **S4 done — content compiler + spike bundle** (commit on `t0-spike`): `tools/content-compiler`
    (read-only `game-data`, Python validator as the single gate, manifest-prefix verification,
    full-byte content hash, op→handler coverage check) emits `packages/content` bundle:
    16 deck instances / 12 card defs + synthetic Wound / 2 tiles / 3 enemies / village + portal;
    `contentHash 1d76a028...faa3`; `pnpm content:check` clean; tamper/op failures demonstrated;
    engine mutation test proves costs load from the bundle. `game-data/` untouched.
13. **S5 done — C1 passed** (commit `4a9f148`): trace record/verify CLIs, interactive +
    `--random` play-cli, fuzz harness; `000-smoke.json` (52 actions) replays; tampered trace
    rejected; fuzz 1,000 actions over 24 games with 0 invariant/termination failures.
    **Checkpoint C1: headless round loop replays deterministically.**
14. **S6 done — movement/explore/round loop** (commit on `t0-spike`): engine tests cover the
    Day-cost table, explore as its own 2-Move action, negative move/reveal cases, mana expiry,
    round advance and wound recycle (19 engine tests). Authored map fixed: countryside at
    origin `2,1` (the old placement overlapped the starting tile); compiler now rejects
    overlapping tile placements and hashes its config into `contentHash`
    (`cfcf9db2…f122`). `010-move-reveal.json` replays with `heroMoved`+`tileRevealed`;
    `000-smoke.json` re-recorded (44 actions).
15. **S7 done — combat (C2)** (commit on `t0-spike`): `combatMath.test.ts` covers the 02 §7.3
    efficiency matrix, inefficient halving, swift, fortify, resistance, brutal, wounds (engine
    suite now 31 tests); `020-combat.json` (seed 3, 19 actions) replays with 2 wounds, 1 enemy
    defeated, +2 fame.
16. **S8 done — village heal + end-to-end trace (C2 passed)** (commit on `t0-spike`):
    `030-site-heal.json` (32 actions: reveal → combat wound → travel → enterSite → 3 influence →
    heal) and `040-one-round.json` (34 actions: same then end turn after the heal). All five
    traces verify; `pnpm verify` 57 tests; fuzz 1,000 actions clean. **Checkpoint C2 passed.**
    T0 deviation documented: wounds persist across turns (T1 restores round-end recycling).

## Next (ordered; first item is the exact next action)

Execute the approved plan's remaining steps on branch `t0-spike`, recording each step's evidence
line in `docs/design/19-t0-spike-plan.md` before moving on. Stop at the plan's checkpoints/cut
order; at C3 write `docs/design/spike-report.md` and decide go/no-go with the owner.

1. **S6 — movement/explore/rest/end-turn traces**, then S7 combat and S8 village + full-round;
   checkpoint C2 = assault trace green (plan S6–S8 acceptance lines).
2. Then S6 movement/explore/rest/end-turn, S7 combat, S8 village+full-round, S9 UI, S10 report —
   in plan order with their acceptance checks.
3. Push `t0-spike` after each step; open the PR when S10 is done (or ask the owner earlier).

## Open questions

1. **Q14 (owner):** is the browser UI required for G1? Plan default is to include S9; if time is
   short it can be cut and G1 passes on the CLI (plan §8 cut order).
2. Public branding still gated by ADR-007/008: run the `15` §11 name screen before any public
   wordmark use.
3. The 181.8 MB archive is on the same disk as the repo; an off-machine copy (iCloud/external)
   is still manual.
4. Whether full-resolution PNG masters should ever be tracked in git (currently local-only).

## Key facts

- Repo: `~/dev/emberwold`; public remote `davidcai/emberwold`; **work branch `t0-spike`** (pushed
  after each step; PR at the end), `main` stays the pre-spike baseline.
- History: ADR-009 approval commit is `453f1d6`; do not trust a pinned hash for "current HEAD" —
  run `git log --oneline -1` and `git status -sb`.
- Toolchain: Node 24.22.1, pnpm 12.15.0 (pinned in `package.json`); `pnpm verify` = typecheck +
  lint + tests + dependency boundaries; `pnpm test` alone; data validator
  `.venv/bin/python tools/validate_data.py` (local) / `python3 tools/validate_data.py` (CI, stdlib).
- Source of truth docs: `docs/design/00-decisions.md` (**ADR-001…009**); T0 plan and steps in
  `docs/design/19-t0-spike-plan.md`; G1 in `10-feasibility-analysis.md` §9; MVP scope in
  `11-mvp-scope.md`; architecture in `12-architecture.md`.
- Art packaging: committed = WebP q90 at ≥2× display size (`art/*/*.webp`); full-res PNG masters
  are local-only (`art/<category>/*.png` ignored); wordmark in `art/branding/` is tracked; no font
  binaries are committed or embedded.
- Image generation is owner-run in the ChatGPT desktop app; the agent never generates images.
- Gotchas: (a) the harness sandbox blocks writes outside the workspace — iCloud/backup copies need
  approval or a manual step; (b) fontTools C extensions fail on this host (pure-Python works after
  deleting the `.so` files); (c) `qlmanage` is sandbox-blocked — rasterise SVG with `sips` (Chrome
  headless as fallback); (d) PNGs are large: 2× masters ≈87.6 MB, sources ≈85.3 MB.
- Failed approaches (do not repeat): colour-key matting for cut-outs destroyed armour/highlight
  colours — use macOS Vision foreground matting; committing 2× PNG masters was rejected for repo
  size; `qlmanage` SVG rasterisation is blocked.
- Public-repo rules: no secrets, no publisher rulebook/art, `reference/` stays local, decisions are
  append-only (new ADR, never rewrite old ones).
