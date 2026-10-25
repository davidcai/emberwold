# Research & Design Brief — "Emberwold" (working title)

**Status:** active · **Owner:** Lead · **Last updated:** 2026-10-24

## 1. Mission

Assess the feasibility of — and prepare everything needed before implementing — a
digital video game adaptation of **Mage Knight Board Game** (Vlaada Chvátil, WizKids,
2011; **Ultimate Edition**, 2018), scaled down to a smaller, faster, easier-to-learn
experience we call **Emberwold**.

Deliverables are research and design documents plus structured game data. **No game
implementation yet.** Everything in this repo must be traceable to a source.

## 2. Ground truth (primary sources)

Official WizKids PDFs were downloaded to `reference/rulebooks/` (gitignored, see
`08-sources.md`) and text-extracted to `reference/extracted/*.txt` with
`=== [page N] ===` markers.

| File | What it is |
|---|---|
| `MKUE_rulebook.pdf` | **Ultimate Edition core rulebook** — the primary rules authority |
| `MKUE_expansions_rulebook.pdf` | Lost Legion / Krang / Shades of Tezla rules deltas |
| `MKUE_walkthrough.pdf` | First-game walkthrough — great for sequence/UX and worked examples |
| `MK_master_reference_sheet.pdf` | One-sheet site-by-site rules summary |
| `MK_base_rulebook_2012.pdf` | Base-game rulebook **bundling the full Scenario Book** (incl. **Solo Conquest**) — the only online source for scenario rules |
| `MK_quick_reference.pdf` | Quick reference card (same content as master reference sheet) |

⚠️ The UE **Scenario Book** is a separate booklet and is *not published online*. Scenario
authority = 2012 base rulebook scenario section, cross-checked against the UE rulebook's
scenario summaries (p.18–22). Any base→UE difference must be flagged, not guessed.

**Citation convention:** `(MKUE Rulebook, p.6)` = PDF page number in the extracted
text. Prefer exact quotes for rules that a rules engine must disambiguate.

## 3. Environment & toolchain (important)

* The `web_search` *tool* is **not available** in this session (no API key). Use `web_fetch`
  or `curl` against known URLs, or a reader proxy.
* **Search discovery DOES work** via Brave Search HTML + curl:

  ```bash
  UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
  curl -s --max-time 25 -A "$UA" "https://search.brave.com/search?q=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "your query")" \
    | python3 -c "import re,sys,html; s=sys.stdin.read(); [print(html.unescape(re.sub('<[^>]+>','',t))[:80],'|',u[:120]) for u,t in re.findall(r'<a[^>]+href=\"(https?://[^\"]+)\"[^>]*>(.*?)</a>', s, re.S) if 'brave.com' not in u and len(re.sub('<[^>]+>','',t).strip())>12]"
  ```
* Other working fetch patterns:
  * `curl -sL -A "Mozilla/5.0 ..." URL` — works for Wikipedia, WizKids, GitHub raw,
    mageknight.net.
  * `web_fetch` tool — works for regular pages (Wikipedia confirmed).
  * `https://r.jina.ai/<url>` — text proxy; useful for JS-heavy pages. **BGG still
    returns a Cloudflare CAPTCHA through it.**
* **Blocked / hard:** boardgamegeek.com and its XML API (Cloudflare 403/403 — not
  workable), DuckDuckGo, Bing/DuckDuckGo HTML scraping. `web.archive.org` rate-limits
  (HTTP 429) — retry with long delays. Reddit `.json` endpoints return HTML — use
  `web_fetch` instead.
* Fan mirror worth knowing: **mageknight.net** (`/rule-books/`) hosts official PDFs and
  community references; read-only, cite it as secondary.
* Working APIs:
  * GitHub REST: `https://api.github.com/repos/{owner}/{repo}` and
    `.../git/trees/HEAD?recursive=1`, `raw.githubusercontent.com/...`
  * WizKids WordPress: `https://wizkids.com/wp-json/wp/v2/search?search=...`
  * WizKids hosts rulebook PDFs under `eadn-wc03-13179282.nxedge.io/...`
