# PROGRESS — Emberwold handoff

> **Temporary session handoff.** Delete this file once the goal's acceptance check passes.
> Fresh context: read this file and `git log -5`, run the baseline checks in **Done** item 1,
> then do the first item in **Next**.

## Goal

Complete the **T1 First Conquest** core loop after the **T0 spike** (done 2026-10-31; spike
report + ADR-010). T0 was merged to `main` (PR #1, `41c8a0f`) and its verdict is provisional
GO pending the owner's 10-turn playtest. T1 work is on branch `t1-first-conquest`.
T1 scope: [`docs/design/11-mvp-scope.md`](docs/design/11-mvp-scope.md) and
[`docs/design/14-roadmap.md`](docs/design/14-roadmap.md) M3–M4. Acceptance: the T1 exit gates
in `14-roadmap` (M3 headless complete game, M4 browser game with placeholder art) and
`11` §9 definition of done.

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
    `contentHash cfcf9db2...f122` (config is hashed too); `pnpm content:check` clean; tamper/op
    failures demonstrated;
    engine mutation test proves costs load from the bundle. `game-data/` untouched.
13. **S5 done — C1 passed** (commit `4a9f148`): trace record/verify CLIs, interactive +
    `--random` play-cli, fuzz harness; `000-smoke.json` (52 actions) replays; tampered trace
    rejected; fuzz 1,000 actions over 24 games with 0 invariant/termination failures.
    **Checkpoint C1: headless round loop replays deterministically.**
14. **S6 done — movement/explore/round loop** (commit `7c89c3d`): engine tests cover the
    Day-cost table, explore as its own 2-Move action, negative move/reveal cases, mana expiry,
    the round loop and the T0 wounds-persist deviation (19 engine tests). Authored map fixed:
    countryside at origin `2,1` (the old placement overlapped the starting tile); compiler now
    rejects overlapping tile placements and hashes its config into `contentHash`
    (`cfcf9db2…f122`). `010-move-reveal.json` replays with `heroMoved`+`tileRevealed`;
    `000-smoke.json` re-recorded (44 actions).
15. **S7 done — combat (C2)** (commit on `t0-spike`): `combatMath.test.ts` covers the 02 §7.3
    efficiency matrix, inefficient halving, swift, fortify, resistance, brutal, wounds (engine
    suite now 31 tests); `020-combat.json` (seed 3, 19 actions) replays with 2 wounds, 1 enemy
    defeated, +2 fame.
16. **S8 done — village heal + end-to-end trace (C2 passed)** (commit `e236ad4`):
    `030-site-heal.json` (32 actions: reveal → combat wound → travel → enterSite → 3 influence →
    heal) and `040-one-round.json` (34 actions: same then end turn after the heal). All five
    traces verify; `pnpm verify` 57 tests; fuzz 1,000 actions clean. **Checkpoint C2 passed.**
    T0 deviation documented: wounds persist across turns (T1 restores round-end recycling).
17. **S9 done — minimal React/SVG UI + Playwright check** (branch `t0-spike`): `packages/client`
    renders the SVG hex board, hand from bundle display names, legal-action menu built only
    from `getLegalActions`, combat rail, event log, seed/new-run; production build 258 kB JS.
    `pnpm test:e2e` 1/1 passes: the spec clicks only legal actions and reaches
    heroMoved → tileRevealed → combatStarted → siteEntered → healGained → turnEnded with zero
    console errors. `ip.forbidden_terms` list + test added (`pnpm verify` 58 tests). Dev server
    and `pnpm preview` both serve the app (HTTP 200). G1 fun pass (owner + one new player) is
    still the owner's action.

18. **S10 done — T0 spike report + ADR-010 go/no-go, T1 transition opened** (branch `t0-spike`):
    `docs/design/spike-report.md` (G1 table, evidence, cuts/deviations/wavers, B1–B9, estimates,
    owner actions), **ADR-010** (provisional GO, merge after green CI, T1 on `main`), roadmap
    M1/M2 marked done, README/docs index/AGENTS §2/PROGRESS moved to T1, rest golden trace
    `015-rest.json` added, `traces:check` + CI fuzz step added (`pnpm verify` 58 tests, 6 traces,
    fuzz seed 1 clean). Committed `bd18cf2`, pushed, CI run
    https://github.com/davidcai/emberwold/actions/runs/41272177812 green; PR #1 opened and
    merged with a merge commit (`41c8a0f`); `main` checked out and synced. T0 is complete.

19. **T1-a done — core rules increment on `t1-first-conquest`** (branch `t1-first-conquest`):
    3-round Day/Night/Day scenario clock (`timeOfDayPattern`; night flips terrain costs and
    depletes gold Source dice, day depletes black), round-end Wounds recycling restored
    (02 §15.2: deck+discard+hand shuffle, draw to hand limit), 4-tile rotated map from the
    authored First Conquest layout (`t1.config.json`: start + 2 countryside + city, site
    seeds, city garrison), city assault → `cityConquered`/victory (`score = fame + 10`) or
    round-limit defeat; one combat per space per turn (`fought:<hex>` flag); enemies only
    spawn when their tile is revealed. Evidence: `pnpm verify` 63 tests (24 engine) green;
    6 golden traces re-recorded and verify against contentHash
    `aa736dd9fbfe3bb358e7bf2b0d0a5a0ece71444f6768d7fca982bbb3a52b4926`; fuzz seed 1 clean;
    data validator still 9662/0/0.
20. **T1-d (client half) done — autosave/continue + undo + e2e** (teammate `t1-ui`, same
    branch): versioned localStorage save validated by contentHash, autosave after every action,
    Continue/new-run boot screen, in-memory undo snapshot stack; `e2e/persistence.spec.ts`
    (3 tests) plus the adapted `e2e/ui.spec.ts`; `pnpm test:e2e` 4/4 green. Engine untouched by
    this work.
21. **T1-a2 done — real round clock, tactics, simplified dummy** (on `main`): rounds are now
    day/night phases of ~4–6 hero turns instead of the T0 one-turn-round shortcut. A simplified
    solo dummy (16-card count deck, flips 3 per its turn) announces End of Round when empty, the
    hero gets one final turn, and the next round runs the real prepare pipeline (day/night flip,
    Source reroll, hand+discard+deck shuffle incl. Wounds and fresh draw, dummy refill, tactic
    pool refresh). Tactics are picked each round (human first, dummy random; used tactics are
    removed per scenario rules; effects deferred — data is placeholder). Deck-empty-at-turn-start
    forces the hero to announce End of Round. Evidence: `pnpm verify` 64 tests (25 engine) green;
    6 re-recorded traces (000-smoke 52 actions, 010/015 short, 020 26, 030 44, 040 45) verify
    against contentHash `a0c2aac5751e036846b55eda8f6169d33601aeebc855bc80ab7f297208edc866`;
    fuzz seed 1 1,000 actions clean; `pnpm test:e2e` 4/4 (ui.spec now replays 030 deterministically
    through the real UI); `pnpm content:check` clean.

22. **T1-b1 done — site purchases, offers, mine/glade, interaction reputation**: the bundle now
    carries Advanced Action and Spell definitions (5 AA + 2 spells whose whole effect tree is
    implemented today; the rest stay out until their ops land — documented simplification), plus
    an AA offer (3) and spell offer (2) with decks behind them that top up on purchase. Engine:
    monastery sells an AA for 6 Influence, a tower site sells a Spell for 7 Influence + one
    matching mana (crystal/token/die), both put the card on top of the deed deck; magical glade
    discards one Wound without healing it; ending the turn on a crystal mine yields one crystal;
    entering a site applies the reputation modifier to Influence once per turn; healing stays
    3 Inf/point at villages and 2 Inf/point at monasteries. Evidence: 69 tests green (5 new:
    monastery purchase + offer top-up, spell purchase + mana, glade wound discard, mine income,
    take_wound inside a combat card choice); contentHash
    `fc396620e7046d8ef48eefedf82c5a28c0730bbaa430af131c6a413ae8490685`; all 6 traces re-recorded
    (same flows) and verify; e2e 4/4; fuzz seed 1 clean.

## Next (ordered; first item is the exact next action)

**T1-a + T1-d(client) are done on `t1-first-conquest`; commit and open the T1 PR, then keep
going on `main`.** Each increment ends with tests, `pnpm verify` green, a small commit and a
PROGRESS update. Remaining T1 scope: `docs/design/11-mvp-scope.md` + `14-roadmap.md` M3–M4.

0. Commit the current T1 increment (engine/content/rules + client autosave/undo + e2e + docs),
   push `t1-first-conquest`, watch CI (`t1-*` trigger added), open the PR and merge when green.
1. **T1-c progression** — fame → level-up thresholds/level_stats (armor/hand/command), skill
   tokens/offers (simplified: take a skill from the hero's 10-card skill deck at even levels),
   Advanced Action acquisition at level-up (AA offer top card → top of deck), hand-limit and
   armor updates, and the level-up prompt in the engine action flow.
2. **T1-b2 units + remaining sites** — unit definitions/offers (players+2 at round start),
   recruit at village/monastery/keep/tower, command slots, ready/spent/wounded, activate unit
   abilities; keep hand-limit bonus; portal use; city purchase options after conquest.
3. **T1-e UI** — round/day-night indicator + tactic picker display, board origins, site/offer
   panels (buy AA/spell/heal/recruit), level-up/unit UI, score/debrief screen, tutorial prompts
   turns 1–3, placeholder art where it exists.
4. **T1-f verification + exit** — a full-game deterministic trace that actually wins (city
   assault inside 3 rounds) or a scripted full game, scoring/debrief check, longer fuzz in CI,
   docs (`11` §9 DoD), README/roadmap status, then T1 exit + PR/merge decision.
5. Owner actions left (cannot be done by the agent): 10-turn fun pass check, T0 deviation
   sign-off.

## Open questions

1. **Fun pass (owner):** S9 acceptance 3 needs the owner + one unfamiliar player to play a
   10-turn session and answer the two fixed questions; the agent cannot do this. Q14 (UI
   required?) is resolved: S9 is included.
2. Public branding still gated by ADR-007/008: run the `15` §11 name screen before any public
   wordmark use.
3. The 181.8 MB archive is on the same disk as the repo; an off-machine copy (iCloud/external)
   is still manual.
4. Whether full-resolution PNG masters should ever be tracked in git (currently local-only).

## Key facts

- Repo: `~/dev/emberwold`; public remote `davidcai/emberwold`. T0 merged (PR #1 `41c8a0f`);
  the T1-a/T1-d branch merged as PR #2 (`606975c`); **T1 continues on `main`** (ADR-010) with
  small commits, CI on every push.
- History: do not trust a pinned hash for "current HEAD" — run `git log --oneline -1` and
  `git status -sb`.
- Toolchain: Node 24.22.1, pnpm 12.15.0 (pinned in `package.json`); `pnpm verify` = typecheck +
  lint + tests + dependency boundaries + golden traces; `pnpm test:e2e` = Playwright (4 tests);
  `pnpm test` alone; data validator
  `.venv/bin/python tools/validate_data.py` (local) / `python3 tools/validate_data.py` (CI, stdlib).
- Source of truth docs: `docs/design/00-decisions.md` (**ADR-001…010**); T0 plan and steps in
  `docs/design/19-t0-spike-plan.md`; G1 in `10-feasibility-analysis.md` §9; MVP scope in
  `11-mvp-scope.md`; architecture in `12-architecture.md`; T0 evidence in `spike-report.md`.
- Art packaging: committed = WebP q90 at ≥2× display size (`art/*/*.webp`); full-res PNG masters
  are local-only (`art/<category>/*.png` ignored); wordmark in `art/branding/` is tracked; no font
  binaries are committed or embedded.
- Image generation is owner-run in the ChatGPT desktop app; the agent never generates images.
- **T1 simplifications still open** (documented, not bugs): tactic card effects are deferred
  (data placeholder); the dummy is count-only (no crystals/AA absorption/blocking figure yet);
  only Advanced Actions/Spells whose full effect tree is implemented enter the bundle (5 AA +
  2 spells now); Spell powered effects use the generic mana payment (no night/black-mana rule
  yet); combat fidelity waivers from the spike report §6 still apply until T1 exit.
- Gotchas: (a) the harness sandbox blocks writes outside the workspace — iCloud/backup copies need
  approval or a manual step; (b) fontTools C extensions fail on this host (pure-Python works after
  deleting the `.so` files); (c) `qlmanage` is sandbox-blocked — rasterise SVG with `sips` (Chrome
  headless as fallback); (d) PNGs are large: 2× masters ≈87.6 MB, sources ≈85.3 MB.
- Failed approaches (do not repeat): colour-key matting for cut-outs destroyed armour/highlight
  colours — use macOS Vision foreground matting; committing 2× PNG masters was rejected for repo
  size; `qlmanage` SVG rasterisation is blocked.
- Public-repo rules: no secrets, no publisher rulebook/art, `reference/` stays local, decisions are
  append-only (new ADR, never rewrite old ones).
