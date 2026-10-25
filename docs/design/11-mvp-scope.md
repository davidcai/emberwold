# 11 · Emberwold MVP Scope — the thing we actually build first

**Status:** v1 (Lead) · **Companions:** `10-feasibility-analysis.md`, `12-architecture.md`,
`13-ai-opponents.md`, `14-roadmap.md`

> **One sentence:** Emberwold v1 is a **solo-only, 20–30 minute, single-scenario digital
> Mage Knight** — one hero, a fixed four-tile map, one city to crack, ~40 card definitions,
> full combat phases — that is **fun to play and provably rule-correct** before anything is
> added back.

**Tier naming (used across `10`, `12`, `14`):** this document defines **T1 = "First
Conquest" = v1.0**, the ship target. The larger Solo-Conquest-shaped build is **T2 =
"Classic"** (`12-architecture.md` §12 + §12.4); the 2-week vertical slice is **T0**. T1 is a
strict subset of T2's engine and content model — nothing built for T1 is thrown away.

The rulebook is the truth for *mechanics*; this document decides *which mechanics and
content ship*. Scope is subtracted deliberately, in this order: players → content breadth →
scenario length → polish. Never the core pillars.

## 1. Goals and success criteria

### Must (v1.0 ships only if all true)

| # | Criterion | Measure |
|---|---|---|
| M1 | A complete game can be played start → win/loss → score | One seeded scenario, no soft-locks |
| M2 | Rules correctness on the implemented subset | Golden-trace suite covers every implemented card/site/enemy; zero known deviations |
| M3 | A new player can learn from in-game guidance | First-time player finishes the tutorial scenario without external rules help |
| M4 | Session fits the promise | Median playtime 20–30 min for First Conquest, 45–75 min for Solo Conquest preset |
| M5 | It feels like Mage Knight | Playtest: ≥3/5 board-game veterans say "that's Mage Knight" and "again" |
| M6 | Save/resume + undo work without leaking hidden info | Deterministic replay from save matches original events |

### Nice-to-have (may slip)

* Local hotseat for 2 players (shared screen, no netcode).
* Second hero with a distinctly different playstyle (v1 target: 2 heroes).
* Daily seeded challenge, score history, achievements.
* Sound/music; animated attacks; card art beyond placeholder frames.

### Non-goals (explicitly out)

* Real-time or networked multiplayer; online co-op.
* PvP combat, competitive scoring modes, team scenarios.
* Opponent AI beyond scripted enemy behaviour (see `13`).
* All 7 UE heroes (8 incl. 2026 *Apocalypse Dragon*), all cards, all expansions, all map
tiles, random map generation.
* Full campaign/meta-progression, unlock trees, cosmetic economy.
* Mobile-native apps (web responsive only), console/Steam (web first; packaging later).
* Any use of WizKids artwork, logo, card frames or verbatim card text.

## 2. Experience specification

| Dimension | v1 target |
|---|---|
| Player count | 1 (hotseat co-op optional, same screen) |
| Session length | **First Conquest: 20–30 min**; Classic preset: 45–75 min |
| Difficulty | Tuned to be winnable ~50% on first serious attempt; city assault is the climax |
| Input | Mouse/touch only; no keyboard dependency (hotkeys later) |
| Platform | Desktop web browser (1440×900 baseline, responsive down to tablet) |
| Save model | Autosave at turn boundaries; manual save; one run slot + replay log |
| Undo | Per-turn action undo within the current turn; combat steps undoable until confirmed damage |
| Failure | Losing = failing to conquer the city by the round limit; no permadeath run reset |
| Tone | Dark-fantasy board-game table: readable, matte, card-forward, no 3D camera gimmicks |
| Accessibility | Colour-blind-safe mana/element palette, scalable UI, tooltips/keys, reduced motion |

## 3. Content manifest (v1.0)

Counts are targets for the build, not promises from the rulebook. `game-data/` is the
authoritative inventory and `03-rules-reference.md` the rules source.

