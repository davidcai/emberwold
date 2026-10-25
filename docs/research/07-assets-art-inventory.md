# 07 · Assets & Art Inventory — what a digital Mage Knight needs, what is legal, and what an MVP should ship

**Status:** v1 (precedent-analyst) · **Date:** 2026-10-24 · **Companions:** `05-digital-precedents.md`, `06-legal-ip.md`

This document inventories the art/audio/font/UI assets a digital adaptation requires, states the
licensing status of the official assets, catalogues legal sources with rough costs, and ends with
a concrete starter asset plan for an MVP. Cost figures marked **⚠️** are **planning assumptions**,
not quotes — see §6.3 for how to replace them with real numbers in a week.

---

## 1. The headline

1. **A faithful digital Mage Knight needs roughly 390–440 distinct assets** (≈380 of them visual)
   if you cover the full Ultimate Edition (see §2.6). That is the single largest non-code cost of a full adaptation.
2. **None of the official art is licensed for reuse.** The publisher's copyright statement covers
   the rulebook, art, and card text (`06` §2). Every existing project that ships art ships scans.
3. **An MVP needs ~120 assets**, and **most of them can be vector/CSS or CC-licensed**, because
   the information the player needs is iconographic (numbers, symbols, frames), not illustrative.
4. **The cheapest legal MVP is art-light**: system/OFL fonts, SVG icons, CSS-drawn card frames,
   procedural hex tiles. The most mature open-source implementation proves this is viable — it
   ships **zero binary assets in its repo** and renders the game from a data pack (`05` §1.6).
5. **Buy vs borrow vs build** is really three different decisions for three different categories:
   *icons/UI* → borrow (CC-licensed, $0); *fonts/audio* → borrow (OFL/CC, $0); *illustrations* →
   build (commission or deliberately omit). See §7.

---

## 2. Asset inventory — what the game actually needs

Counts are derived from the game data in the pinned upstream engine
(`mk-data`: 245 card definitions, 73 enemies, 72 skills, 31 units, 44 advanced actions, 24 spells,
25 artifacts, 19 tiles, 15 ruins tokens, 12 tactics, 7 heroes) and cross-checked against the
component counts in the rulebook and against what shipped fan projects actually include.

### 2.1 Cards (printed card faces)

| Asset family | Unique faces (full MKUE) | Notes |
|---|---|---|
| Basic Action cards | **32 unique designs** (112 printed: 16 per hero × 7 heroes) | One shared 16-card standard deck, plus 2–3 per-hero replacement cards per hero (16 replacements total in `mk-data/heroes.rs`); a scaled version can print one shared deck |
| Advanced Actions | **44** | One illustration each |
| Spells | **24** | One illustration each |
| Artifacts | **25** | One illustration each |
| Wound cards | **1** | Same card repeated |
| Unit cards (regular + elite) | **31** (15 + 16) | Portrait + stats |
| Tactic cards | **12** (6 day + 6 night) | Simple iconographic |
| Hero cards | **7** | Portrait + stats + inventory |
| **Subtotal card faces** | **176 unique** (≈ 256 printed) | |

### 2.2 Tokens, tiles, and board furniture

| Asset family | Count | Notes |
|---|---|---|
| Enemy tokens | **73** definitions, ×N per pile | Round tokens; 5 colours + white/red city variants |
| Skill tokens | **72** (≈10 per hero) | Small; icon + name |
| Map tiles | **19** (11 countryside + 4 core non-city + 4 city) + starting tile (2 sides) | Hex tiles; the biggest single-art items |
| Ruins tokens | **15** | Hexagonal |
| Site description cards | **~12** (village, monastery, keep, mage tower, dungeon, tomb, ancient ruins, monster den, spawning grounds, crystal mine, magical glade, city) | Reference cards; can be UI panels instead |
| Mana dice / crystals | **6 colours** (red, blue, green, white, gold, black) | Dice can be rendered; crystals are icons |
| Hero figures / shields | **7** figures + shield tokens | Optional in digital (use a marker) |
| **Subtotal** | **≈ 130–140 distinct images** | |

### 2.3 Icons and UI

