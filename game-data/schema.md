# Emberwold game-data schema (v1.0.0)

Field-level contract for every JSON file in `game-data/`. `tools/validate_data.py`
enforces this file mechanically; keep them in sync. The effect notation is
defined in [README.md](./README.md#3-effect-dsl); this document only fixes the
*shape* of each container.

Conventions used by every file:

* snake_case keys; JSON only (no comments, no trailing commas).
* IDs are globally unique strings `"<domain>:<slug>"`, where the slug is the
  upstream data id (stable across regenerations) — e.g. `basic:rage`,
  `advanced:blood_rage`, `spell:fireball`, `artifact:ruby_ring`, `hero:arythea`,
  `skill:tovak_double_time`, `unit:peasants`, `enemy:diggers`,
  `ruins:altar_blue`, `tile:countryside_1`, `site:village`,
  `scenario:solo_conquest`, `tactic:early_bird`.
* `source` on each item names the file the datum came from; `confidence` is one
  of `official` | `official+upstream` | `upstream-only` | `unverified`.
* Page references ("MKUE Rulebook p.3") point at PDF pages of
  `reference/extracted/*.txt` (marker `=== [page N] ===`).
* `null` means "not stated by our sources". Never guess.
* Every content item carries `mvp` (bool, needed for Emberwold v1.0) and
  `status` (`data-ready` | `placeholder` | `omitted`); see README §3.5. The
  validator checks both fields and the MVP counts in `manifest.mvp_subset`.

---

## 1. Common file envelope

Every data file (except `manifest.json` and `upstream-pin.json`) is:

```jsonc
{
  "schema_version": "1.0.0",
  "domain": "string",             // stable machine name, see table below
  "count": 0,                     // == len(items); validated
  "provenance": {                 // generated files
    "generated_by": "tools/extract_upstream_mkdata.py",
    "schema_version": "1.0.0",
    "upstream": {"repo": "...", "commit": "...", "path": "...", "sha256": "...", "fetched_at": "..."},
    "confidence": "upstream-only",
    "notes": "..."
  },
  "sources": ["..."],             // optional, human-readable source list
  "items": [ /* domain items */ ]
}
```

Hand-maintained files use the same envelope with
`"provenance": {"generated_by": "hand-maintained", ...}`.

Domain names: `heroes`, `basic_actions`, `advanced_actions`, `spells`,
`artifacts`, `skills`, `units`, `enemies`, `ruins_token`, `tiles`, `levels`,
`tactics`, `keywords`, `sites`, `scenarios`, `effect-ops`, `provenance`.

Special containers: `keywords.json` uses `keywords` (38 entries) instead of
`items`; `effect-ops.json` uses `ops` + `op_count`; `upstream-pin.json` is a
flat provenance record with `domain: provenance`.

---

## 2. `heroes.json`

`domain: heroes`

| Field | Type | Notes |
|---|---|---|
| `id` | `"hero:<slug>"` | |
| `name` | string | display name |
| `expansion` | enum | `base` / `lost_legion` / `krang` / `shades_of_tezla` / `unknown` |
| `starting_deck` | string[] | exactly 16 `"basic:*"` ids, duplicates allowed |
| `deck_size` | int | == len(starting_deck) == 16 |
| `starting_crystals` | enum[] | exactly 3 mana colours (dummy-player crystals) |
| `starting_crystals_source` | `official` \| `upstream-mk-data` | |
| `starting_crystals_upstream` | enum[] | upstream's raw value, for audit |
| `starting_crystals_note` | string | |
| `source`, `confidence`, `official_cross_check` | string | |

Top-level extras: `standard_deck` (12 `"basic:*"` ids before hero substitution),
`sources`. Rule: every `starting_deck[*]` id must exist in
`basic-actions.json`.

## 3. `basic-actions.json` / `advanced-actions.json` / `spells.json` / `artifacts.json`

`domain: basic_actions` / `advanced_actions` / `spells` / `artifacts`. Item shape
(card object, see README §3.4):

| Field | Type | Notes |
|---|---|---|
| `id` | `"basic:*"` etc. | domain prefix must match file |
| `name` | string | short card name |
| `card_type` | enum | `basic_action` / `advanced_action` / `spell` / `artifact` |
| `color` | enum | `red`/`blue`/`green`/`white`/`colorless` |
| `expansion` | enum | as above; `unknown` when not provable |
| `hero` | string \| null | owner for hero-specific Basic Actions |
| `powered_by` | enum \| null | mana colour, `any_basic`, `free`, or null |
| `sideways_value` | int | 1 for all current cards |
| `destroy_on_powered` | bool | artifacts throw-away semantics |
| `effects.basic` | effect \| null | |
| `effects.powered` | effect \| null | |
| `categories.basic` / `.powered` | enum[] | `movement`/`combat`/`influence`/`healing`/`special`/`action`/`banner` |
| `in_standard_deck` | bool | basic-actions only |
| `source`, `confidence` | string | |

Top-level extras: `basic-actions.json` carries `deck_composition`;
`advanced-actions.json` = 44 items; `spells.json` = 24; `artifacts.json` = 25.

## 4. `skills.json`

`domain: skills`. Item: `id` (`"skill:<slug>"`), `hero` (slug), `name`
(derived from id, `name_derived: true`), `usage_type` (`once_per_turn` /
`once_per_round` / `passive` / `interactive`), `phase_restriction` (`any` /
`combat_only` / `melee_attack_only` / `ranged_siege_or_attack` / `block_only` /
`no_combat`), `is_motivation` (bool), `effect` (effect \| null),
`implemented` (bool, false when upstream has no effect), `expansion`, `source`,
`confidence`. Top-level `per_hero_counts` (object slug → 10).

## 5. `units.json`

`domain: units`. Item: `id` (`"unit:<slug>"`), `name`, `level` (1–4),
`influence_cost`, `armor`, `recruit_sites` (`village`/`keep`/`mage_tower`/
`monastery`/`city`/`camp`/`magical_glade`), `copies`, `is_hero_unit` (bool),
`reversed_reputation`, `restricted_from_free_recruit`, `abilities` (array of
`{"mana_cost": enum|null, "ability": effect}`, max 4), `expansion`, `source`,
`confidence`. Top-level `counts`.

## 6. `enemies.json`

`domain: enemies`. Item: `id` (`"enemy:<slug>"`), `name`, `color` (`green`,
`gray`, `brown`, `violet`, `white`, `red`), `attack`, `attack_element`,
`armor`, `armor_elusive` (int\|null), `defend` (int\|null), `fame`,
`resistances` (enum[]: `physical`/`fire`/`ice`/`cold_fire`), `abilities`
(enum[] — must exist in `keywords.json` `kind=enemy_ability`), `attacks`
(array of `{"damage","element","ability"}` \| null for single-attack enemies),
`reputation_penalty`/`reputation_bonus` (int\|null), `copies`, `expansion`,
`source`, `confidence`. Top-level `colour_counts` and `total_token_copies`.

## 7. `ruins-tokens.json`

`domain: ruins_token`. Item: `id` (`"ruins:<slug>"`), `kind`
(`altar` | `enemy`). Altar: `cost` (`[[mana_colour, amount], ...]`), `fame`.
Enemy token: `enemy_colors` (enum[]), `rewards` (`artifact`/`spell`/
`advanced_action`/`unit`/`crystals_4`). `source`, `confidence`.

## 8. `tiles.json`

`domain: tiles`. Item: `id` (`"tile:<slug>"`), `name`, `tile_kind`
(`starting` / `countryside` / `core_non_city` / `core_city` / `core_volkare`),
`expansion`, `hex_count` (7), `hexes` array of
`{"q","r","terrain","site","mine_color","deep_mine_colors","rampaging"}` where
`site` is a `site_types` enum value or null and `rampaging` ⊆
`orc_marauder`/`draconum`. Top-level `counts`.
Rules: hex `(q,r)` values unique per tile; `site` values must exist in
`sites.json`; `mine_color` only on `mine` sites.

## 9. `levels.json`

`domain: levels`. `items` = fame thresholds:
`{"op": "fame_threshold", "level": 1..10, "fame": int}` (level 1 fame 0;
ascending). Top-level `level_stats`: array of
`{"min_level","max_level","armor","hand_limit","command_slots"}` covering
levels 1–10.

## 10. `tactics.json` (hand-maintained)

`domain: tactics`. Item: `id` (`"tactic:<slug>"`), `name`, `turn_order` (1–6),
`time_of_day` (`day`/`night`), `effect_kind` (`none`/`on_pick`/`ongoing`/
`activated`), `effect` (effect \| null — null because upstream has no structural
effect data), `effect_summary` (short paraphrase ≤ 200 chars), `source`,
`confidence`, `mvp`, `status`. Top-level `counts: {"day": 6, "night": 6}`.
The validator checks 12 unique IDs with day/night turn orders 1–6 each and that
the ID set equals the `DAY_TACTIC_IDS`/`NIGHT_TACTIC_IDS` lists in upstream
`tactics.rs` (recorded in the extractor output / `upstream-pin.json` provenance).

## 11. `keywords.json` (hand-maintained)

`domain: keywords`.

```jsonc
{
  "enums": {
    "elements": ["physical","fire","ice","cold_fire"],
    "mana_colors": [...], "basic_mana_colors": [...], "card_colors": [...],
    "terrain": [...], "site_types": [...], "recruit_sites": [...],
    "enemy_colors": [...], "combat_types": [...], "combat_phases": [...],
    "card_categories": [...], "time_of_day": [...], "map_shapes": [...],
    "tile_kinds": [...], "expansions": [...], "skill_usage_types": [...],
    "skill_phase_restrictions": [...], "powered_by": [...]
  },
  "keywords": [
    {"id": "kw:fortified", "kind": "enemy_ability", "name": "Fortified",
     "short": "...", "official_ref": "MK Master Reference Sheet p.2"}
  ]
}
```

Validation rules: every enum value used anywhere in the data must be listed
here; every enemy `abilities[]` value must be a `kind=enemy_ability` keyword id
suffix; every `resistances[]` value must be a `kind=unit_resistance` keyword.

## 12. `sites.json` (hand-maintained)

`domain: sites`. Item: `id` (`"site:<slug>"`), `name`, `site_kind`
(`inhabited`/`adventure`/`fortified`/`rampaging`/`special`), `fortified` (bool),
`inhabited` (bool), `adventure_site` (bool), `recruit_sites` (enum[]),
`healing` (`{"influence_per_point": int}` \| null), `garrison`
(`{"color": enemy_color, "count": int, "face": "up"|"down", "reveal": "..."}` \| null),
`entry_combat` (`{"color": enemy_color, "count": int, "night_rules": bool,
"units_allowed": bool}` \| null),
`conquest` (`{"reward": effect, "fame": int|null, "reputation": int|null,
"shield": bool}` \| null), `interaction` (string[] — short options),
`special` (string[] — short bullets), `expansion`, `official_ref`, `source`.
Base-game Site Description card set must have exactly 14 entries
(MKUE Walkthrough p.4); `sites.json` additionally contains the portal (a
starting-tile space, not a site card), 5 expansion sites and the city entry,
20 items total. The 8 MVP sites are the six `mvp_site_types` plus the city and
the portal.

## 13. `scenarios.json` (hand-maintained)

`domain: scenarios`. Item:

| Field | Type | Notes |
|---|---|---|
| `id` | `"scenario:<slug>"` | |
| `name`, `players {min,max}` | | |
| `type` | `solo`/`competitive`/`slightly_competitive`/`cooperative`/`team` | |
| `rounds` | int | total day+night rounds |
| `day_rounds`, `night_rounds` | int | |
| `map_shape` | enum[] | per player count, e.g. `["wedge","wedge","open_4"]` |
| `starting_tile` | `A`/`B`/null | map shape determines it (2012 rulebook p.12) |
| `tiles` | `{countryside, core_city, core_non_city: int[]}` | per player count |
| `cities` | `[{order, level}]` | reveal order |
| `dummy_player` | bool | |
| `skills_enabled` | bool | |
| `spells_available` / `advanced_actions_available` | bool | |
| `elite_units_enabled` | bool | |
| `removed_cards` | string[] | short descriptions |
| `special_rules` | string[] | short paraphrases |
| `tactics` | object | selection/removal rules |
| `end_condition` | string | short paraphrase |
| `scoring` | object | structured summary |
| `mvp` | bool | true only for Solo Conquest |
| `official_ref` | string | |
| `caveat` | string | source limitation |

## 13b. `scenarios.json` MVP entries

Two entries are Emberwold-specific and required by the validator:

* `scenario:first-conquest` — tuned v1.0 scenario: 3 rounds (Day/Night/Day),
  wedge, fixed 4 tiles (1 start + 2 countryside + 1 city), 1 city at level 4,
  1 hero, simplified dummy player, competitive spells + interactive skill
  removed, end = city conquered, scoring structure with tuned weights TODO,
  `map.layout_status: "todo"`.
* `scenario:classic` — official Solo Conquest shape: 6 rounds (3 day + 3 night),
  wedge, 7 countryside + 2 core-city + 2 core non-city tiles, cities level 5
  then 8, dummy player, same removals, official end/scoring.
  Validator cross-checks every one of these parameters. Both carry
  `mvp: true`; the other 10 base scenarios are `mvp: false`, `status: omitted`.

## 14. `effect-ops.json` (generated)

`domain: effect-ops`. Top-level `op_count`, `total_nodes`, `ops[]` with
`{"op": string, "used": int, "fields": string[]}`. This is the **allowed
vocabulary**: the validator fails on any `op` used in card/skill/unit effects
that is absent here, and on any op in the registry with `used == 0`.

## 15. `manifest.json` (hand-maintained index)

Top-level: `schema_version`, `project`, `generated_at`, `owner`, `description`,
`upstream` (repo + commit + no-license flag + pin file), `validator` (command +
last pass/fail summary), `files[]` (path, domain, count, sha256[:16],
source_class, maintainer), `coverage` (status + evidence + notes per domain),
`official_counts` (verified counts with page refs), `mvp_subset` (scenario ids,
hero pair, provisional selections, per-category MVP counts, status legend),
`discrepancies` (ids referencing README §7), `missing`. Every listed file must
exist, its `count` must match the validator's recount, and its sha256 must match
the file content (detects stale data).

## 16. Validator checks

`tools/validate_data.py` enforces, in order:

1. Every `manifest.files[*].path` exists, is valid JSON, and `count` matches.
2. File envelope: required keys, `count == len(items)`.
3. ID shape: `"<expected domain prefix>:<slug>"`, globally unique per file.
4. Item-level required fields and types (per the tables above).
5. Enum fields ⊆ `keywords.json.enums`.
6. Referential integrity:
   * hero `starting_deck` → `basic-actions.json`;
   * `skills[*].hero` → `heroes.json`; `units[*].recruit_sites` ⊆ enums;
   * `tiles[*].hexes[*].site` → `sites.json`;
   * `sites[*].garrison.color` / `entry_combat.color` ⊆ enemy colours;
   * `ruins-tokens[*].enemy_colors` ⊆ enemy colours;
   * `scenarios[*].starting_tile` ∈ {A,B,null}.
7. Effect DSL: every `op` in `effect-ops.json`; nested op values validated by
   walking the tree; no `"op"` value outside the registry.
8. Coverage counts: official counts in `manifest.official_counts` checked
   against the actual item counts where the sources state them (16-card
   starting decks, 11 countryside / 8 core base tiles, 14 base Site Description
   cards, 12 tactics, 7 heroes, 10 levels, 6 Solo Conquest rounds and 7
   countryside tiles, plus the two scenario presets' parameters).
9. Effect registry freshness: re-walking all effects produces exactly the
   recorded (op, used) multiset; a stale registry is an error.
10. MVP markers: `mvp` boolean + `status` enum on every item; per-category MVP
    counts equal `manifest.mvp_subset.counts`; required scenarios/sites/tiles
    exist and carry the expected status.
11. sha256: every JSON data file hash matches `manifest.files[].sha256`.

Current status: **all checks pass** (9662 checks, 0 errors, 0 warnings).
