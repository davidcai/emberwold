# PROGRESS — Emberwold handoff

> **Temporary session handoff.** Delete this file once the goal's acceptance check passes.
> Fresh context: read this file and `git log -5`, run the baseline checks in **Done** item 1,
> then do the first item in **Next**.

## Goal

On owner approval, deliver the **T0 spike** so gate **G1** passes: one full round playable
(movement → reveal → assault → reward → end turn), a deterministic trace replay, and no crashes;
then write the spike report and decide go/no-go. Acceptance: G1 in
`docs/design/10-feasibility-analysis.md` §9 and the M2 exit in `docs/design/14-roadmap.md` §1.
Blocked until the owner lifts the pre-implementation hold (`AGENTS.md` §2).

## Done (verified 2026-10-31)

1. Pre-production package (research, rules, legal, design, `game-data/`, tooling) is committed
   on `main`. Baseline check: `git status -sb` → clean `## main...origin/main`; `git log --oneline -5`
   shows HEAD `419bdb5`.
2. Data validator green. `.venv/bin/python tools/validate_data.py` →
   `checks: 9662  errors: 0  warnings: 0` / `RESULT: OK`.
3. Art complete: 40 AI-generated slots + 12 motif icons committed as WebP (52 files, 4.3 MB);
   `git ls-files 'art/**/*.webp' | wc -l` → 52; `art/manifest.json` has 40 art slots `final`.
4. Wordmark committed with **ADR-008**. `xmllint --noout art/branding/*.svg` → exit 0;
   manifest `logo` → `art/branding/logo.svg`, status `final`; `git show --stat 419bdb5`.
5. Local-only art (181.8 MB: sources + PNG masters + style refs) is backed up at
   `~/dev/backup/emberwold/emberwold-local-art-2026-10-31.tar.gz` (175,796,673 B,
   sha256 `31c21825d9caed2113ffa224927715a14a57ffea6f9099e3e9b1ab69fae5a0fe`); `/tmp` copies deleted.
6. Tree clean and synced: `main` = `origin/main` at `419bdb5`.

## Next (ordered; first item is the exact next action)

1. **Ask the owner to lift the pre-implementation hold for T0.** Do not write game code before
   that (`AGENTS.md` §2). If approved, continue with the steps below.
2. **M1-1 scaffold**: pnpm monorepo (`engine`, `content`, `client`, `tools`), strict TS, lint/CI;
   `pnpm test` green.
3. **M1-2 engine core**: `GameState` / `Action` / `Event`, `reduce(state, action) → {state, events}`,
   seeded RNG, state hash.
4. **M1-3 content compiler**: `game-data/` → typed bundle with schema validation and an `mvp` filter.
5. **M1-4 trace harness + `play-cli`**: random-legal bot, 1,000 turns with zero invariant failures.
6. **M1-5 spike content**: 1 hero deck (~16–20 cards), 2 tiles, 3 enemies, 1 site, marked `mvp: true`.
7. **M2-1 combat**: 4-phase combat + damage assignment; a trace must match the rulebook worked example.
8. **M2-2 minimal UI**: Pixi hex map, DOM hand, legal-action menus; a human plays one round.
9. **M2-3 site interaction** + reward loop.
10. **M2-4** `docs/design/spike-report.md` + G1 go/no-go with the owner.

## Open questions

1. **T0 approval** — blocking. Default while unanswered: stay pre-implementation.
2. Public branding still gated by ADR-007/008: run the `15` §11 name screen before any public
   wordmark use.
3. The 181.8 MB archive is on the same disk as the repo; an off-machine copy (iCloud/external)
   is still manual.
4. Whether full-resolution PNG masters should ever be tracked in git (currently local-only).

## Key facts

- Repo: `~/dev/emberwold`; public remote `davidcai/emberwold`; branch `main`; all work pushed.
- HEAD at handoff: `419bdb5` ("Add Emberwold wordmark and record ADR-008").
- Toolchain: Node and pnpm paths come from the harness `load_workspace_dependencies`; the data
  validator runs with `.venv/bin/python tools/validate_data.py`. There are no app build/test
  commands yet.
- Source of truth docs: `docs/design/00-decisions.md` (ADR-001…008); T0 in `14-roadmap.md` §0.1/§5
  and `12-architecture.md` §12.5; G1 in `10-feasibility-analysis.md` §9; MVP scope in `11-mvp-scope.md`.
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
