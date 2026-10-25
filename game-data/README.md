# Miniknight game data — schema, provenance and coverage

**Status:** research prototype · **Owner:** data-extractor · **Version:** 0.1.0

Machine-readable, **research-only** data extracted for the Miniknight feasibility
study of *Mage Knight Board Game* (Vlaada Chvátil, WizKids 2011 / Ultimate
Edition 2018). Nothing here is an official product or licensed asset.

> **IP note.** This directory contains *structured research notes*: short names,
> numeric stats, and a compact effect notation. It deliberately contains **no
> card flavour text and no rules prose copied from the game or from the upstream
> project**. All long-form rules live in `docs/research/` with page citations.
> The data is a derived index of game mechanics for a prototype; do not ship it
> (or the names it indexes) commercially without a licence from WizKids.
> See `docs/research/06-legal-ip.md` (owned by the precedent-analyst).

---

## 1. Quick start

```bash
# validate every file, reference and coverage count
.venv/bin/python tools/validate_data.py

# regenerate the upstream-derived files (network; caches under /tmp)
.venv/bin/python tools/extract_upstream_mkdata.py
.venv/bin/python tools/extract_upstream_mkdata.py --no-fetch   # offline, cached
```

The validator prints a per-domain summary and exits non-zero on any problem.
`game-data/manifest.json` is the index: file list, counts, sha256, source and
coverage status for every data file.

## 2. Directory layout

| File | Domain | Upstream items | Source class |
|---|---|---|---|
| `manifest.json` | index + coverage | — | hand-maintained |
| `schema.md` | field-level schema + validator rules | — | hand-maintained |
| `keywords.json` | enums + ability/keyword glossary + rules constants | 38 keywords | official (paraphrased) |
| `heroes.json` | 7 heroes, starting decks, dummy crystals | 7 | official counts + upstream detail |
| `basic-actions.json` | Basic Action cards | 28 card types | official counts + upstream effects |
| `advanced-actions.json` | Advanced Action cards | 44 | upstream only |
| `spells.json` | Spell cards | 24 | official counts + upstream effects |
| `artifacts.json` | Artifact cards | 25 | upstream only |
| `skills.json` | Hero skills | 70 | upstream only |
| `units.json` | Unit cards (regular + elite) | 31 | upstream only |
| `enemies.json` | Enemy token definitions by pile colour | 72 types | official piles + upstream stats |
| `ruins-tokens.json` | Ancient Ruins tokens | 15 | upstream only |
| `tiles.json` | Map tile hex layouts | 27 | official counts + upstream layouts |
| `sites.json` | Map site rules (14 base Site Description cards + expansion sites + portal) | 20 | official (paraphrased) |
| `scenarios.json` | Scenario setups (10 base + 2 Miniknight presets) | 12 | official |
| `tactics.json` | Day/Night Tactic cards | 12 | upstream reference (paraphrased) |
| `levels.json` | Fame thresholds + level stats | 10 levels | **official** (board artwork) + upstream detail |
| `effect-ops.json` | registry of every effect operation | 142 ops | generated |
| `upstream-pin.json` | pinned upstream commit + file hashes | — | generated |

Two source *classes* are used everywhere:

* **official** — `reference/extracted/MKUE_rulebook.txt`, `MKUE_walkthrough.txt`,
  `MKUE_expansions_rulebook.txt`, `MK_master_reference_sheet.txt`, and the newly
  supplied `MK_base_rulebook_2012.txt` (base printing, bundles the full Scenario
  Book). Page references are PDF page numbers of those extractions.
