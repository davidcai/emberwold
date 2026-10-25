# 08 · Sources, Provenance, and Retrieval Log

**Status:** v1 (Lead) · **Retrieved:** 2026-10-24

Everything in `docs/` and `game-data/` traces back to a source listed here. This file also
explains the repo's deliberate split between **committed research** and **uncommitted
publisher material**.

## 1. Retrieval policy (why `reference/` is gitignored)

`reference/` holds PDFs published by WizKids and their extracted text. They are kept on
disk so the team can cite exact pages, but they are **not redistributed** in this
repository: the rulebook text and art are copyrighted by WizKids, and committing them
would put the project in a worse legal position than necessary (see `06-legal-ip.md`).

To restore the working set on a fresh clone:

```bash
mkdir -p reference/rulebooks reference/extracted
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
cd reference/rulebooks
curl -sL -A "$UA" -o MKUE_rulebook.pdf            "https://eadn-wc03-13179282.nxedge.io/posters/repository/wizkids/MKUE%20Rulebook%20BOOKLET.pdf"
curl -sL -A "$UA" -o MKUE_expansions_rulebook.pdf "https://eadn-wc03-13179282.nxedge.io/rules/MK3_Rulebook%20Final%20Resized%204.21.pdf"
curl -sL -A "$UA" -o MKUE_walkthrough.pdf         "https://eadn-wc03-13179282.nxedge.io/posters/repository/wizkids/MKUE_WalkThrough_BOOKLET-WEB.pdf"
curl -sL -A "$UA" -o MK_master_reference_sheet.pdf "https://eadn-wc03-13179282.nxedge.io/mkmaster/MK%20Master%20Reference%20Sheet.pdf"
# Scenario Book is only available bundled in the 2012 base rulebook (mageknight.net mirror):
curl -sL -A "$UA" -o MK_base_rulebook_2012.pdf    "https://www.mageknight.net/wp-content/uploads/Mage-Knight-Board-Game-Rules-2012-March.pdf"
# Official FAQ v1.0 (legacy host dead; Wayback copy):
curl -sL -A "$UA" -o MK_Official_FAQ_v1.0_2014.pdf "http://web.archive.org/web/20240229125017if_/http://wizkidsgames.com/wp-content/uploads/mage/MK_FAQ_1.0v2.pdf"
cd ../..
.venv/bin/python - <<'PY'
from pypdf import PdfReader
import pathlib
for pdf in sorted(pathlib.Path('reference/rulebooks').glob('*.pdf')):
    pages = [(p.extract_text() or '') for p in PdfReader(str(pdf)).pages]
    txt = '\n\n'.join(f'\n=== [page {i+1}] ===\n' + p for i, p in enumerate(pages))
    pathlib.Path('reference/extracted', pdf.stem + '.txt').write_text(txt, encoding='utf-8')
    print(pdf.name, len(pages), 'pages')
PY
```

(`MKUE_rulebook.pdf` and `MK_master_reference_sheet.pdf` are byte-identical to the copies at
mageknight.net, so the mirror is a safe fallback if the WizKids CDN changes.)

## 2. Primary sources (authoritative)

| # | Source | URL / location | Retrieved | Checksum (sha256, first 16) |
|---|---|---|---|---|
| P1 | **MKUE core rulebook** (official PDF, 24 pp.) | `reference/rulebooks/MKUE_rulebook.pdf` | 2026-10-24 | `664ab0e5405d821b` |
| P2 | **MKUE expansions rulebook** (Lost Legion / Krang / Shades of Tezla, 16 pp.) | `reference/rulebooks/MKUE_expansions_rulebook.pdf` | 2026-10-24 | `b03d48c1cff13b27` |
| P3 | **MKUE walkthrough** (20 pp., worked first game) | `reference/rulebooks/MKUE_walkthrough.pdf` | 2026-10-24 | `50ceeb6b9be23181` |
| P4 | **Master Reference Sheet** (2 pp., site rules summary) | `reference/rulebooks/MK_master_reference_sheet.pdf` | 2026-10-24 | `1367b0d5a9fedddf` |
| P5 | **Base-game rulebook 2012** (20 pp.) — **contains the complete Scenario Book**, incl. Solo Conquest, Full Cooperation, Blitz, Mines Liberation, Dungeon Lords, dummy player, solo skill rules | `reference/rulebooks/MK_base_rulebook_2012.pdf` (mirror: mageknight.net) | 2026-10-24 | `d33d79b9dd202bea` |
| P6 | **Official FAQ v1.0** (3 pp., dated 2014-02-07; recovered via Wayback after the legacy host died) | `reference/rulebooks/MK_Official_FAQ_v1.0_2014.pdf` | 2026-10-24 | see manifest |
| P7 | Extracted text with page markers | `reference/extracted/*.txt` | 2026-10-24 | regenerated from P1–P6 |

Extraction is lossless enough for spec work but has ligature artifacts (`ﬁ`, `ﬀ`) and
hard-wrapped hyphenation; quotes in our docs normalise these. **Page numbers cited in
`docs/` are PDF pages of P1–P5, not printed folios.** Note that booklet PDFs can
interleave spreads, so search by content, not only by page.

### The official FAQ (recovered)

`wizkidsgames.com` is dead, so the original FAQ URL 404s. Recovery path used by the rules
analyst: Wayback availability API on the product page → archived page's PDF link →
`web.archive.org` copy. The file is preserved in `reference/rulebooks/` and its text in
`reference/extracted/`; content is organised in `04-faq-clarifications.md` §A.3 (≈50 Q&As).

### Scenario Book status (important)