* PDFs: use the project venv — `.venv/bin/python` (pypdf installed). No `pdftotext`.
* Do **not** run `git commit`; the Lead handles all commits.
* If a download is needed, put it under `reference/` (gitignored), never in `docs/`.

## 4. Prior art (must be analysed, not ignored)

| Project | Stack | Why it matters |
|---|---|---|
| `mage-knight-digital/MageKnight` (GitHub) | Rust engine + TS/React client, `packages/engine-rs`, `mk-data` | Mature, very active open-source engine. Contains `cards.rs`, `enemies.rs`, `units.rs`, `tiles.rs`, `skills.rs`, `scenarios.rs` — a huge cross-check for our data model and a proof of technical feasibility. Check its LICENSE and legal posture. |
| `kyle-ip/mage-knight` | static web, `gh-pages` branch | Completed local web remake; study scope/UX and cut corners. |
| `yav/MageKnight` | Haskell | Modelling approach. |
| `kevinwurn/MageKnight` | Python, solo | Minimal solo implementation. |
| Tabletop Simulator / Vassal mods | — | De facto digital versions; UI expectations, IP treatment. |

## 5. Scope framing: what "Emberwold" means here

Full MKUE is a 2–4 hour, 7-hero (*8 with the 2026 Apocalypse Dragon hero*), 3-expansion monster. Emberwold is a **deliberately
reduced** adaptation. Research must document the **full** rules faithfully; design docs
then choose a subset. Candidate reduction axes (to be argued in `docs/design/`):

1. Solo/co-op only vs. competitive PvP.
2. Heroes: 2–4 vs. 8 (+ Krang/Bravalar).
3. Map: fixed/smaller tile set vs. full countryside deck.
4. Cards: core decks subset vs. all Advanced Actions/Spells/Artifacts/Units.
5. Scenarios: one tuned scenario ("Solo Conquest"-like) vs. all.
6. Combat: full phases vs. streamlined; city assaults as the solo endgame.
7. Session target: 30–60 min.

## 6. Writing standards

* Markdown, ATX headings, tables for anything tabular. One H1 per file.
* Every non-obvious rules claim gets a page citation. Mark uncertainty `⚠️ UNVERIFIED`.
* Do not invent rules. If sources conflict (base vs. UE errata), say so explicitly and
  cite both — these conflicts are exactly what a rules engine must resolve.
* Keep line lengths reasonable; no giant walls of prose. Prefer numbered steps,
  decision tables and state machines.
* Derived game data must **not** be a verbatim copy of card flavour text. Use the
  compact effect notation defined in `game-data/README.md` plus short names.
* Every file ends with a `## Sources` section.

## 7. File ownership (do not write outside your lane)

| Owner | Files |
|---|---|
| **Lead** | `README.md`, `docs/README.md`, `docs/research/00-brief.md`, `01-game-overview.md`, `08-sources.md`, `docs/design/10-feasibility-analysis.md`, `11-mvp-scope.md`, `14-roadmap.md` |
| **rules-analyst** | `docs/research/02-rules-core.md`, `03-rules-reference.md`, `04-faq-clarifications.md` |
| **data-extractor** | `game-data/**`, `tools/**` |
| **precedent-analyst** | `docs/research/05-digital-precedents.md`, `06-legal-ip.md`, `07-assets-art-inventory.md` |
| **architect** | `docs/design/12-architecture.md`, `13-ai-opponents.md` |

If you need a fact that lives in another owner's file, link to it and ask the Lead;
never edit it.

## 8. Coordination

1. Claim your shared task before writing.
2. Work from `reference/extracted/*.txt` first; only fetch the web for what is missing.
3. Message the Lead with a concise completion summary (files, key findings, open
   questions) and mark the task complete.
4. Flag blockers early. Wrong facts are worse than admitted gaps.