| Category | v1.0 target | Notes |
|---|---|---|
| Heroes | **1 at M1, 2 at v1.0** | Shortlist: a direct-combat hero + a mana/magic hero (exact picks per `03` hero tables) |
| Basic Action cards | 1 hero's full 16-card starting deck (M1); 2 decks by v1.0 | Rulebook: each Deed deck = 16 Basic Actions (MKUE p.3; MKUE Walkthrough p.2) |
| Skills | 11 tokens per hero, implement the level-up subset actually reachable (≈6 per hero) | Rulebook: 11 Skill tokens per player (MKUE p.3) |
| Advanced Actions | **12** | Includes monastery-bought actions |
| Spells | **6** | Non-competitive only (solo removes competitive spells, MK 2012 Scenario Book p.17) |
| Artifacts | **4** | Site rewards / deck builders |
| Units | **6** | Recruitable at villages/keeps; commands in combat |
| Enemies | **10 regular + 2 city garrison** | Colour-coded tokens; abilities limited to implemented keywords |
| Sites | **6 types** | Village, monastery, keep, mage tower, magical glade, crystal mine + dungeon/tomb as stretch |
| Map tiles | **4 fixed tiles** (1 start + 2 countryside + 1 city) | Wedge; hand-authored placement for tuning |
| Scenarios | **1** ("First Conquest", tuned) + **1 preset** ("Classic", Solo-Conquest cut) | See §4 |
| Rounds | 3 (Day/Night/Day) for First Conquest; **6 (3 days / 3 nights)** for Classic | ~20–30 min / ~45–75 min |
| Keywords/abilities | ~20 | Resistances, fortify, swift, brutal, poison, paralyze, etc. — only what content uses |

**The content rule:** nothing ships that is not in the manifest, and the manifest only grows
after v1.0 ships. No "just one more card" during the MVP.

## 4. Scenario design

### 4.1 "First Conquest" (default v1 scenario — tuned variant)

Adapts Solo Conquest's shape to a short session. It is a **deliberate Emberwold variant**,
not an official scenario; the Classic preset exists for players who want the official shape.

| Parameter | First Conquest | Official Solo Conquest (reference) |
|---|---|---|
| Players | 1 | 1 |
| Rounds | **3** (Day 1, Night 1, Day 2) | 6 (3 days, 3 nights) |
| Map shape | Wedge, **fixed 4 tiles** | Wedge, 7 countryside + 2 core-city + 2 core non-city |
| Cities | **1 city, level 4** | 2 cities, levels 5 then 8 |
| Dummy player | **Yes** (simplified: consumes tactics + clock pressure) | Yes |
| Heroes | 1 | 1 |
| Deck/skill removals | competitive spells + 1 interactive skill (as official) | same |
| End | City conquered | All cities conquered |
| Scoring | Fame + achievements, tuned weights | Official Solo Conquest scoring table |
| Target win rate | ~50% | Expert |

Setup specifics (tile layout, site placement, enemy seeding, garrison composition, dummy
tactic order) live in `game-data/scenarios.json` once authored; this document defines the
*shape* and the tuning intent.

### 4.2 "Classic" preset

Official Solo Conquest rules as written, reduced content pool. Ships as a second preset if
the engine and content support it without new code (`12-architecture.md` §2 treats scenarios
as data). It exists to validate fidelity and to give veterans the real experience.

### 4.3 What makes it feel like a complete game

* a visible power curve (fame → level → skill → advanced action → spell/artifact → unit);
* at least one "hard choice" per turn (card retention vs. tempo);
* a climax (city assault) that requires preparation across rounds;
* a score screen with a clear "you could have done X" hint.

## 5. Systems: in, out, and why

| System | v1 | Rationale |
|---|---|---|
| Round/Day-Night loop, tactics | ✅ | Load-bearing pacing + mana colour |
| Hand/deck/discard/Deed-deck economy | ✅ | The core of the game |
| Movement, terrain costs, tile reveal | ✅ | Exploration pillar |
| Influence / recruiting / healing | ✅ | Site economy |
| Reputation | ✅ (simplified: single track effects used by v1 sites) | Needed for site interactions; full edge cases deferred |
| Mana: dice, sources, crystals, tokens | ✅ (crystals + source + day/night, no mana-steal edge cases) | Core resource |
| Combat: 4 phases, block/attack/damage, resistances, fortify | ✅ | Card text depends on it; not simplifiable safely |
| Enemy special abilities | ~20 implemented keywords | Only used ones |
| Leveling / skills / advanced actions | ✅ (subset) | Power curve pillar |
| Spells / artifacts / units | ✅ (subset) | Power curve + reward loop |
| Sites: village, monastery, keep, tower, glade, mine | ✅ | Exploration rewards |
| Dungeons/tombs, ruins | ⏳ stretch | Hidden-information content; defer if schedule slips |
| Cities + garrison | ✅ (one, level 4) | The climax |
| PvP combat | ❌ | Not solo; big rules surface |
| Co-op rules (Full Cooperation) | ❌ | v1.1 after hotseat validates multi-hero UI |
| Dummy player | ✅ simplified | Solo pressure; official logic in `03` |
| Scenario variants (Blitz, Mines Liberation, Dungeon Lords) | ❌ | Content, not engine |
| Expansions (Lost Legion/Krang/Tezla) | ❌ | Content breadth only |
| AI opponent | ❌ (scripted enemies only) | See `13` |