The UE **Scenario Book** is a separate booklet and is **not published online**. The 2012
base rulebook (P5) bundles the same scenarios; the UE rulebook (P1, pp.18–22) carries
scenario *summaries*. Therefore:

* Scenario mechanisms/setup/scoring → P5, cross-checked against P1 summaries.
* Any base→UE change → flag ⚠️ UNVERIFIED rather than assuming.
* `MKUE_rulebook_full_2018.pdf` from mageknight.net was verified **byte-identical** to P1
  and was deleted; ditto `MK_quick_reference.pdf` vs P4.

Discovery path: product pages → PDF links:
- https://wizkids.com/mage-knight-ultimate-edition/
- https://wizkids.com/mage-knight/
- https://wizkids.com/mage-knight-shades-of-tezla/

## 3. Secondary sources

| Source | URL | Use |
|---|---|---|
| Wikipedia, *Mage Knight Board Game* | https://en.wikipedia.org/wiki/Mage_Knight_Board_Game | Release facts, player counts, expansions, awards, reception |
| Wikipedia, *Mage Knight* | https://en.wikipedia.org/wiki/Mage_Knight | IP lineage: 2000 CMG, 2006 PC/DS games, 2010 relaunch |
| WizKids Ultimate Edition page | https://wizkids.com/mage-knight-ultimate-edition/ | Contents (base + 3 expansions + 5 new cards), 1–5 players, 14+ |
| WizKids product/news pages | https://wizkids.com/mage-knight/ , https://wizkids.com/mage-knight-shades-of-tezla/ | Product description, rulebook links |
| GitHub `mage-knight-digital/MageKnight` | https://github.com/mage-knight-digital/MageKnight (redirects from `eshaffer321/MageKnight`) | Prior-art engine, data cross-check; README read 2026-10-24 |
| GitHub `kyle-ip/mage-knight` | https://github.com/kyle-ip/mage-knight (`gh-pages` branch) | Completed static web remake |
| GitHub `yav/MageKnight` | https://github.com/yav/MageKnight | Haskell rules model |
| GitHub `kevinwurn/MageKnight` | https://github.com/kevinwurn/MageKnight | Python solo implementation |

## 4. Source conflicts and how they were handled

| Conflict | Resolution used |
|---|---|
| Base game vs. UE (errata, integrated rules) | **UE rulebook (P1) wins.** Base-game materials are legacy; cite UE unless only the base printing covers a topic. |
| Rulebook text vs. community implementations | Rulebook wins. Upstream data is used only as a cross-check; discrepancies are logged in `game-data/README.md`. |
| Site rules split between rulebook and Site Description cards | Both cited: rulebook for mechanism, Master Reference Sheet (P4) for per-site text summary. The physical Site Description cards are not reproduced here — ⚠️ any per-site rule not covered by P4 is marked UNVERIFIED. |

## 5. Blocked / unavailable sources (do not burn time on them)

| Blocked / unavailable source | Status | Workaround |
|---|---|---|
| BoardGameGeek site + XML API | Cloudflare 403 / CAPTCHA (also via `r.jina.ai` and `web_fetch`) | Wayback snapshots, Wikipedia's BGG citations, fan sites |
| `wizkidsgames.com` (legacy host of MK FAQ + 2012 base rulebook) | Domain dead / connection failure | Wayback Machine (`web.archive.org`) is rate-limited (HTTP 429) — retry with delays; the 2012 rulebook was recovered from mageknight.net instead |
| **UE Scenario Book** (separate booklet) | Not published online (404 on every guessed URL; not linked from product page) | Use 2012 base rulebook scenario section (P5) + UE summaries (P1) |
| DuckDuckGo / Bing scraping | No usable results (JS/anti-bot) | **Use Brave Search HTML via curl** (below) + `web_fetch` on known URLs |
| Tabletop Simulator Workshop | Requires Steam login | Describe from public mod pages via `web_fetch` where reachable |
| Official board-game FAQ v1.0 | Original PDF gone (wizkidsgames.com dead); BGG FAQ thread Cloudflare-blocked | Wayback retry; community FAQ consensus. Status tracked in `04-faq-clarifications.md` |

## 6. Tooling notes

* No `web_search` tool in this environment, but **discovery is possible** by scraping Brave
  Search HTML with curl; it returns a real ranked result list. Example:

  ```bash
  UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
  curl -s --max-time 25 -A "$UA" "https://search.brave.com/search?q=%22Mage+Knight%22+scenario+book+pdf"
  ```
  Parse `<a href="http(s)://...">title</a>` and filter out `brave.com` self-links.
* `r.jina.ai/<url>` works as a read-only text proxy for many pages; not for BGG.
* PDF text extraction: `.venv/bin/python` with `pypdf` (installed in project venv, gitignored).
* GitHub REST API works without auth for light use (60 req/h/IP) — cache what you read.
* `mageknight.net` mirrors official PDFs and 2001–2005 miniatures documentation; useful as
  a fallback source and as an example of community IP practice (it is not affiliated with
  WizKids).
* **Reading data off board art / card photos:** the sandbox blocks `qlmanage` and the venv's
  compiled wheels (Pillow/PyMuPDF) fail code-signing, so use one of:
  * `sips -s format png in.pdf --out out.png` (fast, low-res first page), or
  * a small CoreGraphics renderer (`/tmp/render_pdf.c`, compiled with
    `xcrun clang -O2 -framework CoreGraphics -framework ImageIO -o /tmp/render_pdf ...`),
    which renders any page at any scale; then crop with the *bundled* Python's Pillow.
  This is how the Fame track (3/8/15/24/35/48/63/80/99) was verified against the official
  board photo — see `game-data/README.md` §7.15.

## Sources

This file *is* the source log; entries above are the sources.
