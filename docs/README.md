# Documentation Index

This folder is the complete pre-production package for **Emberwold**. It is split into
**research** (what is true about the game, its digital history, and the law) and **design**
(what we will build and how). Read `README.md` at the repo root for the executive summary.

## Status board

| Doc | Title | Status | Owner | Notes |
|---|---|---|---|---|
| `research/00-brief.md` | Research & design brief | ✅ v1 | Lead | Mission, sources, toolchain, conventions, ownership |
| `research/01-game-overview.md` | Game overview & Emberwold thesis | ✅ v1 | Lead | Facts, pillars, reduction axes |
| `research/02-rules-core.md` | Core rules spec | ✅ v1 | rules-analyst | Engine-oriented rules, 372 page citations |
| `research/03-rules-reference.md` | Rules reference tables | ✅ v1 | rules-analyst | Sites, enemies, cards, heroes, tiles, scenarios |
| `research/04-faq-clarifications.md` | FAQ & ambiguity register | ✅ v1 | rules-analyst | **Official FAQ recovered** + 48-item decision register |
| `research/05-digital-precedents.md` | Digital precedents | ✅ v1 | precedent-analyst | Forensics of prior art + demand data |
| `research/06-legal-ip.md` | Legal & IP | ✅ v1 | precedent-analyst | **Read before public release** |
| `research/07-assets-art-inventory.md` | Assets & art inventory | ✅ v1 | precedent-analyst | Art needs, legal sources, $0 MVP plan |
| `research/08-sources.md` | Sources & provenance | ✅ v1 | Lead | URLs, checksums, retrieval log, blocked sources |
| `design/00-decisions.md` | **Decision log (ADRs)** | ✅ v1 | Lead | Purpose, IP strategy, platform, scope, art — **start here after the summary** |
| `design/10-feasibility-analysis.md` | Feasibility analysis | ✅ v1 | Lead | **The verdict**, effort, risks, gates |
| `design/11-mvp-scope.md` | MVP scope (First Conquest) | ✅ v1 | Lead | What ships in v1.0 and what doesn't |
| `design/12-architecture.md` | Technical architecture | ✅ v1 | architect | Engine, data pipeline, UI, testing, build plan |
| `design/13-ai-opponents.md` | AI / opponents | ✅ v1 | architect | Why AI is hard; tiered approach; MVP stance |
| `design/14-roadmap.md` | Roadmap | ✅ v1 | Lead | Tiers, milestones, gates, next 2 weeks |
| `design/17-platform-analysis.md` | Platform/framework analysis | ✅ v1 | Lead | Web-native recommendation (accepted), scoring, escape hatches |
| `design/15-retheme-bible.md` | Re-theme bible | ✅ v0.1 | Lead | Original world, names, terminology map, copy rules |
| `design/16-art-brief.md` | Art brief | ✅ v0.2 | Lead | Direction, specs, acceptance (commissioning = fallback) |
| `design/18-ai-art-prompts.md` | AI art prompt pack | ✅ v1 | art-prompt-writer | Tool/licence guidance, consistency workflow, 41 per-slot prompts |

Legend: ✅ complete · ⏳ in progress · ⚠️ has unverified parts (see the doc's own flags)

## Conventions

* **Citations:** `(MKUE Rulebook, p.6)` means PDF page 6 of the official Ultimate Edition
  rulebook in `reference/rulebooks/` (not a printed folio). Scenario rules cite the 2012
  base rulebook (which bundles the Scenario Book).
* **Uncertainty:** `⚠️ UNVERIFIED` marks anything not directly supported by a primary source.
  Do not remove those flags without a citation.
* **Data vs. prose:** rules prose lives in `docs/research/`; machine-readable content lives
  in `game-data/` and must cite provenance there.
* **No publisher files committed:** `reference/` is gitignored (copyright). See
  `research/08-sources.md` §1 for reproduction steps.
* **Page structure:** research docs answer "what is true"; design docs answer "what we do".

## How this was produced

1. Official WizKids PDFs were located via product pages, downloaded, and text-extracted with
   page markers (`pypdf`).
2. A rules analyst turned the rulebook into an implementation spec and an ambiguity register.
3. A data extractor compiled a schema, effect DSL and JSON content set, with provenance and
   a validator.
4. A precedent analyst studied existing digital implementations, the IP landscape, and asset
   options.
5. An architect designed the engine/UI architecture and AI strategy.
6. The Lead synthesised the feasibility verdict, scope, and roadmap, and reviewed everything
   for citation accuracy.

Known research gaps are listed in `research/08-sources.md` §5 (notably: the UE Scenario Book
is not published online; BGG is uncrawlable from this environment; the official FAQ PDF is
offline).
