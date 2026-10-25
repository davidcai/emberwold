# 16 · Art Brief — direction, specs and acceptance

**Status:** v1.0 (v2 style, 2026-10-25) · **Owner:** Lead · **Decisions:** ADR-006 (100%
AI-generated art), ADR-002 (original IP only), ADR-005 placeholder policy;
[`15-retheme-bible.md`](./15-retheme-bible.md) (names/world).

> **One rule:** art can arrive in any order, and engineering can finish v1 even if none of it
> arrives. Every asset exists as a named slot with a programmatic placeholder; finals are a
> drop-in replacement.

---

## 1. Scope

A coherent visual identity for **Emberwold / First Conquest**: a weary folk-fantasy world of
ember-light against the gloam, seen through cards and a hex map.

- **41 slots** in [`art/manifest.json`](../../art/manifest.json) — 2 heroes, 12 enemy tokens,
  4 map tiles, 1 Seat plate, 8 sites, 12 card motifs, 1 key art, and 1 logo (not AI); 19 P0 /
  21 P1 / 1 P2.
- **Not art:** UI components, icons, fonts and frames come from an open icon set + OFL fonts
  + a small design-system pass.
- **Sourcing:** 100% AI-generated (ADR-006) in the **ChatGPT desktop app** (primary) or
  **Grok Imagine** (fallback); no illustrator, no local models. Prompts:
  [`art/PROMPTS.md`](../../art/PROMPTS.md) / [`art/prompts.json`](../../art/prompts.json);
  workflow: [`18-ai-art-prompts.md`](./18-ai-art-prompts.md).
- **Placeholders are a supported state**, never a temporary hack (ADR-005/ADR-006).

## 2. Art direction

**Style:** stylized 2D illustration — warm ink linework, smooth cel shading, flat mid-tones,
clean readable shapes. A cozy-gritty storybook-adventure look: hand-made gear, mended
materials, matte finish, no rendered texture or photographic detail. Readable first, beautiful
second. Not photoreal, not glossy 3D.

**Mood words:** mended, soot, ember, old iron, cold moonlight, quiet dread, stubborn hope.

**Composition rules**
- **Silhouette-first.** Every enemy/token must be identifiable as a black shape at 48 px.
- **One focal point**, centred or rule-of-thirds; tokens need a clear centre for the token ring.
- **Value structure:** flat mid-tone fills with soft shadow transitions; dark ink contours carry
  the shape; one ember-bright accent per piece. No more than ~3 values per small piece.
- **Lighting:** soft, even light from the upper front with gentle contact shadows; warm ember
  temperature for day pieces, cool gloam for night pieces; no dramatic chiaroscuro, no coloured
  rim lights.
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

**Palette usage in the v2 rendering** (the nine-colour canon is unchanged; only the rendering
changes):

| Canon | v2 use |
|---|---|
| soot #17120F / charcoal #2A221C | linework and leather; warm it to umber #312523 for outlines |
| root #6E8F4E | moss green #7D8B50 fills, #C4D553 highlight |
| ember #E0662E | bright accents only; rust cloth fills #9C5A4E |
| gold #E3B341 | dull brass #AD9A70 |
| bone #E7DCC6 | parchment off-whites #E9E5D9 / #E1DFD6 |
| rime, gale, gloam | unchanged (gloam/night pieces) |

**Reference direction** (mood only, never copy, never use as image input): mended-medieval
material culture; hand-inked storybook and indie tabletop illustration; modern board-game card
art where the frame does the ornament and the illustration does the story.

## 3. Deliverables and technical specs

| Spec | Requirement |
|---|---|
| Colour profile | sRGB, 8-bit |
| Hero portraits | 2048×2048 px, PNG; keep the generation set + a layered working file where possible |
| Enemy portraits/tokens | 1024×1024 px, PNG with transparent background; subject fills ~80% |
| Map tiles | 2048×2368 px (hex ratio), PNG, full-bleed, no baked grid/labels |
| Seat plate | 2048×1536 px, PNG |
| Site illustrations | 1024×1024 px, PNG, transparent or simple vignette |
| Card motifs | 1024×768 px, PNG, two variants: tinted (background) + transparent (icon) |
| Key art | 3840×2160 px, PNG |
| Variants | Each P0 piece also delivered at web size (≤ 512 px, WebP) |
| Naming | `art/<category>/<neutral_id>@2x.png` — e.g. `art/hero/emberdrinker_portrait@2x.png` |

`art/manifest.json` is canonical for per-slot sizes and IDs. Naming uses **neutral IDs** from
the content pack, never the working titles.

## 4. Placeholder policy (non-negotiable)

1. Every art slot exists from day one in `art/manifest.json` with `status: placeholder`.
2. The renderer draws a **procedural placeholder**: category-coloured panel, neutral ID
   glyph, silhouette, and the asset's intended size — so layout and readability are testable.
3. Placeholders may come from **CC0** packs (`07` §4.1) or simple SVG shapes. **Never** from
   official Mage Knight art, scans, or screenshots, even temporarily and even privately.
4. AI drafts may be used as blocking/moodboards when the tool terms permit; final slots still
   need the acceptance pass (§6) and a manifest update.
5. Final art swaps in by changing `art_ref` in the content pack — no code change.

## 5. Pipeline and conventions

- **Folders:** see [`art/README.md`](../../art/README.md). `art/source/` is gitignored;
  `art/manifest.json` tracks every slot.
- **Import:** PNG → WebP at build time; generate a texture atlas for tokens/card motifs.
- **Icons:** SVG → runtime tint; no per-colour exports.
- **Unique-art-to-screen-area:** keep it low — card faces reuse motifs, not 40 unique
  paintings. This is the single biggest cost lever.
- **Traceability:** keep the prompt log (`18` §8.5) and record tool/model/date per piece.

## 6. Acceptance checklist

- [ ] Reads at target size (tokens: 48/96 px; cards: 96 px tall thumb; tiles: full map).
- [ ] Silhouette test: recognizable in pure black on white.
- [ ] Palette fits the nine-colour set; element piece has a non-colour cue.
- [ ] Ink linework and smooth cel shading consistent with the style block; no painterly
  texture or 3D gloss.
- [ ] No text, no logos, no embedded UI.
- [ ] None of the forbidden terms or copied designs (spot-check against `15` §6 list).
- [ ] Transparent background where required; no halos at edges.
- [ ] Consistent with the 3–5 style-lock pieces.
- [ ] Prompt log entry complete; naming matches the manifest, neutral IDs only.

## 7. Open questions

1. Art shipping: in-repo (small) vs LFS/asset bundle once the set passes ~50 MB.

## Sources

- `07-assets-art-inventory.md` (asset inventory, legal sources — its cost/commission sections
  are historical research and are superseded by ADR-006).
- `15-retheme-bible.md` §8 (visual identity, palette).
- `11-mvp-scope.md` (content counts driving the manifest).
