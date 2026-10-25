# 18 · AI Art Prompt Pack — workflow, consistency system and 41-slot prompt set

**Status:** v1.0 · **Owner:** art-prompt-writer (delegated) · **Date:** 2026-10-24
**Companions:** [`art/prompts.json`](../../art/prompts.json) (the machine-readable prompt
pack), [`15-retheme-bible.md`](15-retheme-bible.md) (names/world), [`16-art-brief.md`](16-art-brief.md)
(specs/acceptance). **Decision:** ADR-006 — art is 100 % AI-generated (supersedes ADR-005's
commissioning plan).

> **Reality statement — read this first.** **This document cannot and does not contain any
> images, and the agent that wrote it cannot generate images.** No image model was available
> in the session that produced this pack. What you have is a **copy-paste prompt pack +
> production workflow**: 41 prompts, one per manifest slot, that *you* run in a generator.
> The prompts have not been executed against any model — treat round 1 as calibration, not
> as a final. Nothing here replaces the placeholder policy: the build stays playable with
> procedural art (ADR-005 and ADR-006, `16` §4).

**Coverage:** 41/41 manifest slots (`key_art`, `logo`, 2 heroes, 12 enemies, 4 tiles,
`seat_plate`, 8 sites, 12 card motifs). Machine check:

```bash
.venv/bin/python -c "import json; d=json.load(open('art/prompts.json')); \
ids={s['id'] for s in d['slots']}; m=json.load(open('art/manifest.json')); \
print(len(ids), set(x['id'] for x in m['slots'])-ids)"   # → 41 set()
```

---

## 0. TL;DR — how to use this pack

1. **Open the ChatGPT desktop app** (primary route; Grok Imagine as fallback — §2). No local
   models, no CLI, no API key setup.
2. **Generate the style lock first** (§4.1) under the current style block: one hero, one enemy
   token, one card motif and one tile. Do not batch the other 37 slots until these 4 pass the
   checklist in §7.
3. **Per slot:** open [`art/PROMPTS.md`](../../art/PROMPTS.md) (or `art/prompts.json`), paste
   the slot prompt plus its inline **Avoid** list into the chat, state the aspect ratio, and
   attach the approved style-lock image(s) as references. The slot prompts are standalone.
4. **Iterate in 3 rounds** (§4.4): 6–12 cheap thumbnails → pick 2–3 → refine → final.
5. **Post-process** (§4.5): inpaint defects, cut out background where required, upscale,
   grade to the palette, crop/mask tiles to hex, export web sizes.
6. **Log and mark up** (§9): tool + model version + prompt ref + licence check date
   in the prompt log, then set `status`/`art_ref` on the manifest slot. Swap into the build
   via the content pack only.
7. Work **P0 first** (heroes → enemies → tiles → Seat plate), P1 next, and do the **logo
   last and not with AI** (§5.8).

**What it should cost and take** (⚠️ estimates, not quotes): one to two months of a ChatGPT
plan (or Grok) is the realistic cash outlay. Editing time dominates: budget roughly
**20–40 focused hours** for all 41 finished pieces including reruns, if you are new to the
tools.

---

## 1. What this pack is, and what changed

### 1.1 Deliverables

| File | What it is | What it is not |
|---|---|---|
| `docs/design/18-ai-art-prompts.md` (this file) | Strategy, tool guidance, prompt architecture, consistency workflow, checklists, rights/ethics, pipeline integration | Not an image asset; not a substitute for `16`'s technical specs |
| `art/prompts.json` | Valid JSON: `schema_version`, `style_block`, `negative_prompt`, `palette`, and 41 `slots` (id, category, priority, size, aspect ratio, `export_hint`, full prompt, slot negative additions, notes) | Not a generator config, not a seed file, not "tested prompts" |

The prompts are written as **natural-language paragraphs** so they paste cleanly into
chat-style image tools (ChatGPT, Grok — §2.3). Hex codes and palette names are included as
*steering*, not guarantees — the final colour match happens in post (§4.5).

### 1.2 Decision context — ADR-006

