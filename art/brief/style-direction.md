# Art style direction v2 (draft)

Status: **draft** — extracted from an owner-supplied reference image. Not yet applied to any prompt file.
Date: 2026-10-25
Source: owner's reference image (third-party, watermarked — kept out of the repo; do not use as image input). The text below is generic style description: no artist name, no character design copied.

## Proposed `style_block`

Stylized 2D fantasy illustration for a hex-and-card board game. Hand-inked line art: confident warm-umber outlines (#312523) of varying weight that clearly describe every shape, with clean interior linework for folds and gear. Smooth cel shading: flat mid-tone fills, soft airbrushed transitions in the shadows, one clean highlight per form; matte finish, no rendered texture, no gloss, no photographic detail. Stylized storybook proportions: oversized expressive head, compact torso, slightly oversized hands and feet, rounded appealing silhouette. Muted earthy palette: moss and olive greens (#7D8B50, highlights #C4D553), dusty rust and oxblood (#9C5A4E, #7C4B48), ochre and dull brass (#AD9A70), worn leather browns (#645146, #7B5749), parchment off-whites (#E9E5D9, #E1DFD6); low saturation, no pure black, no neon. Soft, even daylight from the upper front with gentle contact shadows; no dramatic chiaroscuro, no coloured rim light. Cozy-gritty storybook-adventure mood; clean readable shapes with modest detail that survives at 48–96 px. No text, no letters, no numbers, no logo, no signature, no watermark, no border, no frame, no UI, no baked hex grid.

## Proposed `negative_prompt`

text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, official game art, fan art, photobash

Removed from the v1 negative (now desired): cartoon, anime, manga, chibi, cute, comic book, cel shading, thick outlines. Also removed: white background, studio backdrop (parchment fields are now allowed; slot prompts still control backgrounds).

## Palette

Keep the nine-colour set from `15-retheme-bible.md` §8; change the rendering, not the canon:

| Canon | v2 use |
|---|---|
| soot #17120F / charcoal #2A221C | linework and leather; warm it to umber #312523 for outlines |
| root #6E8F4E | moss green #7D8B50 fills, #C4D553 highlight |
| ember #E0662E | bright accents only; rust cloth fills #9C5A4E |
| gold #E3B341 | dull brass #AD9A70 |
| bone #E7DCC6 | parchment off-whites #E9E5D9 / #E1DFD6 |
| rime, gale, gloam | unchanged (gloam/night pieces) |

## What this changes

- `art/prompts.json` → `style_block` and `negative_prompt`.
- `art/PROMPTS.md` → global style block and global avoid list.
- All 41 slot prompts carry inline painterly wording: 40 contain "painterly", 34 "soot-black", 27 "restrained detail", 19 "dry-brush", 15 "silhouette-first", 13 "three-value", 9 "ember key light". A global block swap alone will not change the style; the inline phrases must be swept too.
- `docs/design/18-ai-art-prompts.md` §3.1–3.2 and `docs/design/16-art-brief.md` §2.
- The four images in `art/brief/style-lock/` are obsolete and need regenerating in the new style before any batch generation.
