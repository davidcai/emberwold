# 16 · Art Brief — commissioning the First Conquest set

**Status:** v0.1 · **Owner:** Lead · **Decisions:** ADR-005 (commission early; placeholders
never block), ADR-002 (original IP only), `15-retheme-bible.md` (naming/world)

> **Update 2026-10-24 — ADR-006:** the owner chose **100% AI-generated art**. The primary
> workflow and per-slot prompts are in [`18-ai-art-prompts.md`](./18-ai-art-prompts.md) +
> [`art/prompts.json`](../../art/prompts.json). Everything below remains the **specification**
> (style, palette, sizes, acceptance); the commissioning and budget sections (§4, §6) are kept
> as a fallback if AI quality is insufficient for a given asset.

> **One rule:** art can arrive in any order, and engineering can finish v1 even if none of it
> arrives. Every asset exists as a named slot with a programmatic placeholder; finals are a
> drop-in replacement.

---

## 1. What we are buying

A coherent visual identity for **Emberwold / First Conquest** (working title): a weary
folk-fantasy world of ember-light against the gloam, seen through cards and a hex map.

**Not buying:** UI components, icons, fonts or frames as one-off art. Those come from an open
icon set + OFL fonts + a small design-system pass (cheap, consistent, and swappable).

**Buying from an illustrator (MVP):**

| Priority | Item | Count | Notes |
|---|---|---:|---|
| P0 | Hero portraits | 2 | one per v1 hero, bust/3-quarter, usable in select + HUD |
| P0 | Enemy portraits (tokens) | 12 | 10 regular + 2 Seat Guard; must read at 96 px |
| P0 | Map tile art | 4 | 1 start + 2 countryside + 1 Seat; painted, tileable hex |
| P0 | Seat (city) plate | 1 | the visual climax; used on assault screen |
| P1 | Site illustrations | 8 | village, choir, watchhold, spire, glade, shardmine + city/portal |
| P1 | Key art / splash | 1 | 16:9, used for title + store/portfolio |
| P1 | Card motifs | 10–12 | one per card family (movement, attack, block, ember, etc.), reused across ~40 cards |
| P2 | Logo / wordmark | 1 | mostly typography + a mark; designer, not illustrator |
| P2 | Atmosphere plates | 2 | combat backdrop, table texture |
| — | Icons (elements/keywords) | ~20 | **not commissioned** — from an open icon set (`07` §4.1) |
| — | Card frame + back, panels, buttons | 1 system | designer pass, not illustration |

**Total commissioned for MVP: ≈ 39–43 pieces**, of which **12 enemies + 12 card motifs** are
small and repeatable. Full MKUE later needs ≈ 150–250 (see `07`).

## 2. Art direction

**Style:** painterly but disciplined — matte surfaces, visible brush texture, strong value
contrast, restrained detail. Readable first, beautiful second. Not photoreal, not cartoon, not
"mobile game glossy".

**Mood words:** mended, soot, ember, old iron, cold moonlight, quiet dread, stubborn hope.

**Composition rules**
- **Silhouette-first.** Every enemy/token must be identifiable as a black shape at 48 px.
- **One focal point**, centred or rule-of-thirds; tokens need a clear centre for the token ring.
- **Value structure:** dark ground, mid subject, one ember-bright accent. No more than ~3
  values per small piece.
- **Lighting:** single warm key (ember) or single cool key (gloam) per piece — never both
  equally; the day/night cycle reads through light, not hue alone.
- **No text, no logos, no UI** inside illustrations. Text is overlaid by the engine.
- **No existing game's art, creatures-as-copied, or trademarked silhouettes.** Wyrmspawn are
  horned reptiles in *our* world; they must not be drawn as any known game's dragon design.

**Palette (sRGB)**

| Role | Hex | Use |
|---|---|---|
| Soot | `#17120F` | backgrounds, shadows |
| Charcoal | `#2A221C` | mid-dark surfaces |
| Bone | `#E7DCC6` | card faces, highlights |
| Ember | `#E0662E` | fire, danger, primary accent |
| Rime | `#4FA8B8` | frost/water, cool accent |
| Root | `#6E8F4E` | nature, healing |
| Gale | `#DCE6E8` | air, light |
| Gold | `#E3B341` | special mana, rewards |
| Gloam | `#5B4B8A` | night, corruption |

Element colours must be paired with a **glyph/shape** in UI (colour-blind safety) and remain
distinct in greyscale.

**References to brief the illustrator** (mood only, never copy): mended-medieval material
culture; chiaroscuro painting; modern board-game card art where the frame does the ornament
and the illustration does the story.

## 3. Deliverables and technical specs

| Spec | Requirement |
|---|---|
| Colour profile | sRGB, 8-bit |
| Hero portraits | 2048×2048 px, PNG, layered source (PSD/CLIP/KRA) |
| Enemy portraits/tokens | 1024×1024 px, PNG with transparent background; subject fills ~80% |
| Map tiles | 2048×2368 px (hex ratio), PNG, full-bleed, no baked grid/labels |
| Seat plate | 2048×1536 px, PNG |
| Site illustrations | 1024×1024 px, PNG, transparent or simple vignette |
| Card motifs | 1024×768 px, PNG, two variants: tinted (background) + transparent (icon) |
| Key art | 3840×2160 px, PNG |
| Variants | Each P0 piece also delivered at web size (≤ 512 px, WebP) |
| Layering | Background / subject / effects separated where relevant |
| Naming | `art/<category>/<neutral_id>@2x.png` — e.g. `art/hero/emberdrinker_portrait@2x.png` |
| Rights | written agreement, source files delivered (see §6) |

