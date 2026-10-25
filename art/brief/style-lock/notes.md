# Style-lock golden set — T1 "First Conquest"

Date: 2026-10-24
Tool: ChatGPT desktop app (OpenAI image generation; model not exposed in-app — record `gpt-image-2` if confirmed).
Prompt source: [art/PROMPTS.md](../../PROMPTS.md), generated from [art/prompts.json](../../prompts.json) v1.0.0 (2026-10-24).
Seeds: none exposed by the tool — consistency is carried by attaching these images as references.
Licence: hobby/private use for now (ADR-001); re-check OpenAI terms before any public release.

| Slot | File | Target ratio / size | Delivered | Verdict |
|---|---|---|---|---|
| `hero_emberdrinker` | `hero_emberdrinker.png` | 1:1 · 2048² | 1254² | **Pass — primary style anchor.** Upscale to 2048 in post. |
| `enemy_slot_01` | `enemy_slot_01.png` | 1:1 · 1024² | 1254² | **Pass, one flag.** Cut out from grey later. Rangier build than the brief's "squat, four-foot" Gutterkin — see deviation 1. |
| `motif_01_stride` | `motif_01_stride.png` | 4:3 · 1024×768 | 1448×1086 | **Pass.** Reads at 48 px. Transparent icon variant still to produce. |
| `tile_countryside_1` | `tile_countryside_1.png` | 32:37 · 2048×2368 | 1166×1349 | **Pass with grade.** Brighter/golden than the palette; edge fade is present. Upscale + grade in post. |

## Review notes

- All four are RGB PNG with no alpha — cut-outs and transparency are post steps (expect this).
- No text, letters, logos, watermarks, frames or embedded UI found.
- Ratios correct on all four; delivered pixel sizes are below target (ChatGPT app output cap), so upscale in post.
- Single warm key light on hero/enemy; motif and tile read as the same game style.
- Silhouette test at 48 px: enemy and motif read; hero and tile are not token pieces.
- Palette: hero/motif on-palette; tile skews golden/umber — fix with the shared grade in Phase 5.
- No official Mage Knight art or known-character silhouette was used as input.

## Deviations

1. **Enemy proportions.** The skirmisher reads leaner/taller than "squat, bandy-legged, four feet tall" in the brief. Either accept this as the Gutterkin direction (then align slots 02–04 to it, i.e. avoid "leaner and taller" wording) or reroll slot 01 with stronger squat cues.
2. **Tile palette.** More golden/umber and purple than the nine-colour set; treat as a grade-pass item, not a reroll. The hearthstead sits close to the top-right crop zone — keep landmarks nearer the centre in future tile generations.

## Next

Generate the rest of the P0 Gutterkin family (`enemy_slot_02`–`04`) with `enemy_slot_01.png` attached as the family reference; keep candidates under `art/source/` (gitignored) until accepted.