* **upstream** — the community engine
  [mage-knight-digital/MageKnight](https://github.com/mage-knight-digital/MageKnight),
  crate `packages/engine-rs/crates/mk-data` at the commit pinned in
  `upstream-pin.json`. This is used for the information the rulebooks do not
  enumerate: per-card effect structures, enemy stats, tile layouts, skill
  effects. It is **not** an authority and has no LICENSE file at the pinned
  revision — see the discrepancies section.

Every item carries `"source"` and `"confidence"`; every file carries a
`"provenance"` block with the upstream commit, file sha256 and a notes field.

## 3. Effect DSL

Card effects, skill effects and unit abilities are stored as a small JSON
operation tree. The notation was **defined before** the data was generated and
is the only representation emitted by the extractor. It is *derived* from the
upstream engine's effect enum and cross-checked against official rules, but the
op names are ours.

### 3.1 Grammar

```text
effect  := { "op": <string>, <field>: <value>, ... }      an operation node
         | [ <effect>, ... ]                              a list of effects
         | <number> | <string> | <boolean> | null         a scalar / enum value
```

Rules:

1. Every operation node has an `op` key; `op` names are `snake_case` verbs.
2. Fields are `snake_case`; their meaning is documented per op in
   the core-op table in §3.2 and in the machine-readable registry
   `effect-ops.json` (`ops[].op`, `ops[].used`, `ops[].fields`).
3. Scalar enum values are lower-case snake strings taken from the registries in
   `keywords.json` (`element`, `combat_type`, `color`, `mana_color`,
   `terrain`, `site_type`, `phase`, ...). An unrecognised enum value is a
   validation error, so typos cannot hide.
4. Optional values are `null` (omitted field) rather than invented defaults.
5. `null` as an effect means "not modelled upstream" — several complex
   Artifact/Skill effects are partially modelled; treat missing detail as a
   research gap, never as "no effect".
6. Money-unit convention: `amount` values are positive integers; a cost is a
   separate field (e.g. `{"op": "discard_cost", "count": 1}`) or a list.

### 3.2 Core operations (the shape you will meet most)

| `op` | Fields (typical) | Meaning |
|---|---|---|
| `gain_move` | `amount` | move points |
| `gain_influence` | `amount` | influence points |
| `gain_attack` | `amount`, `combat_type` (`melee`/`ranged`/`siege`), `element` | attack points |
| `gain_block` | `amount`, `element` | block points |
| `gain_healing` | `amount` | healing points |
| `gain_mana` | `color`, `amount` | mana tokens (`color` ∈ mana colours) |
| `gain_crystal` | `color`, `amount` | mana crystals |
| `gain_fame` | `amount` | fame |
| `draw_cards` | `count` | draw from Deed deck |
| `take_wound` | — | put a Wound in hand |
| `heal` / `heal_unit` / `heal_all_units` | `amount` | healing |
| `choice` | `options: [effect, ...]` | choose one branch |
| `compound` | `effects: [effect, ...]` | resolve all, in order |
| `conditional` | `condition`, `then_effect`, `else_effect` | if/else |
| `scaling` | `base_effect`, `factor`, `bonus_per_count`, `maximum` | scaling by a count |
| `apply_modifier` | `effect`, `duration`, `scope` | lasting modifier |
| `select_combat_enemy` | `template...` | affects one enemy in combat |
| `discard_cost` | `count`, `filter` | additional cost |
| `change_reputation` | `amount` | Reputation change |
| `gain_mana_any_color`, `gain_mana_and_crystal`, `gain_mana_choose` | `color`/`count` | flexible mana |
| `convert_mana_to_crystal`, `roll_for_crystals`, `roll_die_for_wound` | | dice/mana conversion |
| `noop` | — | explicitly no effect |
| `other` | `effect_type` | upstream placeholder for a special handler; not fully modelled |

`effect-ops.json` lists all 142 ops with usage counts and the field names each
op actually uses; the validator rejects any op not in that registry.

### 3.3 Worked examples

```jsonc
// March — Basic Action, green. basic: Move 2, powered: Move 4.
"effects": {
  "basic":   {"op": "gain_move", "amount": 2},
  "powered": {"op": "gain_move", "amount": 4}
}

// Blood Rage — Basic Action, red.
"effects": {
  "basic": {"op": "choice", "options": [
    {"op": "gain_attack", "amount": 2, "combat_type": "melee", "element": "physical"},
    {"op": "compound", "effects": [
      {"op": "take_wound"},
      {"op": "gain_attack", "amount": 5, "combat_type": "melee", "element": "physical"}
    ]}
  ]},
  "powered": {"op": "gain_attack", "amount": 4, "combat_type": "melee", "element": "physical"}
}

// Unit ability: Foresters' second ability (move with terrain discounts).
{"mana_cost": null, "ability": {
  "op": "move_with_terrain_reduction", "move_value": 2,
  "terrain_reductions": [["forest", -1, 0], ["hills", -1, 0], ["swamp", -1, 0]]
}}
```

### 3.4 Cards: basic vs powered vs throw-away

Every card object has the shape

```jsonc
{
  "id": "spell:fireball",        // globally unique, "<domain>:<upstream id>"
  "name": "Fireball",
  "card_type": "spell",
  "color": "red",
  "expansion": "unknown",        // base | lost_legion | krang | shades_of_tezla | unknown
  "powered_by": "red",           // mana colour | "any_basic" | "free" | null (wound)
  "sideways_value": 1,           // value when played sideways (card rules)
  "destroy_on_powered": false,   // artifacts: throw away for the powered effect
  "effects": { "basic": <effect|null>, "powered": <effect|null> },
  "categories": { "basic": ["movement"], "powered": ["combat"] },
  "source": "upstream-mk-data/cards.rs",
  "confidence": "upstream-only"
}
```

* Action cards: `basic` is the free effect, `powered` costs one mana of `color`.
* Spells: `basic` costs the colour's mana; `powered` additionally needs black mana
  at Night (MKUE Rulebook p.4).
* Artifacts: `basic` is reusable, `powered` is one-shot; `destroy_on_powered` is true.
* A card with no `powered_by` cannot be powered.

### 3.5 MVP and status markers

Every item carries two editorial fields used by the MVP scope
(`docs/design/11-mvp-scope.md`):

* `mvp` (bool) — **does Miniknight v1.0 need this item?** Counts are indexed in
  `manifest.json → mvp_subset.counts` and validated.
* `status` — v1.0 content status for the item:
  * `data-ready` — data complete and provenance strong enough to implement now;
  * `placeholder` — data present but partly unverified (typical for any
    upstream-only card effect) or the selection is provisional;
  * `omitted` — data exists for later, but v1.0 does not need it.

`mvp` is a scope marker, not a quality marker: a `data-ready` MVP site can ship
while a high-quality non-MVP card is `omitted`. Selections marked *provisional*
(hero pair, 12 advanced actions, 6 spells, 4 artifacts, 6 units, enemy picks,
fixed 4-tile layout) are documented in `manifest.json → mvp_subset` and should
be re-confirmed by the Lead in `docs/research/03-rules-reference.md`.

## 4. Enums and keywords

`keywords.json` has two halves:

* `enums` — canonical vocabularies used by the effect DSL
  (`elements`, `mana_colors`, `basic_mana_colors`, `card_colors`, `terrain`,
  `site_types`, `recruit_sites`, `enemy_colors`, `combat_types`,
  `combat_phases`, `card_categories`, `time_of_day`, `map_shapes`).
* `keywords` — glossary entries: `id` (`kw:*`), `kind`
  (`enemy_ability`, `unit_resistance`, `combat`, `resource`, `site`),
  `name`, `short` (our own ≤ 1-sentence paraphrase), `official_ref`
  (page citation into `reference/extracted/`), optionally `src`.

Use `keywords.json` for rules-engine constants: it is the vocabulary the
validator enforces for `abilities`/`resistances`/`element`/`color` fields.

## 5. Provenance and derivation rules

1. **Official outranks upstream.** Where a rulebook states a fact (number of
   tiles, starting deck size, city levels, site rules, scenario setup, enemy
   ability definitions), the data uses that fact and cites the page. Upstream is
   only used where official text is silent or unavailable.
2. **No invention.** If neither source states a fact, the field is `null` or the
   item is marked `confidence: "upstream-only"` / `"unverified"` and listed in
   the coverage table. We never write plausible-sounding card text.
3. **Card effect text does not exist in our rulebooks.** Per-card effect text is
   printed only on the physical cards. Therefore every card `effects` tree is
   `confidence: "upstream-only"` — a **structural cross-check, not official
   wording**. This is the single biggest verification gap in this data set.
4. **Set attribution.** `expansion` is `base` only when the official sources
   prove it (base hero sets, tile sections, scenario setup). Everything else is
   `unknown` rather than guessed. See §7.
5. **Generation is reproducible.** `tools/extract_upstream_mkdata.py` fetches
   the pinned upstream files, records their sha256 in the file provenance and in
   `upstream-pin.json`, and rewrites the generated files. Hand-maintained files
   are marked as such in `manifest.json`.
6. **No flavour text.** Card/spell/artifact names are the short card names only
   (needed as stable keys); no flavour text, no rules sentences.
7. **Scope is marked, not guessed away.** `mvp`/`status` encode the v1.0 content
   decision; selections that are still open (hero pair, card picks) are called
   out as provisional in `manifest.json → mvp_subset` rather than presented as
   final.

## 6. Coverage

Legend: **complete** = all items we know exist are present with usable fields;
**partial** = items present but a meaningful field/set is unverified or missing;
**missing** = not in this data set.

| Domain | Present | Official evidence | Status |
|---|---|---|---|
| Heroes | 7 (`heroes.json`) | 4 base heroes (MKUE Walkthrough p.5); Krang/Braevalar named in expansions rulebook; Wolfhawk ⚠️ | **partial** — UE set has Wolfhawk/Krang/Braevalar on top of the 4 base heroes; 7 total, not 8 |
| Starting decks | 7 × 16 cards | deck size 16 (MKUE Rulebook p.3); 12 shared types (Walkthrough p.4) | **complete** for modelled heroes |
| Basic Actions | 28 types | 16-card decks, 12 shared + hero-specific substitutions (Walkthrough p.4) | **complete** (20 base types + 8 expansion-hero types) |
| Advanced Actions | 44 | base deck numbered 65–92 = 28 cards (UE Walkthrough p.4); 2012 scenario book | **partial** — per-card expansion attribution unknown; likely 28 base + 16 Lost Legion |
| Spells | 24 | base deck 1–20 with competitive spells 17–20 (2012 rulebook p.14/p.17); UE competitive spells 109–112 | **partial** — likely 20 base + 4 Lost Legion; attribution unknown |
| Artifacts | 25 | rulebooks state no count | **partial** — count unverified |
| Skills | 70 (7 × 10) | 11 Skill tokens per hero, 1 removed per mode (Walkthrough p.5; Rulebook p.3) | **partial** — one skill per hero missing; 1 stub has no effect |
| Units | 31 | rulebooks state no count | **partial** — includes 4 hero units + 1 "Heroes" unit; set attribution unknown |
| Enemies | 72 types / 6 colours | seven token piles at setup (MKUE Rulebook p.3); abilities defined on master ref sheet p.2 | **partial** — pile colours complete; expansion attribution unknown; `copies` unverified |
| Ancient Ruins tokens | 15 | master ref sheet p.1 describes altar vs enemy tokens | **partial** — 15 vs official count unverified |
| Tiles | 27 (2 starting + 14 countryside + 10 core + 1 Volkare) | 11 countryside + 8 core in base (Walkthrough p.2) | **complete for base**; Lost Legion tiles tagged |
| Sites | 20 (14 base cards + 5 expansion sites + portal) | 14 Site Description cards in base (Walkthrough p.4) | **complete for base**; 8 sites marked MVP (six site types + city + portal) |
| Scenarios | 12 = 10 base + `first-conquest` + `classic` | 2012 base Scenario Book p.12–19 | **partial** — UE Scenario Book unavailable; expansion scenarios missing; both Miniknight presets present |
| Tactics | 12 (6 day + 6 night) | 6+6 per rulebook setup | **partial** — effects paraphrased from upstream reference, unverified; all 12 needed by v1.0 round loop |
| Levels | 10 | level 1–2 armour 2 / hand 5, odd levels grant Command token (Rulebook p.3) | **complete enough**; full table upstream-only |
| Effect registry | 142 ops / 1104 nodes | — | **complete** (generated from the data above) |
| Miniknight MVP subset | 2 heroes, 16 basic actions, 20 skills, 12 AAs, 6 spells, 4 artifacts, 6 units, 12 enemies, 8 sites, 4 tiles, 2 scenarios | scope doc `11-mvp-scope.md` | **complete** — see `manifest.json → mvp_subset` |

**MVP slice** (v1.0 content manifest) is fully present in the data set: both
presets (`scenario:first-conquest` tuned 3-round variant and `scenario:classic`
official Solo Conquest shape), the provisional 2-hero pair, their 16-card decks
and skills, 12 advanced actions, 6 spells, 4 artifacts, 6 units, 12 enemies,
6 MVP site types + city + portal, 4 fixed tiles, 12 tactics and 10 levels. The
first-conquest **map layout** and **tuned scoring weights** are deliberately left
as `layout_status: "todo"` / `scoring.tuning.status: "todo"` in
`scenarios.json` — they are design decisions to be authored after playtesting,
not facts to extract. Everything else is breadth/quality work listed above.

## 7. Known discrepancies and open issues

These were found while cross-checking the two source classes. They matter to a
rules engine and to anyone re-verifying the data.

1. **No upstream licence.** `mage-knight-digital/MageKnight` has no LICENSE file
   at the pinned commit (GitHub contents API, checked while fetching). Therefore
   upstream-derived *structure* is treated as a research cross-check only, is
   not vendored, and no upstream code/text is copied. Recorded in
   `upstream-pin.json` and re-checked by the precedent-analyst.
2. **Skill count.** Official: 11 skill tokens per hero, one interactive skill
   removed depending on game mode (MKUE Walkthrough p.5; MKUE Rulebook p.3).
   Upstream: 10 skills per hero (70 total), `skills.rs` header says "10 skills
   per hero". **One skill per hero is missing** (the non-selected interactive
   skill) and `skill:krang_mana_enhancement` exists only as a stub with no
   effect. Skills data is name/usage-complete but effect-partial.