The owner's decision is recorded as **ADR-006 — Art generation: 100 % AI-generated
(supersedes ADR-005's commissioning plan)** in [`00-decisions.md`](00-decisions.md). All art
for the First Conquest set is generated in-house with AI image tools; no illustrator is
commissioned. ADR-006 names this document and `art/prompts.json` as the workflow, keeps
`16-art-brief.md` as the specification, and carries these non-negotiable consequences into
this pack:

1. **Placeholder-first still applies.** ADR-005's commissioning plan is superseded, but its
   placeholder policy survives in ADR-006: the build must stay playable with programmatic
   placeholders, and AI art must not block engineering either.
2. **Tool licences/terms must be checked per generator** before any public release — some
   models are non-commercial and terms change (§8.3).
3. **The logo/wordmark is not AI-generated** — typography/vector instead (§5.8).
4. **ADR-002's clean-room rules still apply to prompts**: no source-game/publisher
   references, no official card names, no official art as image input, no living-artist
   style names (§8.2).

`16-art-brief.md` is now direction + specs + acceptance only; the old commissioning, budget
and contract sections were removed when the AI route was adopted (ADR-006). This pack does
not rewrite the decision log or the brief — it implements them. ADR-007 keeps public
branding deferred until v1, which is why the wordmark is deliberately P2 and should not be
published early (§5.8).

### 1.3 What survives from `16-art-brief.md`

| `16` section | Status under AI generation |
|---|---|
| §2 art direction, palette, composition rules | **The spec.** AI must hit it, not redefine it. |
| §3 sizes, formats, naming | **The spec**; "layered source" becomes "kept generation set + layered working file where possible". |
| §4 placeholder policy | **Non-negotiable.** AI art must not block engineering either. |
| §5 pipeline and conventions | Applies unchanged. |
| §6 acceptance checklist | **The spec**, extended with AI-specific checks in §7.2 of this doc. |

---

## 2. Tool landscape and recommendation

### 2.1 What the job needs

Requirements, in priority order: strong long-prompt following; image-reference consistency;
no generated text; cheap or free; clear licence for private hobby use. Local models are **not**
required — the owner generates externally.

### 2.2 Selected tools (owner route)

| Tool | Why it is the route | Watch-outs |
|---|---|---|
| **ChatGPT desktop app** (OpenAI image generation) | Primary. Strong long-prompt adherence, reference-image attachment, in-thread iteration, Canvas view for comparing variants | Plan/workspace image limits; no reliable seed control; occasionally adds captions/signatures |
| **Grok Imagine** ([grok.com/imagine](https://grok.com/imagine) or the Grok app) | Fallback. Fast, cheap iteration; reference-image upload; aspect-ratio selection | ⚠️ Verify current terms before any public use; long palette-heavy prompts may drift |

**Not used:** local FLUX/SDXL/ComfyUI (owner: no local models/GPU), Midjourney, Firefly,
Ideogram. Revisit only if quality or licensing requirements change.

### 2.3 Model adaptation cheat sheet (chat tools)

| Interface | How to feed the pack | Aspect ratio | Negative handling | Consistency levers |
|---|---|---|---|---|
| **ChatGPT desktop app** | Paste the slot prompt as-is, then the inline Avoid list, then state the ratio; attach 1–3 approved reference images | Request 1:1 / 4:3 / portrait in words; crop precisely in post | No separate negative field — keep the Avoid list in the same message | Attach the golden style-lock image(s): "match the attached style, palette, linework and light" |
| **Grok Imagine** | Same; use its reference-image upload and aspect preset | Set ratio in the UI | Same | Same reference-image discipline |
| **Bulk scripting** | `art/prompts.json` is machine-readable if you ever script a batch | From `aspect_ratio`/`size_px` | As above | Pin one model version for the batch |

### 2.4 Selected route (owner decision, 2026-10-25)

The owner generates externally in the **ChatGPT desktop app only** — no Codex CLI, no API
key, no local models. Grok Imagine remains the fallback.

- **Prompts:** copy from [`art/PROMPTS.md`](../../art/PROMPTS.md); every slot prompt is
  standalone and already contains the style block and an inline Avoid list.
- **Consistency:** attach the approved style-lock images in the chat; neither route gives
  reliable seed control.
- **Licences:** hobby/private use only for now (ADR-001). If the project is ever shared
  publicly, re-check OpenAI/Grok terms (§8.3) before publishing.
- **Owner confirmed:** Veska Rhee is a woman and Bered Kask is a man; the prompts match.

---

## 3. Prompt architecture

### 3.1 Global style block (canonical text)

This is the single art-direction clause. It lives in `art/prompts.json` → `style_block`; the
copy below is the same text (hard-wrapped for reading). Prepend it in tools that support a
style field or long prompts.

```text
Stylized 2D fantasy illustration for a hex-and-card board game. Hand-inked line art:
confident warm-umber outlines (#312523) of varying weight that clearly describe every
shape, with clean interior linework for folds and gear. Smooth cel shading: flat
mid-tone fills, soft airbrushed transitions in the shadows, one clean highlight per
form; matte finish, no rendered texture, no gloss, no photographic detail. Stylized
storybook proportions: oversized expressive head, compact torso, slightly oversized
hands and feet, rounded appealing silhouette. Muted earthy palette: moss and olive
greens (#7D8B50, highlights #C4D553), dusty rust and oxblood (#9C5A4E, #7C4B48), ochre
and dull brass (#AD9A70), worn leather browns (#645146, #7B5749), parchment off-whites
(#E9E5D9, #E1DFD6); low saturation, no pure black, no neon. Soft, even daylight from the
upper front with gentle contact shadows; no dramatic chiaroscuro, no coloured rim light.
Cozy-gritty storybook-adventure mood; clean readable shapes with modest detail that
survives at 48–96 px. No text, no letters, no numbers, no logo, no signature, no
watermark, no border, no frame, no UI, no baked hex grid.
```

Why these clauses: the palette hexes are mapped from `15` §8 / `16` §2 (the nine-colour canon
stays; only the rendering changes); **warm vs cool temperature** keeps the Ember/Gloam cycle
readable; **ink outlines and flat mid-tones** keep 48–96 px tokens and card thumbnails legible
in the new style; **"no text/logo/frame"** is non-negotiable because the engine draws all type
and frames.

### 3.2 Global negative prompt (canonical text)

Lives in `art/prompts.json` → `negative_prompt`. Chat tools have no separate negative
field, so each slot prompt carries its Avoid list inline (the practical route). Keep this
list for tools that do expose a negative field.

```text
text, letters, words, numbers, captions, typography, watermark, signature, artist name,
logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid,
grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph,
3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine,
neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil
painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro,
low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch
lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed
hands, duplicate subject, multiple heads, floating objects, cluttered background, white
background, studio backdrop, official game art, fan art, photobash
```

Per-slot `negative` entries in `prompts.json` are **additions** to append to the global list
(`null` means "nothing extra"). The doc/schema convention is documented in the JSON's
`usage` field.

### 3.3 Slot prompt anatomy

Every slot prompt (see any entry in `prompts.json`) is built from the same seven beats, in
this order. The order matters: models weight early tokens more heavily.

| Beat | What it answers | Example fragment |
|---|---|---|
| 1. Subject | Who/what, with the family/character signature | "a Gutterkin skirmisher — squat, bandy-legged scavenger kin, scavenged plate lashed on with rope over torn ember-red rags" |
| 2. Pose & framing | Camera, orientation, fill, crop safety | "full-body, three-quarter view facing slightly left, weapon and feet well inside frame; centred on a flat untextured mid-grey backdrop, subject filling about 80 % of the frame" |
| 3. Environment / ground | What is behind the subject (or explicitly none) | tokens: "no scenery, no cast shadow"; tiles: "the outer edges darken and fade into heath" |
| 4. Light | Soft, even direction + warm/cool temperature | "soft, even warm light from front-left" / "soft, even cool light from the upper left" |
| 5. Palette | Role names + hex codes for this piece | "ember-orange #E0662E rag accents, bone #E7DCC6 teeth highlights, soot-black #17120F shadow core" |
| 6. Composition | Silhouette, flat mid-tones, focal point, UI safe zones | "silhouette-first, flat mid-tones, clean ink contour, upper third kept quiet for UI" |
| 7. Technical & exclusions | Medium, linework, no text/logo/frame | "stylized 2D illustration, warm ink linework, smooth cel shading, modest detail; no text, no letters, no watermark, no logo, no border, no frame" |

Two category-specific beats override the defaults: **tokens** replace environment with a
flat backdrop for cut-out and add the "80 % fill / clean contour" rule; **tiles** replace
environment with a top-down map instruction and add "no grid, no labels, landmarks inside
the central 80 %".

### 3.4 Prompt hygiene rules (the hard ones)

1. **Never mention the source game, its publisher, its expansions, or any official card
   name** in a prompt, filename, log or image-input field. The forbidden-term list lives in
   the content pack (`15` §6) and applies to art text too.
2. **Never name an artist or illustrator** — living or dead — and never write "in the style
   of". The style is this document's written description, not a person.
3. **Never use official art, scans, screenshots, card images or any third-party IP as image
   input** — no img2img, no ControlNet reference, no `--sref`, no inpainting source, no
   upscaler source. Not even privately (`16` §4 item 3, ADR-002).
4. **No real people's likenesses**, no copyrighted characters, no trademarked logos or
   trade dress in prompts or references.
5. **Abstract glyphs only.** Banners, shields, doors, steles and sigils carry abstract
   motifs (flame-in-ring, crescent, spiral, tally notches) — never letterforms, runes or
   heraldic letters. Models will invent pseudo-text if allowed, so check at 100 % and paint
   it out.
6. **One piece, one temperature.** Soft, even light with a single warm (ember-day) or cool
   (gloam-night) temperature; if hard chiaroscuro or competing sources appear, reroll or
   soften — it breaks the Ember/Gloam read.
7. **Hex codes are intent, not output.** Grade to the palette afterwards (§4.5); do not
   reject a good composition only because #E0662E came out as #D96A31.
8. **Keep exclusions explicit.** Chat tools have no negative field — keep the Avoid list in
   the same message. If a tool does expose a negative field, move the exclusions there.

### 3.5 Keeping doc and JSON in sync

`art/prompts.json` is canonical for the prompt text (`style_block`, `negative_prompt`,
each slot's `prompt`/`negative`/`notes`). If you edit a prompt, edit the JSON, run its
validation one-liner (top of this file), and only then touch this document. The style block
and negative prompt above are copies — diff them against the JSON if in doubt.

---

## 4. Consistency workflow — making 41 separate generations look like one game

AI generation is fast; **consistency is the work**. Run the phases in order.

```
Phase 0  setup      palette swatches, folders, prompt log, licence snapshot
Phase 1  style lock 4-5 golden pieces, reviewed against 16 §6 + §7 of this doc
Phase 2  sheets     hero turnaround, enemy family sheets, site/tile design language
Phase 3  conditions same model version, same style references, same Avoid list
Phase 4  3 rounds   thumbnails -> shortlist -> refine -> final (per piece)
Phase 5  post       inpaint -> cut out -> upscale -> grade -> hex crop -> export
Phase 6  review     acceptance checklist -> manifest update -> content-pack art_ref
```

### 4.1 Phase 1 — style lock (do this before batching anything)

1. Generate **one of each**: a hero bust (`hero_emberdrinker`), an enemy token
   (`enemy_slot_01`), a card motif (`motif_01_stride`) and a tile (`tile_countryside_1`).
2. Generate **8–12 variants each** at low cost/resolution. Keep them.
3. Review against `16` §6 and §7 of this doc: silhouette, palette, value structure, no
   text, no accidental IP, readable at target size.
4. Pick 3–5 winners as the **golden set** → save to `art/brief/style-lock/` with a short
   note: tool, model, prompt version, date. Keep oversized originals in `art/source/`
   (gitignored).
5. From now on, every generation should be compared side-by-side with the golden set. If a
   candidate looks like a different game, reject it — even if it is beautiful.

### 4.2 Phase 2 — character sheets and family sheets

- **Heroes (character sheets):** generate front, three-quarter and profile heads on one canvas; also a hand
  study and an expression sheet. Pick one canonical face. Use it as the character reference
  (attach it in the chat) for the final bust and any later alt art.
- **Enemy families:** one sheet per family before the individual slots:
  - *Gutterkin* (slots 01–04): proportions (squat, wide, bandy), hide tone, rag colour,
    armour language, weapon vocabulary.
  - *Wyrmspawn* (slots 05–07): **the three-horn crown — two long temple horns and one short
    brow horn — is the family signature**; keep it identical. No wings on cinder/rime; the
    elder's wings are folded stubs. This is deliberately *not* a known dragon design.
  - *Vault dweller* (08), *Barrow wight* (09), *Watchguard* (10), *Seat Guard* (11–12): one
    reference each for silhouette DNA, materials and light temperature.
- **Sites/tiles:** one shared "world sheet" — stone colour, wood, brass, fire-basket and
  banner shapes — so Hearthstead, Watchhold, the Seat and the tiles share a material
  culture.

### 4.3 Phase 3 — fixed conditions (pin everything)

| Lever | What to pin | Why |
|---|---|---|
| Model | One tool + model version for the whole batch; record it and the date | Models silently update |
| Seed | No seed control in chat tools — keep the prompt text and reference images fixed instead | Reproducibility |
| Style reference | Golden-set image(s) attached to every prompt | The strongest consistency lever |
| Prompt skeleton | `style_block` + the same seven beats + the same no-text tail | Style drift usually starts in wording drift |
| Negative | Global negative + category additions, unchanged | Prevents photography, 3D and painterly drift |
| Palette | Same palette hex list in every prompt | Keeps the grade honest |

### 4.4 Phase 4 — the three-round loop

| Round | Volume | Resolution | Goal | Keep |
|---|---|---|---|---|
| 1 · explore | 6–12 per slot | low (e.g. 768–1024, fewer steps) | composition, silhouette, pose | 2–3 candidates |
| 2 · refine | 2–3 per slot | target size | fix anatomy, framing, palette | 1–2 candidates |
| 3 · final | 1–2 per slot | target size (+ upscale) | clean edges, correct background, no text | 1 winner |

Timebox per piece: 15–40 min for motifs/sites/tokens, 1–2 h for heroes/tiles/plate,
2–4 h for key art (⚠️ estimate for a first-time AI workflow). **Do not polish a loser** — if
round 1 has no candidate with a readable silhouette, rewrite the prompt or re-roll in a
fresh chat instead of inpainting for an hour.

### 4.5 Phase 5 — post-production pipeline

| Step | Tool examples | What to actually do |
|---|---|---|
| **Inpaint** | ChatGPT image edit, Photoshop generative fill, Krita | Mask only the defect; low denoise; short prompt; repaint hands, faces, letter-like marks, tile seams, cropped weapons. |
| **Background removal** | `rembg` (u2net/isnet/BiRefNet), SAM | Tokens and optional site cut-outs only. Generate on flat grey (never white) for cleaner mattes. Defringe the alpha edge; check on **both** dark and light composites for halos; add 2–4 px transparent padding. |
| **Upscale** | Real-ESRGAN ×4 (`4x-UltraSharp`), waifu2x, Topaz | Upscale the winner to the `16` §3 size, then inspect at 100 % — upscalers hallucinate rivets and fingers. Keep a non-upscaled fallback. |
| **Palette grade** | Krita/GIMP/Photoshop curves or a shared LUT | Build one grade for the whole set. Pull midtones toward charcoal #2A221C, protect ember highlights, kill stray teal/magenta. Verify in **greyscale** (values) and with a colour-blindness preview (element colours need glyph/shape pairing anyway). |
| **Hex compositing** | GIMP/Krita/script | Mask the square tile to a hex with 2–4 % bleed; no baked grid or labels; test adjacent tiles for seams and bright rims; engine draws lines/icons on top. |
| **Export** | ImageMagick/`cwebp`/build step | sRGB 8-bit PNG masters + WebP web sizes (§9.3); neutral-ID filenames only; token/motif atlas at build time. |

**Do not bake text, numbers, site icons, UI, card frames or the hex grid into any image.**
The engine overlays all of that; baked UI makes an asset unusable when the UI changes.

### 4.6 Phase 6 — review gate

A piece is done only when it passes **`16` §6 acceptance + §7 checklist of this doc**, and
the manifest is updated. Two review rounds maximum per piece; after that, either accept or
fall back to the placeholder (ADR-005 and ADR-006: placeholders never block).

---

## 5. Category-specific guidance

| Category | Slots | Priority | Target size / ratio | Core rule |
|---|---:|---|---|---|
| Hero portraits | 2 | P0 | 2048×2048, 1:1 | Bust, warm/cool hero pair, readable at 64 px |
| Enemy tokens | 12 | P0 | 1024×1024, 1:1 | Centred, transparent final, black-silhouette test at 48 px |
| Map tiles | 4 | P0 | 2048×2368, 32:37 | Top-down, no grid/labels, fade edges, roads to edge |
| Seat plate | 1 | P0 | 2048×1536, 4:3 | Epic gate backdrop, dark upper third for UI |
| Sites | 8 | P1 | 1024×1024, 1:1 | Single-landmark vignette, readable at 128 px |
| Card motifs | 12 | P1 | 1024×768, 4:3 | Flat symbolic emblem, reusable, tinted + transparent variants |
| Key art | 1 | P1 | 3840×2160, 16:9 | Cinematic, title-safe negative space |
| Logo/wordmark | 1 | P2 | SVG | **Not AI-generated** — typography + vector |

### 5.1 Hero portraits (Veska Rhee, Bered Kask)

- **Composition:** chest-up bust, three-quarter turn, head in the upper third, eyes on the
  upper-third line, generous margins so the renderer can crop a square HUD portrait or a
  tall select-screen panel without cutting the face.
- **Pair design:** Veska Rhee, the Ember-Drinker is lit by a **warm ember** key from the
  shard in her hands (day, risk, scars); Bered Kask, the Oathless is lit by a **cool gloam**
  key with a single distant warm accent (night, defence, steadiness). Together they encode the
  Ember/Gloam cycle and never look like the same character in two outfits.
- **Readability:** at 64 px the face is ~12 px — the silhouette must come from hair, shoulder
  line and the one bright accent (shard / shield rim). Keep backgrounds quiet.
- **IP hygiene:** armour, shield glyph and scars are ours. No borrowed armour silhouettes,
  emblems or character designs from any existing game.
- **Working assumption ⚠️:** `15` does not state either hero's gender or age; the prompts
  assume an adult woman (Veska) and an adult man (Bered), matching the name feel. Flip it if
  the owner decides otherwise — the set doesn't depend on it, but fix it before alt art.
- **Deliverables:** 2048² PNG master (plus layered working file: background / subject /
  effects), 512 px WebP, optional 256 px.

### 5.2 Enemy tokens (12)

- **Framing:** full-body, centred, 75–85 % fill, three-quarter view, feet and weapon fully
  inside frame. The engine's token ring needs a clean centred silhouette.
- **Background:** generate on a **flat mid-grey** backdrop (never white), then cut out with
  `rembg`/BiRefNet. Transparency is a *post* step; do not trust generator alpha.
- **Silhouette test (mandatory):** flatten to pure black on white and view at 48 px and
  96 px. If you can't say "that's a Gutterkin" from the black blob, simplify: thicker limbs,
  chunkier weapons, closer limbs, no thin spikes, fewer props.
- **Family sheets:** slots 01–04 share Gutterkin proportions and rag/plate language;
  05–07 share the three-horn Wyrmspawn crown and ember-rimed throat; 10 is disciplined
  shield-wall; 11–12 are gilded, ceremonial and deadlier.
- **Light:** one key per token — warm for Gutterkin/Wyrmspawn cinder/Seat Guard, cool for
  rime Wyrmspawn/Vault dweller/Barrow wight/Watchguard.
- **Deliverables:** transparent PNG master 1024², 96 px and 48 px WebP, atlas at build time.
  Add 2–4 px transparent padding; check for edge halos on the dark game background.

### 5.3 Map tiles (4)

- **Perspective:** true top-down (orthographic map view), not isometric, no horizon, no
  building elevations. Sites are painted as flat landmarks inside the terrain.
- **No baked grid:** no hex border, no grid lines, no coordinates, no labels, no icons, no
  compass. The engine draws the hex mask, grid, sites and labels.
- **Edges:** darken/fade the outer band into terrain so adjacent tiles sit together; keep
  landmarks inside the central 80 % because the hex mask eats the corners. Roads/causeways
  should run to the image edge (they become connections). Test a 3-tile strip for seams and
  bright rims.
- **The four:** `tile_start` (Woldgate, the start), `tile_countryside_1` (ashen settled heath,
  dusk), `tile_countryside_2` (Glimmer marsh, cold gloam), `tile_seat` (the Seat from above,
  concentric walls and central hearth). Generate `tile_seat` last so it matches
  `seat_plate` and `site_seat`.
- **Size:** 2048×2368 (32:37). Generate at that ratio if the tool allows; otherwise square
  → crop/mask. The hex crop is applied in post; the master keeps the full square/portrait
  bleed.

### 5.4 The Seat plate (`seat_plate`)

- **Use:** assault-screen backdrop. It is a *stage*, not a poster: the upper third and outer
  edges stay dark and low-contrast so cards, dice, combat UI and rule text remain readable
  on top.
- **Composition:** ground-level view of the gate; one focal point (the glowing gate); a tiny
  Vowbound silhouette low in frame for scale; storm-gloam sky; warm gate glow is the only
  warm mass.
- **Consistency:** same wall/stone/banner language as `tile_seat` and `site_seat`; banners
  carry the abstract hearth glyph only.
- **Deliverables:** 2048×1536 PNG + 1024×768 WebP; optional darker vignette variant for text
  legibility, produced in post (not baked into the master).

### 5.5 Sites (8)

- **Format:** single-landmark vignette, 1:1, edges falling into a dark soft vignette (so it
  can be dropped on a panel or keyed out). No ground plane running to the edges, no horizon
  line across the frame, no second landmark competing.
- **Readability:** the site must be identifiable at 128 px from its one signature element —
  Hearthstead's lit hearth door, the Gloam-choir's bell tower and moon banners, Watchhold's
  beacon, the Shardspire's crystal spire, the Glimmer Glade's stones and motes, the
  Shardmine's terraces and glowing seams, the Seat's concentric walls, the Woldgate's arch
  haze.
- **No people:** site icons are places, not scenes; figures clutter the read.
- **Deliverables:** 1024² PNG vignette master; optional transparent cut-out variant;
  256 px and 128 px WebP.

### 5.6 Card motifs (12)

- **Purpose:** one motif is reused across many cards (the cheapest art lever — `16` §5). It
  must be **flat, symbolic, centred, non-narrative and tintable** — a stamp, not a painting.
- **Rule of thumb:** one symbol, two or three values, thick shapes, generous margins, no
  scene, no character action, no card frame.
- **Two variants per slot:** tinted (soot field + vignette, for card backgrounds) and
  transparent icon (2 px bone keyline, for overlays/UI). The engine tints element colours.
- **Motif map:** stride = worn boot print; volley = three fanned arrows; siege = ram head
  breaching stone; block = mended round shield; ember = bound ember shard; mend = needle and
  thread through leather; renown = notched shard tally; bond = two linked iron rings; relic =
  cracked bronze bell; invocation = hand releasing an abstract spiral; gloam = violet crescent
  in rime mist; seat = concentric wall sigil with central flame.
- **Deliverables:** 1024×768 tinted background + transparent icon; 512×384 and 256×192 WebP;
  atlas at build time.

### 5.7 Key art (`key_art`)

- 16:9, 3840×2160 master; the Vowbound small against the Seat. The **upper-left third stays
  calm** — that is where the engine/SVG wordmark goes. No title text in the painting.
- Generate it **last**: it is the summary of the locked style, not the experiment that
  defines it. Reuse the hero silhouette/cloak and the Seat wall design from the accepted
  pieces.
- Export 3840×2160 master, 1920×1080 and 1280×720 WebP.

### 5.8 Logo / wordmark (`logo`) — **do not generate with AI**

This is the one slot where the answer is *not* a prompt. AI image models cannot set
letterforms, kerning or optical spacing reliably, produce uneditable SVG, and their
lettering is a poor basis for a trademark screen. The route is typography + vector:

1. Pick **SIL OFL** typefaces (e.g. Cinzel for the wordmark, EB Garamond for secondary
   copy — final pair per `15` §8/`16` §2).
2. Set "Emberwold" in Inkscape/Affinity/Illustrator; draw a small **mark** (ember shard, or
   flame-in-ring) as clean vector paths; no AI lettering.
3. Palette: soot/bone wordmark with one ember accent; keep a one-colour and reversed
   version; test at 16 px and favicon size.
4. Screen the public name first (`15` §11). Do **not** ship a wordmark until the name
   screen and a quick trademark check are done. ADR-007 keeps public product branding deferred (the repository is named Emberwold)
   until v1 is playable, so this slot is deliberately P2 — nothing public is named yet.
5. Export SVG + PNG fallbacks. AI may be used *only* to explore abstract mark silhouettes
   (no letters), and any chosen shape must be redrawn as vector by hand.

The `prompt` field for the `logo` slot is therefore an explicit do-not-generate instruction.

---

## 6. The 41-slot map (coverage at a glance)

Full prompts are in [`art/prompts.json`](../../art/prompts.json); this is the index. Sizes
are from the manifest; "P" = priority.

| # | Slot id | Category | P | Size | Subject |
|---:|---|---|---|---|---|
| 1 | `key_art` | key_art | P1 | 3840×2160 | The Vowbound before the Seat (16:9) |
| 2 | `logo` | branding | P2 | vector | Emberwold wordmark — **do not AI-generate** |
| 3 | `hero_emberdrinker` | hero | P0 | 2048² | Veska Rhee, the Ember-Drinker (warm key) |
| 4 | `hero_oathless` | hero | P0 | 2048² | Bered Kask, the Oathless (cool key) |
| 5 | `enemy_slot_01` | enemy | P0 | 1024² | Gutterkin skirmisher |
| 6 | `enemy_slot_02` | enemy | P0 | 1024² | Gutterkin raider |
| 7 | `enemy_slot_03` | enemy | P0 | 1024² | Gutterkin brute |
| 8 | `enemy_slot_04` | enemy | P0 | 1024² | Gutterkin beast-handler |
| 9 | `enemy_slot_05` | enemy | P0 | 1024² | Wyrmspawn cinder |
| 10 | `enemy_slot_06` | enemy | P0 | 1024² | Wyrmspawn rime |
| 11 | `enemy_slot_07` | enemy | P0 | 1024² | Wyrmspawn elder |
| 12 | `enemy_slot_08` | enemy | P0 | 1024² | Vault dweller |
| 13 | `enemy_slot_09` | enemy | P0 | 1024² | Barrow wight |
| 14 | `enemy_slot_10` | enemy | P0 | 1024² | Watchguard |
| 15 | `enemy_slot_11` | enemy | P0 | 1024² | Seat Guard halberdier |
| 16 | `enemy_slot_12` | enemy | P0 | 1024² | Seat Guard arcanist |
| 17 | `tile_start` | tile | P0 | 2048×2368 | Woldgate start tile |
| 18 | `tile_countryside_1` | tile | P0 | 2048×2368 | Ashen countryside (dusk) |
| 19 | `tile_countryside_2` | tile | P0 | 2048×2368 | Glimmer marsh (cold gloam) |
| 20 | `tile_seat` | tile | P0 | 2048×2368 | The Seat from above |
| 21 | `seat_plate` | city_plate | P0 | 2048×1536 | The Seat assault backdrop |
| 22 | `site_hearthstead` | site | P1 | 1024² | Hearthstead |
| 23 | `site_gloam_choir` | site | P1 | 1024² | Gloam-choir |
| 24 | `site_watchhold` | site | P1 | 1024² | Watchhold |
| 25 | `site_shardspire` | site | P1 | 1024² | Shardspire |
| 26 | `site_glimmer_glade` | site | P1 | 1024² | Glimmer Glade |
| 27 | `site_shardmine` | site | P1 | 1024² | Shardmine |
| 28 | `site_seat` | site | P1 | 1024² | The Seat (site icon) |
| 29 | `site_woldgate` | site | P1 | 1024² | Woldgate |
| 30 | `motif_01_stride` | card_motif | P1 | 1024×768 | Stride |
| 31 | `motif_02_volley` | card_motif | P1 | 1024×768 | Volley |
| 32 | `motif_03_siege` | card_motif | P1 | 1024×768 | Siege |
| 33 | `motif_04_block` | card_motif | P1 | 1024×768 | Block |
| 34 | `motif_05_ember` | card_motif | P1 | 1024×768 | Ember |
| 35 | `motif_06_mend` | card_motif | P1 | 1024×768 | Mend |
| 36 | `motif_07_renown` | card_motif | P1 | 1024×768 | Renown |
| 37 | `motif_08_bond` | card_motif | P1 | 1024×768 | Bond |
| 38 | `motif_09_relic` | card_motif | P1 | 1024×768 | Relic |
| 39 | `motif_10_invocation` | card_motif | P1 | 1024×768 | Invocation |
| 40 | `motif_11_gloam` | card_motif | P1 | 1024×768 | Gloam |
| 41 | `motif_12_seat` | card_motif | P1 | 1024×768 | Seat |

Names/families above follow `15` §4–§5: Vowbound, Gutterkin, Wyrmspawn, Vault dwellers,
Barrow wights, Watchguard, Seat Guard, the Seat, Hearthstead, Gloam-choir, Watchhold,
Shardspire, Glimmer Glade, Shardmine, Woldgate, and the Ember/Gloam cycle. The Renown motif
is the `motif_07_renown` slot.

---

## 7. Quality checklist and common AI failure modes

### 7.1 Pre-flight (before you generate)

- [ ] Prompt copied from `prompts.json` unedited (or edited in the JSON, not only in the tool).
- [ ] Style block + slot prompt pasted with its inline Avoid list (chat tools have no
  separate negative field).
- [ ] Tool/model version and date recorded in the prompt log (chat tools expose no seed).
- [ ] No source-game name, official card name, artist name, or third-party IP in the prompt.
- [ ] No official art / third-party image in any image-input field.
- [ ] Target size and aspect ratio set from the manifest.
- [ ] Style-lock reference image loaded for this category.

### 7.2 Acceptance checklist (per piece)

Use [`16-art-brief.md` §6](16-art-brief.md) as the canonical checklist. AI-specific additions:

- [ ] Ink linework and smooth cel shading present; no painterly texture or 3D gloss.
- [ ] Matches the golden style-lock set side-by-side (same "game").
- [ ] Transparent assets have clean edges and no halos on dark **and** light backgrounds.
- [ ] Prompt log entry complete; licence checked for the tool/model used.

### 7.3 Common failure modes and fixes

| Failure | How you spot it | Fix |
|---|---|---|
| **Gibberish text / letter-like marks** on banners, shields, sigils, carvings | Squint test; zoom 100 %; run OCR or just eyeball | Ratchet up "no text, no letters, no numbers" + negative list; inpaint/erase the marks; prefer abstract shapes; never let the model decide typography. The `logo` slot is exempt-by-route (no AI). |
| **Extra/fused fingers, hands, limbs** | Count them; look at silhouettes | Generate more candidates (cheap), inpaint the hand with a new hand, or design around hands (armour, wraps, gloves, small token scale). Hero/motif hands are the worst — budget extra attempts. |
| **Muddy, low-contrast values** | Greyscale view is flat grey | Add "clear flat value structure, dark ground, mid-value subject, one ember-bright accent"; reduce "moody/dark" adjectives; grade; if still flat, regenerate — don't fake contrast with a filter. |
| **Style drift across slots** | Contact sheet vs golden set | Same tool/model version, style block, reference images and Avoid list; reject the outlier and re-run the sheet. |
| **Tile edge seams / bright rims** | 3-tile adjacency test | Fade/darken edges in post, 2–4 % hex bleed, avoid subject matter touching edges except roads; never a border line. |
| **Token unreadable at 48 px** | Black-silhouette test at 48 px | Simplify (fewer props, thicker weapon/limbs, closer pose), raise subject fill, remove thin spikes, increase contrast, re-generate; small pieces need *less* detail. |
| **Halo/fringe after cut-out** | Check alpha on dark and light comps | Generate on mid-grey, not white; use a better matte model (BiRefNet); defringe/contract alpha 1 px; add transparent padding. |
| **Palette drift** (teal-orange, neon violet, glossy HDR) | Sample the image; compare to swatches | Put the nine hexes in the prompt, add negative "neon, oversaturated, HDR, glossy"; apply the shared grade; avoid "vibrant/cinematic colour grading" words. |
| **Over-detailed noisy pieces** | Busy at thumbnail size | "Clean simplified detail"; fewer props; lower resolution/steps for exploration; crop; simplify in post. |
| **Duplicate subjects / split compositions** | Two heroes side by side, mirrored copies | "single subject, centred"; reroll; crop to the better half; avoid prompts that imply multiples ("twins", "group"). |
| **Wrong perspective on tiles** | Horizon or isometric walls appear | "Top-down, orthographic map view"; negative "isometric, perspective, horizon, building elevation"; reroll. |
| **Accidental IP imitation** (dragon, helm, armour silhouette, emblem) | Looks familiar; check against known designs | Change the silhouette elements (horn arrangement, wing posture, helm shape, glyph); regenerate; never use official art for reference. |
| **Dramatic / chiaroscuro lighting** | Hard black shadows, glowing rims, stage-light look | "soft, even daylight from the upper front; no dramatic chiaroscuro, no coloured rim light"; regenerate; keep shadows gentle. |
| **Painterly or rendered drift** | Brush texture, impasto or 3D gloss appears | Re-prompt with ink linework + flat cel shading; negative "painterly, impasto, 3D render, glossy". |
| **Letter-like runes** on Shardspire/wight/Sigil pieces | Marks look like a script | "Abstract shapes only, not letters, not readable runes"; negative "runes"; paint them into abstract scratches. |
| **Upscaler hallucinations** (new rivets, fingers, faces) | 100 % zoom after upscale | Use a conservative upscaler; compare to the pre-upscale; inpaint bad patches; keep the original. |
| **Baked UI/card frame/hex grid** | Baked borders, panels, labels | Re-prompt with the no-frame/no-UI language; crop; rebuild the asset from the clean area. |
| **Model refusal / content derail** | Empty, softened or off-brief output | Soften wording ("no gore", "no blood"); keep dark-fantasy but not graphic; change tool or phrasing. |
| **Watermark/signature/artist credits** | Bottom corners | Negative list; crop or inpaint out; if a tool bakes marks, stop using it for final art. |
| **Uncanny hero faces** | Eyes/symmetry off at full size | Generate more portraits; pick a candidate with clean eyes; inpaint eyes; don't over-upscale the face. |
| **Asymmetric design language across families** | Side-by-side sheets disagree | Family sheets first; write the family signature in the prompt (horn crown, rag colour, shield shape); redo outliers. |

### 7.4 The three tests every piece gets

1. **Black test:** flatten to pure black, place on white, view at 48 px and 96 px
   (tokens), 96 px (motifs), 128 px (sites), full map (tiles). If it's unrecognisable,
   simplify.
2. **Greyscale test:** the value structure must hold without colour (flat mid-tones / dark ink
   contours / one bright accent). If it collapses, fix values, not hue.
3. **Stranger test:** put it next to the golden set and the other members of its family and
   ask "same game?" A beautiful image that looks like a different game is a failure.

---

## 8. Rights, licences and ethics

### 8.1 Disclose AI use

Be straightforward about it: the README/credits/store page and any public build say that
the art is **AI-generated under human art direction**, naming the tool(s) used. Credits
should describe the workflow honestly ("AI-generated art, art direction/retouching by the
owner") and note that the game's names, world and written text are original. Disclose if a
storefront (itch.io, Steam, etc.) requires an AI-content declaration ⚠️ (policies differ and
change — check before publishing). Keep prompt logs (§8.6) so the claim is auditable.

### 8.2 Do not imitate people or borrow IP

- **No artist names in prompts**, ever — living or dead. No "in the style of X", no "by X",
  no "X-like". The style is the written style block, not a person.
- **No LoRAs/checkpoints trained specifically to imitate a named artist's work**, and no
  using AI to undercut an illustrator by copying their style. (Relevant even though no
  illustrator is commissioned: it is an ethics/clean-room issue.)
- **No copyrighted characters, creatures, armour designs, logos, trademarks or trade
  dress** in prompts or references. Wyrmspawn must be *our* horned reptile design, not a
  known dragon.
- **No real people's likenesses**, no political/religious sacred symbols, no national or
  contested symbols used decoratively, no sexual content, no graphic gore (the palette is
  dark, the content is a board game).
- **Never use official art or third-party copyrighted images as image input**, including
  img2img, inpainting sources, ControlNet references, Midjourney `--sref`, and upscaler
  inputs. This mirrors `16` §4 item 3 and ADR-002; it is a hard rule, not a preference.
- **No narrative or flavour text copied** into prompts (the art doesn't need it, and it keeps
  the clean-room boundary obvious).

### 8.3 Licence/terms caveats per tool ⚠️

**Verify every one of these before you rely on it, and re-check before publishing.** Terms
and model licences change; a hobby/private build is a lower-risk context than a public or
commercial release, but it does not erase the licence conditions. Record the licence
name/version, URL and check date in the prompt log, and keep a local copy under
`art/source/licences/` (gitignored).

| Tool | Headline (⚠️ verify) | Use it for a public build? |
|---|---|---|
| **OpenAI / ChatGPT images** | OpenAI terms: outputs assigned to the user; commercial use allowed subject to policies; plan/workspace limits apply | Generally yes, subject to the current terms |
| **Grok Imagine (xAI)** | xAI terms; output ownership and commercial-use terms vary by plan ⚠️ | Verify current terms before any public use |

No local models are in the route (ADR-006); if that ever changes, add the model/checkpoint
licence here with the date checked.

Also note: **the provider may change model behaviour or discontinue a model**; pin versions
and keep masters. Free-tier research/preview models are frequently not licensed for final
public art — treat them as exploration only.

### 8.4 Copyright status of AI outputs ⚠️

Copyright in AI-generated output varies by jurisdiction and is still unsettled. In the
**US**, the Copyright Office requires human authorship, so purely AI-generated material is
generally not protectable (see [copyright.gov/ai](https://www.copyright.gov/ai/)); other
jurisdictions differ (the UK, for example, has a computer-generated-works provision — do not
rely on a summary, check current law). Practical consequences for a hobby project:

- You can **use** the art, but you may have **thin or no copyright** in the raw output and may
  not be able to stop others reusing it; don't build a commercial moat on AI-only art.
- **Human authorship helps**: selection, arrangement, composition, retouching, inpainting and
  direction are human contributions; keep layered working files and notes if you ever need to
  explain them.
- **Disclose** AI use (§8.1); storefronts and customers increasingly ask.
- This is not legal advice; if the project ever becomes commercial or crowd-funded, get
  proper advice and re-check every tool licence (`15` §11 screening still applies to the
  public name).

### 8.5 Keep prompt logs

For every accepted piece, record: manifest slot id, prompt version (the JSON is versioned in
git), tool + model version, style reference used, generation date, licence checked
(name/date/URL), post-processing steps, final file hash.
This gives you reproducibility, an audit trail for disclosure, and a defence if a tool's
terms change. Suggested schema (additive to the manifest, owner approval — the manifest is
not this file's lane; see §9.1).

### 8.6 Prompt-log template

| Field | Example |
|---|---|
| Slot | `enemy_slot_05` |
| Prompt source | `art/prompts.json` v1.0.0 → `slots[8].prompt` |
| Tool / model | ChatGPT desktop app (record the model/version if shown) |
| Ratio / iteration | 1:1; 3 rounds, variant 2 kept |
| Style reference | `art/brief/style-lock/token_gutterkin.png` |
| Licence checked | OpenAI terms, URL, 2026-10-25 |
| Post | inpaint tail; rembg BiRefNet; Real-ESRGAN ×2; grade LUT `emberwold_v1` |
| Final | `art/final/enemy/wyrmspawn_cinder@2x.png` (sha256 …) |
| Reviewer / date | owner / 2026-10-25 |

---

## 9. Pipeline integration (manifest, naming, exports)

### 9.1 Manifest updates (proposal — the Lead/owner owns `art/manifest.json`)

The manifest is the single source of truth for slots. **This pack does not edit it.** Proposed
additive fields once art starts landing:

| Field | Values | Purpose |
|---|---|---|
| `status` | `placeholder` → `wip` → `review` → `final` / `rejected` | Production state (already exists) |
| `art_ref` | `art/final/<category>/<neutral_id>@2x.png` | Content-pack reference; data-only swap |
| `source` | `AI-generated (<tool>, <model version>, <date>) — edited by owner` | Credits/disclosure |
| `ai_tool` / `ai_model` | e.g. `ChatGPT desktop app`, model version if shown | Reproducibility |
| `ai_prompt_ref` | `art/prompts.json#enemy_slot_05` | Traceability |
| `ai_licence` | `Apache-2.0 (checked 2026-10-25)` | Licence audit |
| `ai_post` | `rembg, Real-ESRGAN x2, grade LUT v1` | Provenance |
| `reviewed` | `owner, 2026-10-25` | Acceptance gate (`16` §6 + §7 here) |

### 9.2 Naming and folders

Neutral IDs only (`15` §9, `16` §3): `art/<category>/<neutral_id>@2x.png`. Examples:

```text
art/hero/emberdrinker_portrait@2x.png        art/enemy/gutterkin_skirmisher@2x.png
art/tile/starting_a@2x.png                   art/site/hearthstead@2x.png
art/card_motif/stride@2x.png                 art/key_art/key_art@2x.png
art/city_plate/seat_plate@2x.png             art/branding/logo.svg   (hand-built, not AI)
```

Proposed layout (extends `art/README.md`):

```text
art/
  brief/style-lock/     golden reference images + approval notes (gitignore if large)
  brief/licences/       licence snapshots (name, URL, date, PDF/text)
  source/               working files, layered masters, per-piece generation sets (gitignored)
  final/                accepted masters, neutral-ID names (commit small; LFS if >50 MB)
  manifest.json         slot state
  prompts.json          this pack's machine-readable prompts
```

**Never put AI tool names, hero working titles or IP-bearing names in filenames**; the neutral
ID is the contract. Content-pack `art_ref` is the only place the build learns an asset path.

### 9.3 Web-size exports

Generate at build time from the master; commit only what the repo needs.

| Category | Master | Web sizes (WebP, q≈80–85) | Notes |
|---|---|---|---|
| Heroes | 2048² PNG | 512², 256² | HUD + select screen crops |
| Enemies | 1024² PNG transparent | 96², 48² | atlas at build time |
| Tiles | 2048×2368 PNG | 1024×1184 | full-bleed; engine masks to hex |
| Seat plate | 2048×1536 PNG | 1024×768 | backdrop; optional dark vignette variant |
| Sites | 1024² PNG | 256², 128² | vignette; optional cut-out |
| Card motifs | 1024×768 PNG | 512×384 tinted, 256×192 icon | two variants per motif |
| Key art | 3840×2160 PNG | 1920×1080, 1280×720 | title/splash |
| Logo | SVG | 512 px PNG fallback | vector source is canonical |

All finals: **sRGB, 8-bit, PNG masters; WebP for web**. No text, frames or UI baked in.

### 9.4 Production order and effort

1. **Style lock** (Phase 1, §4.1) — 4–5 anchors, ~4–8 h ⚠️.
2. **P0 batch (19):** heroes (2) → Gutterkin/Wyrmspawn family sheets + 12 enemy tokens →
   4 tiles → `seat_plate`. Suggested sequencing keeps families together.
3. **P1 batch (21):** 8 sites → 12 motifs → `key_art` last.
4. **P2 (1):** wordmark via vector (§5.8) — do not batch with AI art.

Keep the placeholder renderer working throughout; every slot can stay `placeholder` until
its replacement passes review. If a piece fails twice, ship the placeholder and move on
(ADR-005 and ADR-006).

### 9.5 Risks specific to the AI route

| Risk | Mitigation |
|---|---|
| Tool licence changes or model removed | Pin versions, snapshot licenses, keep masters + layered files; prefer permissive models for finals. |
| Style drift / "AI look" across the set | Style lock + family sheets + fixed reference images + a single shared grade. |
| Readability failures at game size | Target-size tests in §7 before accepting anything; design first, polish second. |
| Time sink chasing "perfect" generations | Timeboxed 3-round loop; placeholder fallback is a supported state. |
| Accidental IP bleed | No named references, abstract-only glyphs, unfamiliar silhouette design, review every piece against known designs. |
| Copyright/registration confusion | Disclose AI use; keep human-authorship evidence; don't claim exclusivity over raw outputs (§8.4). |
| Public release changes the analysis | Re-verify every licence at release time; consider a licence-clean route for shipped assets. |

---

## 10. Open questions and things to verify

1. **Hero specifics:** ✅ gender confirmed by owner (Veska = woman, Bered = man); prompts
   already match. Age/appearance remain open for alt art (§5.1).
2. **Public release intent:** if the game will be shared publicly, re-check OpenAI/Grok terms
   and storefront AI-disclosure policies, and consider a licence-clean route for *shipped*
   art ⚠️.
3. **Licence re-check:** ADR-006 requires a per-generator licence check before any public
   release; the table in §8.3 is ⚠️ and must be re-verified at that point.
4. **Local hardware:** ✅ resolved — no local models; generation is external in the ChatGPT
   desktop app, with Grok Imagine as fallback (§2.4).
5. **Wordmark:** design route, font pair and name screen (`15` §11) still open; do not ship
   an AI-lettered logo, and do not publish a lockup while the name is still internal
   (ADR-007).
6. **Prompt testing:** only the four v1 style-lock prompts have been run (then discarded with
   the v2 style change); the v2 style lock has not been generated yet. Calibrate round 1 from
   the first new style-lock image and adjust the JSON wording if needed.

---

## Sources

**Project documents (authoritative for this pack):**

- [`15-retheme-bible.md`](15-retheme-bible.md) — world, names, palette `15` §8, forbidden terms `15` §6.
- [`16-art-brief.md`](16-art-brief.md) — art direction, specs, acceptance checklist, placeholder policy.
- [`00-decisions.md`](00-decisions.md) — ADR-001 (hobby), ADR-002 (clean-room), ADR-005 (placeholder policy), **ADR-006 (AI-generated art, §1.2)**, ADR-007 (names internal until v1).
- [`art/manifest.json`](../../art/manifest.json) — 41 slots, sizes, priorities, palette.
- [`art/prompts.json`](../../art/prompts.json) — the prompt pack (canonical prompt text).
- [`../research/07-assets-art-inventory.md`](../research/07-assets-art-inventory.md) — asset sourcing, AI-art cost/risk notes.
- [`11-mvp-scope.md`](11-mvp-scope.md) — v1 content counts behind the slot list.

**Tool licences and terms (canonical entry points — ⚠️ not re-fetched for this draft; verify
current text, pricing and model cards before acting):**

- OpenAI terms of use — <https://openai.com/policies/terms-of-use>
- OpenAI image generation docs — <https://learn.chatgpt.com/docs/image-generation>
- Grok Imagine — <https://grok.com/imagine> (terms via the xAI/Grok site)
- US Copyright Office, AI and copyright — <https://www.copyright.gov/ai/>

**Post-processing tools** (not generation):

- rembg (background removal) — <https://github.com/danielgatis/rembg>
- Real-ESRGAN (upscaling) — <https://github.com/xinntao/Real-ESRGAN>
- Krita / GIMP / Inkscape — <https://krita.org>, <https://www.gimp.org>, <https://inkscape.org>
- SIL Open Font License — <https://openfontlicense.org>
