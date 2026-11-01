# art/branding — Emberwold wordmark

**Status: committed internal asset, not publicly released.** Committed 2026-10-31 (ADR-008).
ADR-007 still defers public product branding — store pages, domains, marketing and public use of
the wordmark — until v1 and until the `15` §11 name screen is done. These files are the lockup
selected from a three-arm design run on 2026-10-31.

## Files

| File | Use |
|---|---|
| [`logo.svg`](logo.svg) | Primary lockup: mark + wordmark, transparent. Soot ink + ember flame; place on bone/light. |
| [`logo_reversed.svg`](logo_reversed.svg) | Bone wordmark + ring, ember flame; for soot/dark backgrounds. |
| [`logo_mono.svg`](logo_mono.svg) | One-colour soot; stamps, embossing, low-colour contexts. |
| [`mark.svg`](mark.svg) | Mark alone (flame-in-ring); favicon/app icon source. |
| [`logo@512.png`](logo@512.png), [`logo@128.png`](logo@128.png) | RGBA PNG fallbacks of the lockup (512 / 128 px wide). |
| [`mark@512.png`](mark@512.png), [`mark@32.png`](mark@32.png), [`mark@16.png`](mark@16.png) | Mark PNG fallbacks / favicon sizes. |
| [`fonts.md`](fonts.md) | Typeface provenance and licence. |

SVGs contain outlined paths only (no `<text>`, no embedded font, no external references); each
carries an accessible `<title>` but no rendered lettering beyond the outlined wordmark.

## Composition (measured)

- **Wordmark**: "Emberwold" in Cinzel 700, outlined; 0.02 em tracking; full-capital `E` plus
  Cinzel small capitals, so the string stays exactly `Emberwold`.
- **Mark**: hand-drawn flame-in-ring, 0.86 × cap height, 0.55 × mark-width clearspace to the
  wordmark, mark centred on the cap band.
- **Palette**: soot `#17120F`, bone `#E7DCC6`, ember `#E0662E` (single accent, flame only).
- **Lockup viewBox**: `-0.83 -74.80 734.35 79.69` (≈9.2:1). **Mark viewBox**: `0 0 64.86 64.86`.

## Usage rules

Do:
1. Use `logo.svg` on bone/light, `logo_reversed.svg` on soot/dark, `logo_mono.svg` for one colour.
2. Keep clearspace around the lockup of at least 0.55 × mark width (≈34 units here).
3. Use the lockup at ≥128 px wide; below that use `mark.svg`. The mark survives at 16 px.
4. Scale proportionally.

Don't:
1. Recolour the flame or add a second accent colour.
2. Add gradients, glows, shadows, outlines or textures.
3. Re-set the name in another typeface, or generate lettering with an image model.
4. Show the full lockup at 16 px overall width — it is ≈9.2:1 and unreadable there; use the mark.
5. Publish before the `15` §11 name screen and the ADR-007 gate are cleared.

## Provenance

- Selected arm B of a three-arm parallel design run (2026-10-31); hand-authored SVG, no image
  model and no AI lettering used.
- Letterforms outlined with fontTools 4.68.0 from Cinzel (variable font, instanced `wght=700`);
  licence and hashes in [`fonts.md`](fonts.md). No font binary is committed or embedded.
- SVG bytes: `logo.svg` 29,730 · `logo_mono.svg` 29,730 · `logo_reversed.svg` 29,730 ·
  `mark.svg` 9,377.
