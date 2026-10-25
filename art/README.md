# art/ — art production

This folder holds the **art production manifest**, not the art itself.

* [`manifest.json`](manifest.json) — one slot per asset for the T1 "First Conquest" build
  (41 slots; 19 P0). Every slot starts as a programmatic placeholder and gets a final
  `art_ref` only when an AI-generated piece passes acceptance.
* Direction, specs, palette and acceptance: [`../docs/design/16-art-brief.md`](../docs/design/16-art-brief.md)
* **Copy-paste prompts, one per asset (start here):** [`PROMPTS.md`](PROMPTS.md)
  ([`prompts.json`](prompts.json) is the machine-readable canonical version).
* AI workflow + tool/licence guidance: [`../docs/design/18-ai-art-prompts.md`](../docs/design/18-ai-art-prompts.md)
* Names, world and visual identity: [`../docs/design/15-retheme-bible.md`](../docs/design/15-retheme-bible.md)

## Rules

1. **Original art only.** Never place official *Mage Knight* art, scans, screenshots or
   extracted card images here — not even temporarily.
2. **Neutral IDs only** in filenames (`hero/emberdrinker_portrait@2x.png`), never working
   titles or IP-bearing names.
3. `source/` holds layered originals and is gitignored (large binaries). Only web-ready finals
   and the manifest are committed.
4. A piece is not "done" until it passes the acceptance checklist in
   `docs/design/16-art-brief.md` §6 and the manifest is updated (`status: final`,
   `art_ref`, `source` credit).
5. Engineering must never wait on art: placeholders are a supported state, not a temporary
   hack.

## Suggested folder layout (created as art arrives)

```
art/
  manifest.json
  brief/style-lock/   # approved golden references — PNG masters local-only (gitignored), notes.md tracked
  source/             # layered originals + licence snapshots (gitignored)
  final/              # delivered PNGs/WebP, named by neutral ID
```
