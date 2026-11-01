# PROGRESS — Emberwold handoff

> **Temporary session handoff.** Delete this file once the goal's acceptance check passes.
> Fresh context: read this file and `git log -5`, run the baseline checks in **Done** item 1,
> then do the first item in **Next** (it is an owner-approval gate — do not write code first).

## Goal

On owner approval, deliver the **T0 spike** so gate **G1** passes: one full round playable
(movement → reveal → assault → reward → end turn), a deterministic trace replay, and no crashes;
then write the spike report and decide go/no-go. Acceptance: G1 in
`docs/design/10-feasibility-analysis.md` §9 and the M2 exit in `docs/design/14-roadmap.md` §1.
Blocked until the owner lifts the pre-implementation hold (`AGENTS.md` §2).

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
8. **T0 spike plan written and reviewed** (`docs/design/19-t0-spike-plan.md`, draft v4): 10
   steps with a command/observation acceptance check each, scope fence + spike-simplification
   list, data findings B1–B9, golden RNG/hash vectors (independently derived and cross-checked),
   and a fixed 2-week box. Two fresh-context reviewers checked it; their verified blockers
   (op/def counts, G1 card count, explore action, block rules, presentation boundary) are
   fixed — see the plan's §13 review record. Wired into `README.md`, `docs/README.md` and
   `14-roadmap.md` §5. **No code written**; validator still `9662 / 0 / 0`; hold in force.

## Next (ordered; first item is the exact next action)

1. **Owner decision on P5 — approve the T0 plan and lift the pre-implementation hold.** Read
   `docs/design/19-t0-spike-plan.md` §2 (scope + simplifications), §6 (steps), §12 (questions).
   Default while unanswered: stay pre-implementation (`AGENTS.md` §2).
2. **If approved:** execute the plan's steps S1–S10 in order, recording the evidence line for
   each step; stop at its checkpoints/cut order and write `docs/design/spike-report.md` + the
   go/no-go ADR. The old M1-1…M2-4 milestone labels map to S1–S10 (S1 = M1-1 scaffold).
3. If the owner wants no code yet: the plan is the deliverable; do not start S1.

## Open questions

1. **T0 approval** — blocking. The plan is written and twice reviewed against the source docs;
   approval means P5 + the §2.2 simplifications + the §12 owner questions in
   `docs/design/19-t0-spike-plan.md`. Default while unanswered: stay pre-implementation.
2. Public branding still gated by ADR-007/008: run the `15` §11 name screen before any public
   wordmark use.
3. The 181.8 MB archive is on the same disk as the repo; an off-machine copy (iCloud/external)
   is still manual.
4. Whether full-resolution PNG masters should ever be tracked in git (currently local-only).

## Key facts

- Repo: `~/dev/emberwold`; public remote `davidcai/emberwold`; branch `main`; all work pushed.
- History: the wordmark/ADR-008 commit is `419bdb5`; this handoff file was committed on top.
  Do not trust a pinned hash for "current HEAD" — run `git log --oneline -1` and `git status -sb`.
- Toolchain: Node and pnpm paths come from the harness `load_workspace_dependencies`; the data
  validator runs with `.venv/bin/python tools/validate_data.py`. There are no app build/test
  commands yet.
- Source of truth docs: `docs/design/00-decisions.md` (ADR-001…008); T0 in `14-roadmap.md`
  §0.1/§5 and `12-architecture.md` §12.5; G1 in `10-feasibility-analysis.md` §9; MVP scope in
  `11-mvp-scope.md`. **The executable T0 plan is `docs/design/19-t0-spike-plan.md`** (steps,
  checks, cut order, owner questions); milestone labels M1-1…M2-4 map to plan steps S1–S10.
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