3. **Hero count.** The task brief says "8 heroes"; official UE content gives
   4 base heroes plus Wolfhawk (Lost Legion), Krang (Krang), Braevalar (Shades
   of Tezla) = **7**. No eighth hero appears in any source we have. (Wolfhawk's
   expansion is community knowledge; the extracted rulebooks do not name her.)
4. **Goldyx dummy crystals.** Official example: "Goldyx has green, green and
   blue" (MKUE Rulebook p.15). Upstream `heroes.rs` says blue, blue, white. The
   data uses the **official** value and keeps `starting_crystals_upstream` for
   audit.
5. **Advanced Action count.** UE Walkthrough p.4 says 28 cards (numbers 65–80
   used in the first scenario, 81–92 removed). Upstream ships 44. Working
   assumption: 28 base + 16 Lost Legion; **per-card attribution unverified**.
6. **Spell numbering mismatch.** 2012 rulebook numbers spells 1–20 and calls
   the four competitive ones 17–20; the UE rulebook calls the same four
   competitive spells 109–112. Both refer to Mana Meltdown, Mana Claim, Mind
   Read and Energy Flow. The two printings renumbered/reordered their decks; do
   not assume a 1:1 offset.
7. **Enemy/unit set mixing.** Upstream `enemies.rs` says "base game + Lost
   Legion" but contains enemies introduced in later expansion rulebooks (e.g.
   Centaur Outriders, Elven Protectors, Crystal Sprites are described in
   `MKUE_expansions_rulebook.txt` p.2). `units.rs` says "all base game units"
   but includes hero units and expansion-flavoured units. Set attribution is
   `unknown` rather than guessed.