Naming uses **neutral IDs** from the content pack, never the working titles.

## 4. Budget scenarios (⚠️ planning estimates, not quotes)

Costs vary wildly by region/experience; these are sanity bands for a hobby budget, derived
from `07` §5.

| Tier | Spend | What it buys | Risk |
|---|---:|---|---|
| **Pilot (recommended first)** | **$300–700** | 4 pieces: 1 hero, 1 enemy, 1 tile, 1 site — to test style + collaboration | Low; if it goes badly, you lose little |
| Lean | $500–1,200 | pilot + enemies/tiles at smaller sizes, card motifs as icon-only, some CC0 textures | Style may look uneven |
| Balanced | $2,500–5,000 | all P0 + P1 above, consistent style, 2 rounds of revisions | The realistic MVP target |
| Fuller | $7,000–12,000 | balanced + P2, extra variants, promo art | Diminishing returns for v1 |

**Payment:** 50% at brief/kickoff, 50% on delivery for the pilot; milestone payments for
larger batches. Keep the pilot small enough that a bad fit is cheap.

## 5. Placeholder policy (non-negotiable)

1. Every art slot exists from day one in `art/manifest.json` with `status: placeholder`.
2. The renderer draws a **procedural placeholder**: category-coloured panel, neutral ID
   glyph, silhouette, and the asset's intended size — so layout and readability are testable.
3. Placeholders may come from **CC0** packs (`07` §4.1) or simple SVG shapes. **Never** from
   official Mage Knight art, scans, or screenshots, even temporarily and even privately.
4. AI-generated placeholders are allowed for blocking/moodboards only if the tool's terms
   permit and the output is not used as final shipped art (policy to be confirmed before
   use).
5. Final art swaps in by changing `art_ref` in the content pack — no code change.

## 6. Commissioning process

1. **Brief pack:** this document + `15-retheme-bible.md` §8 + 6–10 mood references + palette
   swatches + the neutral-ID list.
2. **Pilot batch** (≈$300–700): one hero, one enemy, one tile, one site. Review for:
   silhouette readability at 64 px, palette fit, style consistency, collaboration quality.
3. **Style lock:** agree 3–5 "golden pieces" as the visual standard.
4. **Batch 1:** 2 heroes + 12 enemies. **Batch 2:** 4 tiles + Seat + 8 sites + key art.
   **Batch 3:** card motifs + atmosphere.
5. **Review loop:** each piece gets 2 revision rounds (sketch → final). Reject any piece that
   fails the acceptance checklist (§8) before payment.
6. **Delivery:** layered source + web exports + written rights assignment.

**Contract checklist (plain-language, adapt as needed):**
- [ ] Work-for-hire *or* perpetual, worldwide, exclusive licence to use/modify/distribute
- [ ] Source files included
- [ ] Right to re-theme/rename the work (no names baked into art)
- [ ] 2 revision rounds defined; scope of "revision" limited
- [ ] Payment schedule and kill fee
- [ ] Credit line (optional for the artist; we offer it)
- [ ] AI-generation disclosure if the artist uses it
- [ ] No third-party IP in the deliverable (artist warrants originality)

## 7. Pipeline and conventions

```
art/
  manifest.json          # slots: id, category, size, status, placeholder, art_ref, source
  brief/                 # mood refs, palette, approved style-locks
  source/                # layered originals (gitignored — large binaries)
  final/                 # delivered PNGs/WebP (committed only if small; prefer LFS)
```

* Import: PNG → WebP at build time; generate a texture atlas for tokens/card motifs.
* Icons: SVG → runtime tint; no per-colour exports.
* Keep the ratio of **unique art to screen area** low: card faces reuse motifs, not 40
  unique paintings. This is the single biggest cost lever.

## 8. Acceptance checklist

- [ ] Reads at target size (tokens: 48/96 px; cards: 96 px tall thumb; tiles: full map).
- [ ] Silhouette test: recognizable in pure black on white.
- [ ] Palette fits the nine-colour set; element piece has a non-colour cue.
- [ ] No text, no logos, no embedded UI.
- [ ] None of the forbidden terms or copied designs (spot-check against `15` §6 list).
- [ ] Layered source delivered, naming matches the manifest, neutral IDs only.
- [ ] Transparent background where required; no halos at edges.
- [ ] Consistent with the 3–5 style-lock pieces.

## 9. Schedule assumption

A part-time illustrator can deliver the **pilot in 1–2 weeks** and the MVP set in **4–6 weeks**
without blocking engineering — provided the manifest and brief are stable. Batch 1 (heroes +
enemies) is the only P0 dependency for a public demo; tiles can ship as placeholder art much
later without hurting the demo.

## 10. Open questions

1. Budget tier: pilot only, or commit to Balanced after the pilot? *(Owner call; ADR-005 P2.)*
2. Do we want a distinct UI designer for frames/panels (recommended) or fold it into the
   illustrator's scope?
3. Portrait style: painterly realism vs. stylised graphic — pick after the pilot's 2
   sketches.
4. Do we ship art in-repo (small) or via LFS/asset bundle (recommended once > 50 MB)?

## Sources

- `07-assets-art-inventory.md` §4–§8 (sources, costs, MVP plan).
- `15-retheme-bible.md` §8 (visual identity, palette).
- `11-mvp-scope.md` (content counts driving the manifest).
