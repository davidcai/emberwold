# Miniknight

**A feasibility study and pre-production package for a scaled-down digital adaptation of
*Mage Knight Board Game*.**

> ⚠️ **Working title / fan project.** Miniknight is not affiliated with, endorsed by, or
> licensed by WizKids or Vlaada Chvátil. *Mage Knight* and its art are the property of their
> owners. No publisher rulebook, art or card text is redistributed in this repository.
> Read [`docs/research/06-legal-ip.md`](docs/research/06-legal-ip.md) before anything public.

## What this repo is

Before writing game code, we answered three questions with evidence:

1. **What exactly is the game we're adapting?** — Full official rules extracted and
   specified for implementation: core loop, combat, sites, scenarios, expansions.
2. **Can it be built by a small team?** — Yes. Prior-art analysis (including a mature
   open-source Rust engine), a bottom-up effort model, and a risk register.
3. **What do we build first?** — A deliberately reduced, shippable **First Conquest**:
   solo, 3 rounds, 4 tiles, 1 city, ~40 card definitions, 20–30 minutes, full combat rules.

**Status: research + design complete; no game code yet.** The next step is a 2-week spike
(`docs/design/14-roadmap.md` §5).

## TL;DR

| Question | Answer |
|---|---|
| Is it technically feasible? | **Yes** — rules are fully documented; several digital implementations exist, one very deep |
| Is it feasible *at full fidelity*? | Yes, but it's a multi-year project; the deep prior-art build has no release after ~10 months |
| What's the recommended v1? | **First Conquest** — solo, 20–30 min, 1 city, ~40 cards, 2 heroes max |
| Effort | ≈9–13 engineer-weeks for v1 (≈2.5–4 months calendar for one dev with heavy AI assistance), ≈25 ew for the full Solo-Conquest-shaped "Classic" tier |
| Biggest technical risk | Card-effect long tail + UI legibility |
| Biggest overall risk | **IP / trademark** — a release-path decision is required before going public |
| Main research gap | UE Scenario Book isn't published online (recovered via the 2012 base rulebook) |

## Read in this order

| # | Document | What it gives you |
|---|---|---|
| 1 | [`docs/research/01-game-overview.md`](docs/research/01-game-overview.md) | What Mage Knight is, why adapt it, the Miniknight thesis |
| 2 | [`docs/research/02-rules-core.md`](docs/research/02-rules-core.md) | Implementation-grade rules spec |
| 3 | [`docs/research/03-rules-reference.md`](docs/research/03-rules-reference.md) | Tables: sites, enemies, cards, heroes, tiles, scenarios |
| 4 | [`docs/research/04-faq-clarifications.md`](docs/research/04-faq-clarifications.md) | Ambiguity/decision register for the engine |
| 5 | [`docs/research/05-digital-precedents.md`](docs/research/05-digital-precedents.md) | Every existing digital version, forensically |
| 6 | [`docs/research/06-legal-ip.md`](docs/research/06-legal-ip.md) | Ownership, risk tiers, options, pre-release checklist |
| 7 | [`docs/research/07-assets-art-inventory.md`](docs/research/07-assets-art-inventory.md) | Asset needs, legal sources, costs, MVP plan |
| 8 | [`docs/design/10-feasibility-analysis.md`](docs/design/10-feasibility-analysis.md) | **The verdict**, effort model, risk register, gates |
| 9 | [`docs/design/11-mvp-scope.md`](docs/design/11-mvp-scope.md) | Exactly what v1 ships (and doesn't) |
| 10 | [`docs/design/12-architecture.md`](docs/design/12-architecture.md) | Engine/UI architecture, determinism, testing, build plan |
| 11 | [`docs/design/13-ai-opponents.md`](docs/design/13-ai-opponents.md) | Why AI is hard here, and what to do instead |
| 12 | [`docs/design/14-roadmap.md`](docs/design/14-roadmap.md) | Tiers, milestones, gates, first two weeks |
| — | [`game-data/README.md`](game-data/README.md) | Machine-readable content schema + provenance |
| — | [`docs/research/08-sources.md`](docs/research/08-sources.md) | Every source, checksum, and retrieval method |

## Repository layout

```
docs/
  research/    source-of-truth research (rules, precedents, legal, assets)
  design/      feasibility, scope, architecture, AI, roadmap
  prompts/     original project prompt
game-data/     machine-readable content (JSON + schema + effect DSL)
tools/         data extraction/validation tooling
reference/     gitignored: official PDFs + extracted text (see docs/research/08-sources.md)
```

## Reproducing the research

* Official rulebooks are downloaded to `reference/` (not committed — copyright) by the script
  in [`docs/research/08-sources.md`](docs/research/08-sources.md) §1.
* Text extraction uses the project venv: `python3 -m venv .venv && .venv/bin/pip install pypdf`.
* Validate the game data: `.venv/bin/python tools/validate_data.py`.
* Citation convention: `(MKUE Rulebook, p.N)` = PDF page of the official rulebook.

## Decisions needed before implementation

1. Release path: personal/portfolio, free fan release, licensed, or original IP? (`06`)
2. Platform: web-first vs. desktop vs. mobile-first? (`10` §10)
3. Confirm v1 scope = First Conquest (`11`).
4. Art: placeholder v1 or commission early? (`07`)
5. Public name (screen "Miniknight" before use). (`06`)

## Licence

Repository contents (our prose, data model and tooling) are for the project's internal
research use until a release path is chosen. Third-party game content remains the property
of WizKids; see `docs/research/06-legal-ip.md`.