8. **Scenario source.** The UE Scenario Book is a separate booklet we do not
   have. `scenarios.json` is therefore built from the **2012 base rulebook's**
   bundled Scenario Book (the Lead supplied `MK_base_rulebook_2012.txt`,
   p.12–19), cross-checked against the UE Rulebook's scenario summaries
   (p.14–22). UE-only scenarios (Volkare's Quest/Return, Tezla scenarios) are
   absent. Solo Conquest values agree between the two sources.
9. **Upstream scenarios are incomplete.** `mk-data/scenarios.rs` models only
   First Reconnaissance and (2/3/4p) Full/Blitz Conquest — **it has no Solo
   Conquest config at all**, so our Solo Conquest is official-derived.
10. **Tactic effects.** `mk-data/tactics.rs` contains only IDs. Wording in
    `tactics.json` is paraphrased from upstream `docs/reference/tactics.md` and
    has not been checked against physical Tactic cards; treat as unverified.
11. **Site rules source.** The official Site Description cards are not in our
    PDFs; site entries paraphrase the master reference sheet (p.1–2) and the
    rulebook's site sections. Short paraphrases only — no card text.
12. **Enemy token copies.** `copies` (usually 2) comes from upstream and is not
    verified against a physical component manifest. Needed before implementing
    token-pile exhaustion rules.
13. **Card numbering.** UE walkthrough references Advanced Actions 65–92 and
    the 2012 rulebook references spells 17–20, i.e. two different numbering
    schemes across printings. Nothing in the data encodes card numbers, so no
    conflict, but external references may not line up.
14. **Tiles.** 14 countryside tiles appear upstream (11 base + 3 Lost Legion);
    base-game Walkthrough p.2 confirms 11 + 8 core. Starting tile A is used by
    the Wedge map, B by fully-open maps (2012 rulebook p.12) — encoded in
    `scenarios.json`.

15. **Fame thresholds (P0, resolved).** Upstream `levels.rs` gives
    3/8/14/21/29/38/48/59/71; the official board gives
    **3/8/15/24/35/48/63/80/99** (deltas 3,5,7,9,11,13,15,17,19). Verified on
    2026-10-24 by rendering the walkthrough's Fame and Reputation board photo at
    ~300 dpi and reading every row start (MKUE Walkthrough p.6); the text also
    confirms level 2 at 3 and level 3 at 8. `levels.json` now uses the official
    values and marks them `verified-official`. The old upstream values must not
    be used by the engine.

## 8. How the data was generated

Generated: `heroes`, `basic-actions`, `advanced-actions`, `spells`, `artifacts`,
`skills`, `units`, `enemies`, `ruins-tokens`, `tiles`, `levels`,
`effect-ops`, `upstream-pin`.

Hand-maintained: `keywords`, `sites`, `scenarios`, `tactics`, `manifest`,
`schema.md`, this README.

```bash
# 1. fetch upstream mk-data sources at HEAD (commit recorded), parse, write JSON
.venv/bin/python tools/extract_upstream_mkdata.py
# 2. validate shape, references, enums, effect ops, coverage counts
.venv/bin/python tools/validate_data.py
```

Extractor notes: it uses a small Rust-expression parser (struct literals, enum
variants, `vec![]`, `Some/None`, const resolution) rather than regex-only
scraping, so the generated JSON is structurally faithful. It downloads up to
~240 KB per file and caches them under `/tmp/miniknight-upstream-cache`; no
upstream files are committed to this repo.

## Sources

* Official, primary:
  * `reference/extracted/MKUE_rulebook.txt` — Ultimate Edition rulebook (PDF pages cited as "p.N").
  * `reference/extracted/MKUE_walkthrough.txt` — UE walkthrough (components, hero setup, first game).
  * `reference/extracted/MKUE_expansions_rulebook.txt` — expansion deltas (Lost Legion/Krang/Shades of Tezla).
  * `reference/extracted/MK_master_reference_sheet.txt` — one-sheet site/ability reference.
  * `reference/extracted/MK_base_rulebook_2012.txt` — 2012 base rulebook incl. full Scenario Book (p.12–19).
* Upstream cross-check, pinned in `upstream-pin.json`:
  `https://github.com/mage-knight-digital/MageKnight` →
  `packages/engine-rs/crates/mk-data/src/{cards,enemies,units,tiles,skills,heroes,levels,tactics,ruins_tokens,scenarios}.rs`.
* IP/legal analysis: `docs/research/06-legal-ip.md` (precedent-analyst).
