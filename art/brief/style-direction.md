# Art style direction v2

Status: **applied 2026-10-25** — see `art/prompts.json` (`style_block`, `negative_prompt`, all 41 slot prompts), `art/PROMPTS.md`, `docs/design/16-art-brief.md`, `docs/design/18-ai-art-prompts.md`, and `docs/design/15-retheme-bible.md` §8.
Source: owner-supplied reference image (third-party, watermarked — kept out of the repo; never used as image input). The text below is generic style description: no artist name, no character design copied.

## Applied `style_block`

Stylized 2D fantasy illustration for a hex-and-card board game. Hand-inked line art: confident warm-umber outlines (#312523) of varying weight that clearly describe every shape, with clean interior linework for folds and gear. Smooth cel shading: flat mid-tone fills, soft airbrushed transitions in the shadows, one clean highlight per form; matte finish, no rendered texture, no gloss, no photographic detail. Stylized storybook proportions: oversized expressive head, compact torso, slightly oversized hands and feet, rounded appealing silhouette. Muted earthy palette: moss and olive greens (#7D8B50, highlights #C4D553), dusty rust and oxblood (#9C5A4E, #7C4B48), ochre and dull brass (#AD9A70), worn leather browns (#645146, #7B5749), parchment off-whites (#E9E5D9, #E1DFD6); low saturation, no pure black, no neon. Soft, even daylight from the upper front with gentle contact shadows; no dramatic chiaroscuro, no coloured rim light. Cozy-gritty storybook-adventure mood; clean readable shapes with modest detail that survives at 48–96 px. No text, no letters, no numbers, no logo, no signature, no watermark, no border, no frame, no UI, no baked hex grid.

## Applied `negative_prompt`

text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash

Changes vs v1: removed `cartoon, anime, manga, chibi, cute, comic book, cel shading, thick outlines` (now desired); added `oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, metallic shine`; kept `white background, studio backdrop` because every slot still controls its own background (mid-grey tokens, dark sites/motifs).

## Palette

The nine-colour canon from `docs/design/15-retheme-bible.md` §8 is unchanged; only the rendering changed:

| Canon | v2 use |
|---|---|
| soot #17120F / charcoal #2A221C | linework and leather; warm it to umber #312523 for outlines |
| root #6E8F4E | moss green #7D8B50 fills, #C4D553 highlight |
| ember #E0662E | bright accents only; rust cloth fills #9C5A4E |
| gold #E3B341 | dull brass #AD9A70 |
| bone #E7DCC6 | parchment off-whites #E9E5D9 / #E1DFD6 |
| rime, gale, gloam | unchanged (gloam/night pieces) |

## What changed

- `art/prompts.json` — new `style_block` and `negative_prompt`; all 41 slot prompts swept (the old "matte painterly dark folk-fantasy / dry-brush / restrained detail / three-value / single … key light" wording is gone; lighting is now "soft, even … light").
- `art/PROMPTS.md` — global blocks, every slot prompt and every combined avoid list regenerated from the JSON.
- `docs/design/16-art-brief.md` §2 — style, value-structure, lighting and reference wording.
- `docs/design/18-ai-art-prompts.md` — §3.1–3.3 canonical text, §4.3 negative row, §7.2 acceptance, §7.3 failure modes.
- `docs/design/15-retheme-bible.md` §8 — rendering note added; palette untouched.
- The four v1 style-lock images were removed as obsolete; regenerate the style lock in the new style before any batch work.