| Asset family | Count (est.) | Notes |
|---|---|---|
| Mana icons | 6 flat + 6 glossy = 12 | Colours are load-bearing |
| Combat / stat icons | ~15 (melee, ranged, siege, block, fire/ice/cold-fire attack & block, armour, fame, influence, healing, movement, level) | |
| Enemy ability icons | **16** (Fortified, Swift, Brutal, Poison, Paralyze, Summon, Cumbersome, Vampiric, Fire/Ice/ColdFire attack, Elusive, Arcane Immunity, Assassination, Defend, Resistance) | Ability legibility is critical |
| Site icons | ~12 | |
| Card-frame furniture | 1 frame template × 4 card types + backs | Can be one template + tints |
| UI chrome | panels, buttons, tooltips, hex highlights, deck/discard piles, phase indicators, damage chips | ~30–50 elements, mostly CSS/SVG |
| **Subtotal** | **≈ 90–110** | Mostly vector |

### 2.4 Audio

| Family | Count | Notes |
|---|---|---|
| Ambient music layers | 3–6 loops (pad, strings, piano, nature) | The flagship uses two simultaneous layers (music + nature) with crossfade |
| UI SFX | 8–15 (card deal, card play, hover, dice roll, damage, wound, level up, coin/influence) | |
| Combat SFX | 5–10 | Optional for MVP |
| **Subtotal** | **≈ 20–30** | All replaceable with CC0 |

### 2.5 Fonts

| Need | Count | Notes |
|---|---|---|
| Display face (titles, hero names) | 1 | Evocative but legible; OFL available |
| Body/UI face | 1 (2–4 weights) | Must be highly legible at 12–14 px |
| Numeric/stat face | optional | |

### 2.6 Totals

| Category | Full MKUE | MVP (see §8) |
|---|---|---|
| Card faces | 176 unique | ≈60 |
| Tokens/tiles/board | ≈135 | ≈20 |
| Icons/UI | ≈100 | ≈45 |
| Audio | ≈25 | ≈10 |
| Fonts | 2 families | 1–2 families |
| **Total distinct assets** | **≈390–440** | **≈120–135** |

Cross-check against shipped projects: `kyle-ip`'s published site contains **72 enemy images,
27 tile images, 16 hero images, 12 card-sheet atlases, 30 site images, 25 icons, 12 mana icons,
14 sounds** — i.e. it covers the game by using **card sheets (atlases)** rather than 176 individual
card images, which is the right technical choice at any scale.

---

## 3. Official art: what exists and its licensing status

| Asset | Where it exists | Licensing status |
|---|---|---|
| Card illustrations, card frames, icons | Physical cards; scans circulate in every fan project | **© WizKids; not licensed for reuse.** Illustrators credited: J. Lonnee, Milan Vavroň, Octographics.net (MKUE Rulebook, p.22) |
| Map tiles, enemy tokens, site tokens | Physical components; scanned by fan projects | **© WizKids; not licensed** |
| Hero art and hero cards | Physical components | **© WizKids; not licensed** |
| Logo and wordmark | Packaging, rulebook | **Trademark of WizKids** (Master Reference Sheet, p.2: "HeroClix, WizKids, Mage Knight are trademarks of WIZKIDS/NECA, LLC.") |
| Rulebook PDFs | Published free by WizKids for download | Free to **read**; "© 2018 WizKids/NECA, LLC … All rights reserved" (MKUE Rulebook, p.22). Not a redistribution or derivative licence |
| Official fonts | Embedded in the printed product and PDFs | Licensed commercial faces ⚠️ (not identified in the rulebook); extracting them from PDFs is a separate violation |
| Music/SFX | Not published by WizKids | n/a — fan projects use stock libraries |

**How the existing projects handle it** (evidence from `05`):

| Project | Art strategy | Legal character |
|---|---|---|
| `mage-knight-digital/MageKnight` | **External asset pack** (Cloudflare R2), repo contains 0 binary files; `.gitignore`: "Game assets (potentially copyrighted)" | Deliberate separation; art still unlicensed scans |
| `kyle-ip/mage-knight` | **Bundles** official card sheets, 72 enemy images, tiles, plus the 3 official rulebook PDFs | Highest exposure; disclaimer only |
| `yav/MageKnight`, `kevinwurn/MageKnight` | Bundle card images in-repo | Same |
| TTS / Vassal mods | Bundle scans in workshop items / `.vmod` | Same; largest audience |