## 6. UX screen inventory and flow

```
Title ──▶ New Run ──▶ Hero Select ──▶ [Scenario Setup animation]
   │                                        │
   └──▶ Continue (save)                     ▼
                                     Board + Hand + HUD  ◀──┐
                                        │  │  │             │
                     ┌──────────────────┘  │  └──────────┐  │
                     ▼                     ▼             ▼  │
              Card Detail /          Site Panel      Combat Overlay
              Action Picker          (interact)      (phases, damage)
                     │                     │             │  │
                     └─────────────────────┴─────────────┘  │
                                        ▼                    │
                                  Turn End ──▶ Round End ────┘
                                        ▼
                                  Score / Debrief ──▶ Title
```

Screens (v1 minimum): Title; New Run (hero + preset); Board (map, hand, deck/discard piles,
mana source, unit area, level/fame track, reputation, round/day-night indicator, offers);
Card zoom; Action/legal-action picker; Site panel; Combat overlay; Level-up modal; Unit
offer; Score/debrief; Settings; Rules reference (searchable tips, not full manual); Save
browser; Replay scrubber (v1.1).

**UX principles:** (1) the UI never allows an illegal action — it only offers legal actions;
(2) every card effect animates its value into the combat maths so players learn; (3) hover =
rules explanation; (4) undo is always visible until a hidden-information boundary; (5) no
modal more than one level deep.

## 7. Tutorial and onboarding

* **First Conquest is the tutorial scenario**: guided prompts on turns 1–3 (movement, mana,
  combat, site), then self-directed.
* **Coach marks** for: playing a card sideways, boosting with mana, revealing a tile, block
  vs. attack, damage assignment, level-up.
* **Rules tips** contextual to the currently available actions, with citations page numbers
  (in-engine text we author, not copied rulebook prose).
* **Debrief** explains score and one concrete improvement suggestion.

## 8. Content authoring contract

* All content enters via `game-data/` (schema + effect DSL in `game-data/README.md`).
* Each card/enemy/site definition cites `source` + `page` and a `status`
  (`implemented`/`placeholder`/`omitted`).
* Effects use a closed registry of primitives; adding a primitive is an engine change with
  tests. Adding a card is data + tests only.
* Art is placeholder (frames + icons + colour) until the mechanics are locked; the art
  pipeline is a separate track (`07-assets-art-inventory.md`).
* **Re-themed by construction** (ADR-002, `15-retheme-bible.md`): original world, names and
  terminology; stable neutral internal content IDs; display names, flavour text and art come
  from a content pack; **no Mage Knight names or trademarks in code, asset filenames or UI
  strings**. Art slots and placeholder policy: `16-art-brief.md` + `art/manifest.json`.

## 9. Definition of done (v1.0)

- [ ] Both scenarios playable end-to-end with 1 hero (and a second hero selectable).
- [ ] Every manifest item implemented, tested, and marked `implemented` in `game-data`.
- [ ] Golden-trace suite: ≥1 full game per scenario replayed deterministically.
- [ ] Save/resume and undo verified against hidden-information scenarios.
- [ ] No P0/P1 bugs; no rule deviations in the test suite.
- [ ] Tutorial playthrough completed by ≥3 people unfamiliar with MK.
- [ ] Build < 5 MB gzipped initial load (excluding audio), 60 fps on 2019 laptop integrated GPU.
- [ ] Legal review of shipped names/art/text complete (see `06-legal-ip.md`).

## 10. Open decisions

| # | Decision | Default if nobody objects |
|---|---|---|
| 1 | Hero roster for v1.0 (2 heroes) | Direct-combat + mana/magic pair, finalised from `03` |
| 2 | First Conquest rounds | 3 (Day/Night/Day) |
| 3 | City level | 4 |
| 4 | Include dungeons/tombs in v1? | Stretch only; cut if schedule slips |
| 5 | Hotseat co-op in v1.0 or v1.1? | v1.1 |
| 6 | Art during MVP | Placeholder only |

## Sources

- MKUE Rulebook (P1): deck/skill counts, solo removals, scenario summaries.
- MK 2012 base rulebook (P5): full Solo Conquest scenario rules.
- `01-game-overview.md`, `10-feasibility-analysis.md`, `12-architecture.md`.
