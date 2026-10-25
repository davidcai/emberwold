# Style-lock golden set — v2

**Status:** accepted (owner-generated, reviewed 2026-10-25)
**Tool:** ChatGPT desktop app (OpenAI image generation)
**Style:** v2 — stylized 2D illustration, warm ink linework, smooth cel shading (`art/prompts.json` style block)
**Prompt source:** `art/PROMPTS.md` (from `art/prompts.json` v1.0.0)

| Slot | File | Target | Delivered | Notes |
|---|---|---|---|---|
| `hero_emberdrinker` | `hero_emberdrinker.png` | 1:1 · 2048² | 1254² | Primary linework/cel anchor. Upscale in post. |
| `enemy_slot_06` | `enemy_slot_06.png` | 1:1 · 1024² | 1254² | **Substituted for `enemy_slot_01`** by the owner because its rime palette reads better as a reference. Use as the **palette** anchor; hero + motif set the linework/cel. |
| `motif_01_stride` | `motif_01_stride.png` | 4:3 · 1024×768 | 1448×1086 | Flat-emblem anchor; reads at 48 px. |
| `tile_countryside_1` | `tile_countryside_1.png` | 32:37 · 2048×2368 | 1166×1349 | Softer/painterly than the other anchors — apply the shared grade in post. |

## Review

- Ratios correct on all four; resolutions are below target (upscale in Phase 5).
- RGB PNG, no alpha (cut-outs are post step); no text, watermarks or embedded UI found.
- Style notes: hero + motif are closest to the v2 statement; `enemy_slot_06` leans brighter and more saturated (anime-cel) — treat it as the palette reference, not the linework reference; the tile is the softest and will need the shared palette grade.
- No official or third-party art was used as image input.
- PNG masters are local-only and gitignored; regenerate from the prompts if lost.

**Next:** attach these as references for every batch prompt; regenerate the set if the style block changes again.