**Conclusion:** there is no lawful source of official Mage Knight art for a third-party digital
product. Any use is unlicensed reproduction (`06` §2–4). The decision is not "which official art is
safe" but "do we make our own, buy it, or go art-light".

---

## 4. Legal asset sources by category

### 4.1 Icons — the highest-leverage legal shortcut

Icons carry most of this game's information. A complete, professional icon set is available free.

| Source | Licence | Scale | Attribution | Fit |
|---|---|---|---|---|
| **[game-icons.net](https://game-icons.net/about.html)** | **CC BY 3.0** — "you can use them freely as long as you credit the original author" | **4,180 SVG/PNG icons** (verified 2026-10-24) | Required (per-icon author credit) | ★★★★★ Fantasy/RPG iconography, exactly the vocabulary needed (swords, shields, boots, mana, skulls, towers) |
| **[Lucide](https://lucide.dev/license)** | **ISC** (MIT for some legacy icons) | Large UI icon set (1,000+) ⚠️ count not verified | Not required (ISC) | ★★★★☆ UI chrome, not fantasy art |
| **[Kenney](https://kenney.nl/assets)** | **CC0** — "public domain licensed (CC0)… free to use, even in commercial projects"; attribution not required | Large 2D/3D/UI/audio library | Not required | ★★★☆☆ UI/board-game-friendly pieces; less fantasy-specific |
| **[OpenGameArt](https://opengameart.org/content/faq)** | Per-asset: CC0, CC BY, CC BY-SA, GPL | Large community library | Per asset | ★★★☆☆ Variable quality; **CC BY-SA is a trap** for a proprietary game |
| Font Awesome free | Free tier (CC BY 4.0 icons / SIL OFL fonts / MIT code) ⚠️ tier rules vary | Large ⚠️ count not verified | Required for free tier | ★★☆☆☆ Too "web UI" |

**Recommendation:** game-icons.net for game vocabulary + Lucide for UI chrome. Budget ~2 days to
select ~60 icons, recolour to a coherent palette, and build an attribution file.

### 4.2 Fonts

| Source | Licence | Notes |
|---|---|---|
| **Google Fonts** | Almost all **SIL OFL 1.1** (some Apache 2.0 / UFL) — verified on the OFL text in the fonts' own repos, e.g. [Spectral](https://github.com/google/fonts/blob/main/ofl/spectral/OFL.txt), [Cinzel](https://github.com/google/fonts/blob/main/ofl/cinzel/OFL.txt), [IM Fell English](https://github.com/google/fonts/blob/main/ofl/imfellenglish/OFL.txt) | Free for commercial use, embedding, and web. Ship the OFL text. |
| **[openfontlicense.org](https://openfontlicense.org/)** | SIL OFL 1.1 text/FAQ | The canonical reference |
| System fonts (`system-ui`) | No licence needed | What the flagship uses; zero cost, zero risk, slightly generic |

**Recommended pairing for a fantasy board-game feel that is legal and legible:**
- Display: **Cinzel** (OFL) — engraved/Roman caps, close to "ancient fantasy" without copying MK.
- Body/UI: **Spectral** or **Source Serif** (OFL) for flavour text; **Inter** (OFL) or system-ui for
  dense stat UI.
- Numerals: keep UI numerals in a tabular sans (Inter) — crucial for combat maths.

⚠️ Do **not** extract the official product's display face from PDFs or scans. Also avoid
"look-alike" fonts that imitate the official logo lettering — that edges into trade dress (`06` §2).

### 4.3 Illustration (heroes, cards, tiles, enemies)

| Path | Cost | Time | Risk | Quality ceiling |
|---|---|---|---|---|
| **Commission** an illustrator | ⚠️ planning range **$80–$400 per card illustration**, **$200–$800 per hero portrait**, **$150–$500 per map tile** (see §6.3) | 3–6 weeks for ~20 pieces | Low (with a written licence/assignment) | High, cohesive |
| **Buy stock/royalty-free** illustration packs | $20–$200 per pack | days | Medium (style mismatch; licence terms vary) | Medium |
| **CC0 packs** (Kenney, OpenGameArt CC0) | $0 | days | Low | Medium-low; fantasy portraits are scarce in CC0 |
| **AI-generated art** | tool costs ~$0–$100/mo | hours per image | ⚠️ **Copyright uncertainty**: the US Copyright Office treats works lacking human authorship as not copyrightable ([copyright.gov/ai](https://www.copyright.gov/ai/)); you may not be able to stop others reusing it, and some stores require disclosure | Medium-high, inconsistent |
| **No illustration — art-light design** | $0 | days | None | Legible, stylish, "tool-like" (the flagship's own product north star) |

**The art-light option is not a cop-out.** The game's decision information is numeric and
iconographic. The flagship's PRODUCT.md explicitly rejects "epic heroic bombast" and "dominant
mystical fantasy cliché" in favour of legibility; its DESIGN.md uses system fonts, flat OKLCH
surfaces, and thin borders. A well-designed card frame + icon + typographic hierarchy can carry the
game. Illustration then becomes a **stretch goal**, not a blocker.

### 4.4 Audio

| Source | Licence | Notes |
|---|---|---|
| **[Freesound](https://freesound.org/help/faq/)** | CC0 / CC BY (per sound; avoid CC BY-NC and Sampling+) | Huge library; filter to CC0 for zero obligations |
| **[Incompetech](https://incompetech.com/music/royalty-free/licenses/)** (Kevin MacLeod) | "Creative Commons — Free. No charge. Requires that you credit the music." | Ambient/fantasy beds; attribution required |
| **Kenney audio packs** | CC0 | UI clicks, card sounds, dice |
| **Commission** a composer | ⚠️ $200–$2,000 per loop / $1k–$5k for a small original score | Cohesive, ownable |

**Recommendation:** Kenney CC0 for UI/card SFX, Freesound CC0 for ambience, one Incompetech track
if you need a music bed (with credit). Total $0.

### 4.5 UI, frames, and board art

| Approach | Cost | Notes |
|---|---|---|
| **CSS/SVG-drawn frames** | $0 | Card frames are rounded rectangles + header band + type colour + icon slots. The flagship does exactly this for overlays and chrome. |
| **Vector hex tiles** (SVG, procedurally tinted) | $0 | Terrain = flat colour + icon + texture pattern; perfectly legible, scales to any DPI |
| **Commissioned UI kit** | ⚠️ $500–$3,000 | Only if you need a distinctive brand |
| **Public-domain engraving textures** | $0 | 19th-century fantasy engravings (Old Book Illustrations, museum open-access collections) for texture/atmosphere |

Public-domain image sources worth knowing: **The Met Open Access** (its Collection API is public:
[metmuseum.github.io](https://metmuseum.github.io/)), **Rijksmuseum**, **NYPL Digital
Collections**, **Old Book Illustrations**. ⚠️ Check each item's status — "open access" is not always
"public domain", and some collections require attribution.

---

## 5. What the official art would cost to replace (order of magnitude)

If you wanted **full visual parity with the physical game** using commissioned art:

| Category | Count | ⚠️ Unit | ⚠️ Total |
|---|---|---|---|
| Card illustrations | ~176 | $150 | ~$26,400 |
| Hero portraits | 7 | $400 | ~$2,800 |
| Map tiles | 19 | $250 | ~$4,750 |
| Enemy tokens | 73 | $60 | ~$4,400 |
| Site/token/ruins art | ~30 | $60 | ~$1,800 |
| Icons (custom set) | ~60 | $15 | ~$900 |
| UI kit + card frames | 1 | $2,000 | ~$2,000 |
| Music + SFX | ~25 | — | ~$2,000 |
| **Total** | | | **≈ $45,000** |

That number is the real reason every fan project uses scans. **The rational MVP does not attempt
visual parity** — it spends $0–$3,000 on a coherent iconographic style and defers illustration.

---

## 6. Cost model (how to use the numbers honestly)

### 6.1 What is free and unambiguously legal

| Item | Licence | Cost |
|---|---|---|
| Icons (game-icons.net) | CC BY 3.0, attribution | **$0** |
| UI icons (Lucide) | ISC | **$0** |
| Fonts (Google Fonts OFL) | SIL OFL 1.1 | **$0** |
| UI/SFX (Kenney) | CC0 | **$0** |
| Ambience (Freesound CC0) | CC0 | **$0** |
| Music bed (Incompetech) | CC BY, attribution | **$0** |
| CSS/SVG card frames and hex tiles | your own work | **$0** |

A complete, shippable, legally clean **art-light** MVP is therefore possible at **$0 in asset
cost**, with the real cost being **design time (~2–4 weeks)**.

### 6.2 What costs money

| Item | ⚠️ Planning range | Notes |
|---|---|---|
| One commissioned card illustration | $80–$400 | Depends on artist seniority and usage rights |
| One commissioned hero portrait | $200–$800 | |
| One commissioned map tile | $150–$500 | Larger canvas, more detail |
| Full small original score | $1,000–$5,000 | |
| Custom UI/brand kit | $500–$3,000 | |

### 6.3 How to replace the ⚠️ numbers with real ones (1 week)

1. Write a **one-page brief** (style references, count, sizes, usage rights, deadline) — the
   hiring guide at [hireanillustrator.com/i/pricing](https://www.hireanillustrator.com/i/pricing/)
   describes the standard Brief→Budget→Style→Select→Communicate process.
2. Request **quotes from 3–5 artists** at different seniority levels. Ask explicitly for
   **commercial usage rights, exclusivity, and source-file delivery**.
3. Compare against **2 stock/CC0 alternatives** and **the art-light baseline ($0)**.
4. Record everything in `docs/` so the decision is auditable (same discipline as `08-sources.md`).

⚠️ Rate figures here are indicative market ranges assembled from general industry practice; I could
not retrieve a single authoritative public rate card (Upwork and similar pages are bot-blocked, and
the Graphic Artists Guild's handbook is a paid publication). Treat them as a starting hypothesis for
your own quotes, not as data.

---

## 7. Buy / borrow / build table

| Asset category | Recommended | Why | Cost | Risk |
|---|---|---|---|---|
| **Card frames / layout** | **Build** (CSS/SVG) | Frames are geometry; drawing them yourself is faster than licensing a kit and avoids trade-dress problems | $0 | none |
| **Icons (game vocabulary)** | **Borrow** (game-icons.net, CC BY 3.0) | 4,180 fantasy icons cover the entire vocabulary | $0 | attribution obligation only |
| **Icons (UI chrome)** | **Borrow** (Lucide, ISC) | Clean, consistent, no attribution needed | $0 | none |
| **Fonts** | **Borrow** (Google Fonts OFL: Cinzel + Inter/Spectral) | Legal, high quality, free for commercial use | $0 | ship OFL text |
| **Hex map tiles** | **Build** (SVG, procedural tint + icon) | Terrain is a colour + symbol; vector scales and is moddable | $0 | none |
| **Hero / card illustration** | **Defer** → commission later, or omit | Biggest cost, least decision value | $0 now / ⚠️ $45k for parity | low if deferred |
| **Enemy tokens** | **Build** (icon + colour + frame) | Enemy identity is icon+number+colour | $0 | none |
| **UI SFX** | **Borrow** (Kenney CC0) | Card/dice/click sounds are commodity | $0 | none |
| **Ambient music** | **Borrow** (Freesound CC0 / Incompetech CC BY) | Atmosphere is a later polish pass | $0 | attribution if CC BY |
| **Official art / scans / PDFs** | **Do not use** | Unlicensed reproduction (`06`) | — | high |
| **AI-generated illustrations** | **Optional, later** | Cheap and fast, but copyright and store-policy uncertainty | ~$0–$100/mo | medium |
| **Brand/logo** | **Build** (or commission once) | Needed only for a public product; must not resemble MK logo | $0–$500 | low |

---

## 8. MVP starter asset plan (concrete)

Scope assumption: solo/co-op, **2 heroes**, one tuned scenario, reduced card pool
(see `11-mvp-scope.md`; adjust counts if the Lead's scope differs).

### 8.1 Asset manifest

| Category | MVP count | Approach | Cost |
|---|---|---|---|
| Fonts | 2 families (Cinzel display + Inter UI) | Google Fonts OFL | $0 |
| Card frame template | 1 template × 5 types (basic, advanced, spell, artifact, wound) | CSS/SVG | $0 |
| Card faces — basic actions | **32** (2 heroes × 16) | Text + icon + colour, no illustration | $0 |
| Card faces — advanced actions | **20** | same | $0 |
| Card faces — spells | **6** | same, tinted by colour | $0 |
| Card faces — artifacts | **4** | same | $0 |
| Unit cards | **12** | icon + stats | $0 |
| Hero cards | **2** | icon + stats + inventory | $0 |
| Skill tokens | **10** | icon + name | $0 |
| Tactic cards | **4** | icon | $0 |
| Enemy tokens | **8** (one per colour + site defenders) | icon + colour + frame | $0 |
| Map tiles | **4** (1 starting + 3 countryside/core) | SVG hex, terrain tint + icon | $0 |
| Site markers | **3** (village, keep, dungeon) | icon + frame | $0 |
| Mana icons | 6 colours | game-icons.net recolour | $0 |
| Combat/stat icons | ~20 | game-icons.net | $0 |
| Enemy ability icons | 8 (subset used by MVP enemies) | game-icons.net | $0 |
| UI chrome | ~15 elements | CSS | $0 |
| Ambient loop | 1–2 | Freesound CC0 | $0 |
| UI SFX | 8 | Kenney CC0 | $0 |
| **Total** | **≈120 assets** | | **$0** |

### 8.2 Build order (suggested, ~2–3 weeks of design time)

1. **Design tokens first** (colours, type scale, spacing, radii) — one file, referenced by everything.
   The flagship's DESIGN.md is a good model of scope (OKLCH surfaces, system sans, thin borders).
2. **Card frame template** — the most-reused asset in the game; get it right before mass-producing cards.
3. **Icon pipeline** — select ~45 game-icons.net SVGs, normalise viewBox/colour, write `CREDITS.md`
   with per-icon author attribution (CC BY requirement).
4. **Hex tile generator** — SVG template + terrain definitions (colour, icon, movement cost badge).
5. **Card face generation from data** — never hand-author 32 card images; render them from the same
   data the engine uses (single source of truth, and re-skins become free — see `06` §8 option D).
6. **Audio pass last** — 1 ambient loop + 8 SFX is enough for an MVP.

### 8.3 Technical conventions

| Item | Recommendation | Rationale |
|---|---|---|
| Icons | **SVG**, single-colour, `currentColor` | Crisp at any DPI; recolour by CSS; tiny |
| Card faces | **Rendered from data at runtime** (DOM or canvas) | Avoids 170+ static files; localisation and re-theming become free |
| Card atlases | Only if you ship illustration: 4 sheets (basic/advanced/spells/artifacts) + `atlas.json` | Mirrors the two precedents that ship art |
| Map tiles | SVG hex, 1024 px equivalent | Rotation must be supported from day one (`05` §5) |
| Enemy tokens | 256–512 px PNG/SVG | Circular crop, transparent outside |
| Audio | `.ogg`/`.webm` + `.mp3` fallback; **no** uncompressed `.wav` in production | The flagship's `audio/music/*.wav` are development-only |
| Fonts | WOFF2, self-hosted, `font-display: swap` | No third-party font CDN dependency at runtime |
| Licences | One `CREDITS.md` + per-file provenance table | Required for CC BY, and the checklist in `06` §9 |
| Repository | **Assets out of git** (or via LFS), versioned separately | Mirrors the flagship's `.gitignore` policy |

---

## 9. What not to do

| Don't | Why |
|---|---|
| Ship scans of cards/tiles/tokens | Unlicensed reproduction (`06` §2–4); this is what puts every fan project at Tier 3 |
| Bundle the official rulebook PDFs | Same; `kyle-ip` does this and is the most exposed project in the survey |
| Extract fonts or vector art from the official PDFs | Separate violation; also produces low-quality assets |
| Imitate the MK logo lettering or card-frame trade dress | Trademark/trade dress risk even with original art |
| Use CC BY-SA or GPL assets | Their copyleft can infect your distribution obligations — avoid for a proprietary game |
| Use CC BY-NC assets in a paid product | Licence violation |
| Ship uncompressed `.wav` audio | 10–20× larger than needed |
| Hand-author 170 card images | Unmaintainable; generate from data |
| Commit large binaries to git | Repo bloat; the flagship keeps assets on R2/B2 for exactly this reason |

---

## 10. Recommendations

1. **MVP: art-light, $0 asset budget.** OFL fonts + game-icons.net + Lucide + CSS/SVG frames +
   Kenney/Freesound audio. This is legally clean, fast, and matches the product's legibility-first
   thesis.
2. **Generate card/token faces from game data** at runtime. It is the cheapest path now and makes a
   future re-theme (`06` §8, option D) nearly free.
3. **Defer illustration.** If the MVP proves fun, commission a **small, coherent set** (7 hero
   portraits + 20 signature cards ≈ ⚠️ $4k–$8k) rather than parity.
4. **Keep official art out of the product and out of the repo**, exactly as the flagship does with
   its external asset pack — and unlike kyle-ip, do not bundle official PDFs.
5. **Record provenance from the first asset.** A `CREDITS.md` with a licence column is the cheapest
   legal insurance you will ever buy.

---

## Sources

**Licences verified directly (retrieved 2026-10-24):**
- game-icons.net — CC BY 3.0, 4,180 icons: <https://game-icons.net/about.html>
- Kenney — CC0, no attribution required: <https://kenney.nl/support>; asset library: <https://kenney.nl/assets>
- Lucide — ISC (MIT for some icons): <https://lucide.dev/license>
- SIL Open Font License: <https://openfontlicense.org/>
- OFL text for candidate fonts: [Spectral](https://github.com/google/fonts/blob/main/ofl/spectral/OFL.txt), [Cinzel](https://github.com/google/fonts/blob/main/ofl/cinzel/OFL.txt), [IM Fell English](https://github.com/google/fonts/blob/main/ofl/imfellenglish/OFL.txt)
- Freesound — CC0 / CC BY: <https://freesound.org/help/faq/>
- Incompetech — "Creative Commons — Free. No charge. Requires that you credit the music.": <https://incompetech.com/music/royalty-free/licenses/>
- OpenGameArt — licence explanation: <https://opengameart.org/content/faq>
- US Copyright Office, Copyright & AI: <https://www.copyright.gov/ai/>
- The Met Collection API (open access): <https://metmuseum.github.io/>
- Hiring/commissioning process guide: <https://www.hireanillustrator.com/i/pricing/>

**Official ownership (primary sources on disk, see `08-sources.md`):**
- MKUE Rulebook, p.22 — "Illustrations: J. Lonnee, Milan Vavroň, Octographics.net"; "© 2018 WizKids/NECA, LLC … All rights reserved."
- Master Reference Sheet, p.2 — "HeroClix, WizKids, Mage Knight are trademarks of WIZKIDS/NECA, LLC."
- WizKids product page with rules downloads: <https://wizkids.com/mage-knight-ultimate-edition/>

**Asset inventory cross-checks:**
- `mage-knight-digital/MageKnight` `mk-data` (245 card definitions, 73 enemies, 72 skills, 31 units, 44 advanced actions, 24 spells, 25 artifacts, 19 tiles, 15 ruins tokens, 12 tactics, 7 heroes): <https://github.com/mage-knight-digital/MageKnight/tree/main/packages/engine-rs/crates/mk-data>
- Asset path contract (what a complete pack contains): <https://github.com/mage-knight-digital/MageKnight/blob/main/packages/client/src/assets/assetPaths.ts>
- `kyle-ip` published asset counts (72 enemies, 27 tiles, 16 heroes, 12 card sheets, 30 sites, 25 icons, 12 mana icons, 14 sounds): <https://github.com/kyle-ip/mage-knight/tree/gh-pages>
- Tabletop Simulator / Vassal asset practice: `05` §3
